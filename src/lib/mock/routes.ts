import {
  balanceForAccount,
  budgetSummary,
  deriveDebtStatus,
  dueRecurring,
  expenseByCategory,
  monthlyBuckets,
  monthlyTotals,
  monthsBack,
  nextOccurrence,
  spentByCategory,
  totalBalance,
} from "@/lib/calculations/finance";
import { PUBLIC_ERRORS } from "@/lib/errors";
import { currentMonth, monthBounds, todayISO, weekBounds } from "@/lib/format-date";
import { accountCreateSchema, accountUpdateSchema } from "@/lib/validations/account";
import { budgetCreateSchema, budgetUpdateSchema } from "@/lib/validations/budget";
import { categoryCreateSchema, categoryUpdateSchema } from "@/lib/validations/category";
import { firstIssue } from "@/lib/validations/common";
import { debtCreateSchema, debtPaymentSchema, debtUpdateSchema } from "@/lib/validations/debt";
import { recurringCreateSchema, recurringUpdateSchema } from "@/lib/validations/recurring";
import { transactionSchema } from "@/lib/validations/transaction";
import type { Account } from "@/types/account";
import type { Budget } from "@/types/budget";
import type { Category } from "@/types/category";
import type { Debt } from "@/types/debt";
import type { Recurring } from "@/types/recurring";
import type { Transaction } from "@/types/transaction";
import { MockHttpError } from "./error";
import {
  buildTransaction,
  filterTransactions,
  sortByDateDesc,
  transactionUsesAccount,
  transactionUsesCategory,
  withDerivedDebtStatuses,
} from "./ledger";
import {
  clearSession,
  nextId,
  readDataset,
  readSession,
  resetDataset,
  storageInfo,
  updateDataset,
  writeSession,
} from "./store";
import type { DemoDataset } from "./types";

const DEMO_USER = {
  name: "Andi Prasetyo",
  email: "andi@buku-besar.demo",
  role: "Pemilik Buku",
};

const IDEMPOTENCY_TTL_MS = 5 * 60 * 1000;

const idempotency = new Map<string, { body: string; at: number; response: unknown }>();
const seenKeys: string[] = [];

function rememberIdempotency(key: string, body: string, response: unknown): void {
  const now = Date.now();
  idempotency.set(key, { body, at: now, response });
  seenKeys.push(key);
  while (seenKeys.length > 0 && now - (idempotency.get(seenKeys[0])?.at ?? 0) > IDEMPOTENCY_TTL_MS) {
    const stale = seenKeys.shift();
    if (stale) idempotency.delete(stale);
  }
}

/** Zero-width decoration the seed uses on account numbers; search ignores it. */
function normalizeName(value: string): string {
  return value.replace(/[\u2000-\u206f\u2022\u00b7]/g, "").trim().toLowerCase();
}

function uniqueName(
  entries: Array<{ id: string; name: string }>,
  name: string,
  exceptId: string | null,
  message: string,
): void {
  const clash = entries.some(
    (entry) => entry.id !== exceptId && normalizeName(entry.name) === normalizeName(name),
  );
  if (clash) throw new MockHttpError(message, 409);
}

function parseBody<T>(body: unknown): T {
  if (!body || typeof body !== "object") {
    throw new MockHttpError("Permintaan tidak valid.", 400);
  }
  return body as T;
}

type Query = Record<string, string>;

// ---------------------------------------------------------------------------
// Auth: a demonstration only. Any password opens the book.
// ---------------------------------------------------------------------------

function login(): { ok: true } {
  writeSession({ user: DEMO_USER, signedInAt: new Date().toISOString() });
  return { ok: true };
}

function logout(): { ok: true } {
  clearSession();
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Transactions
// ---------------------------------------------------------------------------

function listTransactions(query: Query): unknown {
  const dataset = readDataset();
  const page = Math.max(1, Number(query.page ?? 1) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit ?? 20) || 20));

  const matched = sortByDateDesc(
    filterTransactions(dataset.transactions, {
      from: query.from,
      to: query.to,
      type: query.type,
      category: query.category,
      account: query.account,
      q: query.q,
    }),
  );

  const total = matched.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const start = (page - 1) * limit;

  return {
    transactions: matched.slice(start, start + limit),
    total,
    page,
    limit,
    totalPages,
  };
}

function createTransaction(body: unknown, headers: Record<string, string>): unknown {
  const parsed = transactionSchema.safeParse(parseBody(body));
  if (!parsed.success) throw new MockHttpError(firstIssue(parsed.error), 400);

  const key = headers["idempotency-key"] ?? "";
  if (key) {
    const bodyText = JSON.stringify(body);
    const previous = idempotency.get(key);
    if (previous && Date.now() - previous.at < IDEMPOTENCY_TTL_MS) {
      if (previous.body === bodyText) return previous.response;
      throw new MockHttpError(PUBLIC_ERRORS.duplicateTransaction, 409);
    }
  }

  const created = updateDataset((dataset) => {
    const transaction: Transaction = {
      ...buildTransaction(dataset, parsed.data),
      id: nextId("tx"),
    };
    return { ...dataset, transactions: [...dataset.transactions, transaction] };
  });

  const transaction = created.transactions[created.transactions.length - 1];
  const response = { transaction };
  if (key) rememberIdempotency(key, JSON.stringify(body), response);
  return response;
}

function updateTransaction(id: string, body: unknown): unknown {
  const parsed = transactionSchema.safeParse(parseBody(body));
  if (!parsed.success) throw new MockHttpError(firstIssue(parsed.error), 400);

  let updated: Transaction | null = null;
  updateDataset((dataset) => {
    const existing = dataset.transactions.find((tx) => tx.id === id);
    if (!existing) throw new MockHttpError(PUBLIC_ERRORS.transactionNotFound, 404);
    const next: Transaction = {
      ...buildTransaction(dataset, parsed.data),
      id: existing.id,
      createdAt: existing.createdAt,
    };
    updated = next;
    return {
      ...dataset,
      transactions: dataset.transactions.map((tx) => (tx.id === id ? next : tx)),
    };
  });
  return { transaction: updated };
}

function deleteTransaction(id: string): unknown {
  updateDataset((dataset) => {
    if (!dataset.transactions.some((tx) => tx.id === id)) {
      throw new MockHttpError(PUBLIC_ERRORS.transactionNotFound, 404);
    }
    return { ...dataset, transactions: dataset.transactions.filter((tx) => tx.id !== id) };
  });
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Accounts
// ---------------------------------------------------------------------------

function accountBalances(dataset: DemoDataset) {
  const balances: Record<string, number> = {};
  const transactionCounts: Record<string, number> = {};
  for (const account of dataset.accounts) {
    balances[account.name] = balanceForAccount(account, dataset.transactions);
    const touches = dataset.transactions.filter(
      (tx) =>
        tx.account === account.name ||
        tx.fromAccount === account.name ||
        tx.toAccount === account.name,
    );
    transactionCounts[account.name] = touches.length;
  }
  return { balances, transactionCounts };
}

function listAccounts(): unknown {
  const dataset = readDataset();
  return { accounts: dataset.accounts, ...accountBalances(dataset) };
}

function createAccount(body: unknown): unknown {
  const parsed = accountCreateSchema.safeParse(parseBody(body));
  if (!parsed.success) throw new MockHttpError(firstIssue(parsed.error), 400);

  let created: Account | null = null;
  updateDataset((dataset) => {
    uniqueName(dataset.accounts, parsed.data.name, null, "Nama akun sudah dipakai.");
    created = {
      id: nextId("acc"),
      name: parsed.data.name,
      type: parsed.data.type,
      initialBalance: parsed.data.initialBalance,
      status: parsed.data.status,
      accountNumber: parsed.data.accountNumber,
      createdAt: new Date().toISOString(),
    };
    if (!created) throw new MockHttpError(PUBLIC_ERRORS.save, 500);
    return { ...dataset, accounts: [...dataset.accounts, created] };
  });
  return { account: created };
}

function updateAccount(id: string, body: unknown): unknown {
  const parsed = accountUpdateSchema.safeParse(parseBody(body));
  if (!parsed.success) throw new MockHttpError(firstIssue(parsed.error), 400);

  let updated: Account | null = null;
  updateDataset((dataset) => {
    const existing = dataset.accounts.find((account) => account.id === id);
    if (!existing) throw new MockHttpError(PUBLIC_ERRORS.accountNotFound, 404);
    if (parsed.data.name) {
      uniqueName(dataset.accounts, parsed.data.name, id, "Nama akun sudah dipakai.");
    }
    const next: Account = {
      ...existing,
      ...parsed.data,
      id: existing.id,
      createdAt: existing.createdAt,
    };
    updated = next;
    return {
      ...dataset,
      accounts: dataset.accounts.map((account) => (account.id === id ? next : account)),
    };
  });
  return { account: updated };
}

function deleteAccount(id: string): unknown {
  updateDataset((dataset) => {
    const existing = dataset.accounts.find((account) => account.id === id);
    if (!existing) throw new MockHttpError(PUBLIC_ERRORS.accountNotFound, 404);
    if (transactionUsesAccount(dataset, existing.name)) {
      throw new MockHttpError("Akun masih memiliki transaksi. Nonaktifkan saja.", 409);
    }
    return { ...dataset, accounts: dataset.accounts.filter((account) => account.id !== id) };
  });
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

function listCategories(): unknown {
  return { categories: readDataset().categories };
}

function createCategory(body: unknown): unknown {
  const parsed = categoryCreateSchema.safeParse(parseBody(body));
  if (!parsed.success) throw new MockHttpError(firstIssue(parsed.error), 400);

  const created: Category = {
    id: nextId("cat"),
    name: parsed.data.name,
    type: parsed.data.type,
    status: parsed.data.status,
    createdAt: new Date().toISOString(),
  };
  updateDataset((dataset) => {
    const clash = dataset.categories.some(
      (category) =>
        category.type === created.type &&
        normalizeName(category.name) === normalizeName(created.name),
    );
    if (clash) throw new MockHttpError("Kategori ini sudah ada.", 409);
    return { ...dataset, categories: [...dataset.categories, created] };
  });
  return { category: created };
}

function updateCategory(id: string, body: unknown): unknown {
  const parsed = categoryUpdateSchema.safeParse(parseBody(body));
  if (!parsed.success) throw new MockHttpError(firstIssue(parsed.error), 400);

  let updated: Category | null = null;
  updateDataset((dataset) => {
    const existing = dataset.categories.find((category) => category.id === id);
    if (!existing) throw new MockHttpError(PUBLIC_ERRORS.categoryNotFound, 404);
    const next: Category = {
      ...existing,
      ...parsed.data,
      id: existing.id,
      createdAt: existing.createdAt,
    };
    const clash = dataset.categories.some(
      (category) =>
        category.id !== id &&
        category.type === next.type &&
        normalizeName(category.name) === normalizeName(next.name),
    );
    if (clash) throw new MockHttpError("Kategori ini sudah ada.", 409);
    updated = next;
    return {
      ...dataset,
      categories: dataset.categories.map((category) => (category.id === id ? next : category)),
    };
  });
  return { category: updated };
}

function deleteCategory(id: string): unknown {
  updateDataset((dataset) => {
    const existing = dataset.categories.find((category) => category.id === id);
    if (!existing) throw new MockHttpError(PUBLIC_ERRORS.categoryNotFound, 404);
    if (transactionUsesCategory(dataset, existing.name)) {
      throw new MockHttpError("Kategori masih dipakai. Nonaktifkan saja.", 409);
    }
    return { ...dataset, categories: dataset.categories.filter((category) => category.id !== id) };
  });
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Budgets
// ---------------------------------------------------------------------------

function budgetPayload(dataset: DemoDataset, month: string) {
  const { from, to } = monthBounds(month);
  const budgets = dataset.budgets.filter((budget) => budget.month === month);
  const scoped = dataset.transactions.filter((tx) => tx.date >= from && tx.date <= to);
  const spent = spentByCategory(scoped);
  const summary = budgetSummary(budgets, spent);
  return { budgets, spent, summary };
}

function listBudgets(query: Query): unknown {
  const month = query.month ?? currentMonth();
  return budgetPayload(readDataset(), month);
}

function createBudget(body: unknown): unknown {
  const parsed = budgetCreateSchema.safeParse(parseBody(body));
  if (!parsed.success) throw new MockHttpError(firstIssue(parsed.error), 400);

  const created: Budget = {
    id: nextId("bud"),
    month: parsed.data.month,
    category: parsed.data.category,
    amount: parsed.data.amount,
    createdAt: new Date().toISOString(),
  };
  updateDataset((dataset) => {
    const clash = dataset.budgets.some(
      (budget) => budget.month === created.month && budget.category === created.category,
    );
    if (clash) throw new MockHttpError(PUBLIC_ERRORS.duplicateBudget, 409);
    return { ...dataset, budgets: [...dataset.budgets, created] };
  });
  return { budget: created };
}

function updateBudget(id: string, body: unknown): unknown {
  const parsed = budgetUpdateSchema.safeParse(parseBody(body));
  if (!parsed.success) throw new MockHttpError(firstIssue(parsed.error), 400);

  let updated: Budget | null = null;
  updateDataset((dataset) => {
    const existing = dataset.budgets.find((budget) => budget.id === id);
    if (!existing) throw new MockHttpError(PUBLIC_ERRORS.budgetNotFound, 404);
    const next: Budget = {
      ...existing,
      ...parsed.data,
      id: existing.id,
      createdAt: existing.createdAt,
    };
    const clash = dataset.budgets.some(
      (budget) => budget.id !== id && budget.month === next.month && budget.category === next.category,
    );
    if (clash) throw new MockHttpError(PUBLIC_ERRORS.duplicateBudget, 409);
    updated = next;
    return {
      ...dataset,
      budgets: dataset.budgets.map((budget) => (budget.id === id ? next : budget)),
    };
  });
  return { budget: updated };
}

function deleteBudget(id: string): unknown {
  updateDataset((dataset) => {
    if (!dataset.budgets.some((budget) => budget.id === id)) {
      throw new MockHttpError(PUBLIC_ERRORS.budgetNotFound, 404);
    }
    return { ...dataset, budgets: dataset.budgets.filter((budget) => budget.id !== id) };
  });
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Debts & receivables
// ---------------------------------------------------------------------------

function listDebts(query: Query): unknown {
  const dataset = readDataset();
  const derived = withDerivedDebtStatuses(dataset.debts);
  const debts = query.type ? derived.filter((debt) => debt.type === query.type) : derived;
  return { debts };
}

function createDebt(body: unknown): unknown {
  const parsed = debtCreateSchema.safeParse(parseBody(body));
  if (!parsed.success) throw new MockHttpError(firstIssue(parsed.error), 400);

  const created: Debt = {
    id: nextId("debt"),
    type: parsed.data.type,
    person: parsed.data.person,
    amount: parsed.data.amount,
    paidAmount: parsed.data.paidAmount,
    dueDate: parsed.data.dueDate,
    status: "Pending",
    description: parsed.data.description,
    createdAt: new Date().toISOString(),
  };
  updateDataset((dataset) => ({ ...dataset, debts: [...dataset.debts, created] }));
  return { debt: { ...created, status: deriveDebtStatus(created, todayISO()) } };
}

function updateDebt(id: string, body: unknown): unknown {
  const payload = parseBody<Record<string, unknown>>(body);
  const isPayment = "payAmount" in payload && payload.payAmount !== undefined;

  const edit = isPayment ? null : debtUpdateSchema.safeParse(payload);
  if (edit && !edit.success) throw new MockHttpError(firstIssue(edit.error), 400);

  let payAmount: number | null = null;
  if (isPayment) {
    const payment = debtPaymentSchema.safeParse(payload);
    if (!payment.success) throw new MockHttpError(firstIssue(payment.error), 400);
    payAmount = payment.data.payAmount;
  }

  let updated: Debt | null = null;
  updateDataset((dataset) => {
    const existing = dataset.debts.find((debt) => debt.id === id);
    if (!existing) throw new MockHttpError(PUBLIC_ERRORS.debtNotFound, 404);

    const editedPaid = edit?.success ? edit.data.paidAmount : undefined;
    const amount = (edit?.success ? edit.data.amount : undefined) ?? existing.amount;
    const base =
      payAmount !== null ? existing.paidAmount + payAmount : editedPaid ?? existing.paidAmount;
    if (base > amount) throw new MockHttpError(PUBLIC_ERRORS.overPayment, 400);

    const merged: Debt = {
      ...existing,
      ...(edit?.success ? edit.data : {}),
      id: existing.id,
      createdAt: existing.createdAt,
      amount,
      paidAmount: Math.min(amount, base),
    };
    const next: Debt = { ...merged, status: deriveDebtStatus(merged, todayISO()) };
    updated = next;
    return { ...dataset, debts: dataset.debts.map((debt) => (debt.id === id ? next : debt)) };
  });
  return { debt: updated };
}

function deleteDebt(id: string): unknown {
  updateDataset((dataset) => {
    if (!dataset.debts.some((debt) => debt.id === id)) {
      throw new MockHttpError(PUBLIC_ERRORS.debtNotFound, 404);
    }
    return { ...dataset, debts: dataset.debts.filter((debt) => debt.id !== id) };
  });
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Recurring rules, and printing the transactions they are due for
// ---------------------------------------------------------------------------

function listRecurring(): unknown {
  return { recurring: readDataset().recurring };
}

function createRecurring(body: unknown): unknown {
  const parsed = recurringCreateSchema.safeParse(parseBody(body));
  if (!parsed.success) throw new MockHttpError(firstIssue(parsed.error), 400);

  const created: Recurring = { id: nextId("rec"), ...parsed.data, createdAt: new Date().toISOString() };
  updateDataset((dataset) => ({ ...dataset, recurring: [...dataset.recurring, created] }));
  return { recurring: created };
}

function updateRecurring(id: string, body: unknown): unknown {
  const parsed = recurringUpdateSchema.safeParse(parseBody(body));
  if (!parsed.success) throw new MockHttpError(firstIssue(parsed.error), 400);

  let updated: Recurring | null = null;
  updateDataset((dataset) => {
    const existing = dataset.recurring.find((item) => item.id === id);
    if (!existing) throw new MockHttpError(PUBLIC_ERRORS.recurringNotFound, 404);
    const next: Recurring = {
      ...existing,
      ...parsed.data,
      id: existing.id,
      createdAt: existing.createdAt,
    };
    updated = next;
    return {
      ...dataset,
      recurring: dataset.recurring.map((item) => (item.id === id ? next : item)),
    };
  });
  return { recurring: updated };
}

function deleteRecurring(id: string): unknown {
  updateDataset((dataset) => {
    if (!dataset.recurring.some((item) => item.id === id)) {
      throw new MockHttpError(PUBLIC_ERRORS.recurringNotFound, 404);
    }
    return { ...dataset, recurring: dataset.recurring.filter((item) => item.id !== id) };
  });
  return { ok: true };
}

function transactionFromRule(rule: Recurring, date: string): Transaction {
  return {
    id: nextId("tx"),
    date,
    type: rule.type,
    category: rule.category,
    amount: rule.amount,
    account: rule.account,
    fromAccount: "",
    toAccount: "",
    description: rule.name,
    createdAt: new Date().toISOString(),
  };
}

function generateRecurring(id: string): unknown {
  const today = todayISO();
  let generated: Transaction | null = null;

  updateDataset((dataset) => {
    const rule = dataset.recurring.find((item) => item.id === id);
    if (!rule) throw new MockHttpError(PUBLIC_ERRORS.recurringNotFound, 404);
    const date = nextOccurrence(rule, today);
    if (!date || date > today) {
      throw new MockHttpError("Belum waktunya. Transaksi berikutnya belum jatuh tempo.", 400);
    }
    const transaction = transactionFromRule(rule, date);
    generated = transaction;
    return { ...dataset, transactions: [...dataset.transactions, transaction] };
  });

  return { transaction: generated, generated: generated ? [generated] : [] };
}

function generateDueRecurring(): unknown {
  const today = todayISO();
  const generated: Transaction[] = [];
  const planned = dueRecurring(readDataset().recurring, today).map((rule) => ({
    id: rule.id,
    date: nextOccurrence(rule, today) ?? today,
  }));
  const skipped = planned.length > 0 ? [] : readDataset().recurring.map((rule) => rule.name);

  if (planned.length > 0) {
    updateDataset((current) => {
      const additions: Transaction[] = [];
      for (const entry of planned) {
        const rule = current.recurring.find((item) => item.id === entry.id);
        if (rule) additions.push(transactionFromRule(rule, entry.date));
      }
      generated.push(...additions);
      return { ...current, transactions: [...current.transactions, ...additions] };
    });
  }

  return { generated, skipped };
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

function settingsStatus(): unknown {
  return {
    storage: storageInfo(),
    user: readSession()?.user ?? DEMO_USER,
  };
}

function settingsReset(): unknown {
  resetDataset();
  return { ok: true, storage: storageInfo() };
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

/** Dashboard roll-up: balances, buckets, category breakdown, and the last few entries. */
function analyticsSummary(query: Query): unknown {
  const dataset = readDataset();
  const transactions = dataset.transactions;
  const month = currentMonth();
  const today = todayISO();
  const week = weekBounds(today);
  const parsed = Number.parseInt(query.months ?? "", 10);
  const months = Number.isFinite(parsed) ? Math.min(24, Math.max(1, parsed)) : 6;

  const totals = monthlyTotals(transactions.filter((tx) => tx.date.slice(0, 7) === month));
  const todayTotals = monthlyTotals(transactions.filter((tx) => tx.date.slice(0, 10) === today));
  const weekTotals = monthlyTotals(
    transactions.filter((tx) => tx.date >= week.from && tx.date <= week.to),
  );
  const scoped = filterTransactions(transactions, {
    from: query.from,
    to: query.to,
    type: "Expense",
  });

  return {
    summary: {
      totalBalance: totalBalance(dataset.accounts, transactions),
      monthlyIncome: totals.income,
      monthlyExpense: totals.expense,
      netCashFlow: totals.net,
      today: { date: today, ...todayTotals },
      week: { ...week, ...weekTotals },
    },
    buckets: monthlyBuckets(transactions, monthsBack(month, months)),
    expenseByCategory: expenseByCategory(scoped),
    recent: sortByDateDesc(transactions).slice(0, 5),
  };
}

/**
 * One entry point for every request the app makes. Paths are matched exactly as
 * the original server exposed them; the HTTP verb is not part of the contract,
 * so it is ignored here on purpose.
 */
export function mockRequest<T>(
  url: string,
  init?: { method?: string; body?: unknown; headers?: Record<string, string> },
): Promise<T> {
  const { promise, resolve, reject } = Promise.withResolvers<T>();
  // A beat of latency so skeletons and spinners read as real work.
  setTimeout(() => {
    try {
      resolve(dispatch<T>(url, init));
    } catch (error) {
      if (error instanceof MockHttpError) {
        reject(new Error(error.message));
        return;
      }
      reject(error instanceof Error ? error : new Error(PUBLIC_ERRORS.load));
    }
  }, 40 + Math.random() * 90);
  return promise;
}

function dispatch<T>(url: string, init?: { body?: unknown; headers?: Record<string, string> }): T {
  const parsed = new URL(url, "http://mock.local");
  const path = parsed.pathname;
  const query: Query = {};
  parsed.searchParams.forEach((value, key) => {
    query[key] = value;
  });

  const body = init?.body;
  const headers: Record<string, string> = {};
  for (const [key, value] of Object.entries(init?.headers ?? {})) {
    headers[key.toLowerCase()] = value;
  }

  if (path === "/api/analytics/summary") {
    return analyticsSummary(query) as T;
  }

  if (path === "/api/transactions") {
    return (body === undefined ? listTransactions(query) : createTransaction(body, headers)) as T;
  }
  const transactionMatch = /^\/api\/transactions\/([^/]+)$/.exec(path);
  if (transactionMatch) {
    const id = decodeURIComponent(transactionMatch[1]);
    return (body === undefined ? deleteTransaction(id) : updateTransaction(id, body)) as T;
  }

  if (path === "/api/accounts") {
    return (body === undefined ? listAccounts() : createAccount(body)) as T;
  }
  const accountMatch = /^\/api\/accounts\/([^/]+)$/.exec(path);
  if (accountMatch) {
    const id = decodeURIComponent(accountMatch[1]);
    return (body === undefined ? deleteAccount(id) : updateAccount(id, body)) as T;
  }

  if (path === "/api/categories") {
    return (body === undefined ? listCategories() : createCategory(body)) as T;
  }
  const categoryMatch = /^\/api\/categories\/([^/]+)$/.exec(path);
  if (categoryMatch) {
    const id = decodeURIComponent(categoryMatch[1]);
    return (body === undefined ? deleteCategory(id) : updateCategory(id, body)) as T;
  }

  if (path === "/api/budgets") {
    return (body === undefined ? listBudgets(query) : createBudget(body)) as T;
  }
  const budgetMatch = /^\/api\/budgets\/([^/]+)$/.exec(path);
  if (budgetMatch) {
    const id = decodeURIComponent(budgetMatch[1]);
    return (body === undefined ? deleteBudget(id) : updateBudget(id, body)) as T;
  }

  if (path === "/api/debts") {
    return (body === undefined ? listDebts(query) : createDebt(body)) as T;
  }
  const debtMatch = /^\/api\/debts\/([^/]+)$/.exec(path);
  if (debtMatch) {
    const id = decodeURIComponent(debtMatch[1]);
    return (body === undefined ? deleteDebt(id) : updateDebt(id, body)) as T;
  }

  if (path === "/api/recurring") {
    return (body === undefined ? listRecurring() : createRecurring(body)) as T;
  }
  if (path === "/api/recurring/generate-due") {
    return generateDueRecurring() as T;
  }
  const recurringGenerateMatch = /^\/api\/recurring\/([^/]+)\/generate$/.exec(path);
  if (recurringGenerateMatch) {
    return generateRecurring(decodeURIComponent(recurringGenerateMatch[1])) as T;
  }
  const recurringMatch = /^\/api\/recurring\/([^/]+)$/.exec(path);
  if (recurringMatch) {
    const id = decodeURIComponent(recurringMatch[1]);
    return (body === undefined ? deleteRecurring(id) : updateRecurring(id, body)) as T;
  }

  if (path === "/api/settings/status") return settingsStatus() as T;
  if (path === "/api/settings/reset") return settingsReset() as T;

  if (path === "/api/auth/login") return login() as T;
  if (path === "/api/auth/logout") return logout() as T;

  throw new MockHttpError(PUBLIC_ERRORS.load, 404);
}
