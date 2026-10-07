import { deriveDebtStatus } from "@/lib/calculations/finance";
import { todayISO } from "@/lib/format-date";
import type { Debt } from "@/types/debt";
import type { Transaction } from "@/types/transaction";
import type { TransactionParsed } from "@/lib/validations/transaction";
import { MockHttpError } from "./error";
import type { DemoDataset } from "./types";

export interface TransactionFilters {
  from?: string;
  to?: string;
  type?: string;
  category?: string;
  account?: string;
  q?: string;
}

/** Mirrors the server-side filter: same fields, same matching rules. */
export function filterTransactions(
  transactions: Transaction[],
  filters: TransactionFilters,
): Transaction[] {
  const query = (filters.q ?? "").trim().toLowerCase();
  return transactions.filter((tx) => {
    if (filters.from && tx.date < filters.from) return false;
    if (filters.to && tx.date > filters.to) return false;
    if (filters.type && tx.type !== filters.type) return false;
    if (filters.category && tx.category !== filters.category) return false;
    if (
      filters.account &&
      tx.account !== filters.account &&
      tx.fromAccount !== filters.account &&
      tx.toAccount !== filters.account
    ) {
      return false;
    }
    if (query) {
      const haystack = (
        tx.description +
        " " +
        tx.category +
        " " +
        tx.account +
        " " +
        tx.fromAccount +
        " " +
        tx.toAccount
      ).toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });
}

export function sortByDateDesc(transactions: Transaction[]): Transaction[] {
  return [...transactions].sort((a, b) => {
    if (a.date === b.date) return b.createdAt.localeCompare(a.createdAt);
    return b.date.localeCompare(a.date);
  });
}

/**
 * Turns a validated payload into a stored transaction, resolving account ids to
 * names exactly like the original server did, so the stored shape is identical.
 */
export function buildTransaction(dataset: DemoDataset, input: TransactionParsed): Transaction {
  const activeAccountNames = new Set(
    dataset.accounts.filter((account) => account.status === "Active").map((account) => account.name),
  );
  const activeCategoryNames = new Set(
    dataset.categories
      .filter((category) => category.status === "Active")
      .map((category) => category.type + "|" + category.name),
  );
  const nameOf = (id: string) => dataset.accounts.find((account) => account.id === id)?.name ?? "";

  const createdAt = new Date().toISOString();

  if (input.type === "Transfer") {
    const fromName = nameOf(input.fromAccount);
    const toName = nameOf(input.toAccount);
    if (!fromName || !toName) throw new MockHttpError("Akun tidak ditemukan.", 404);
    if (fromName === toName) throw new MockHttpError("Akun asal dan tujuan tidak boleh sama.", 400);
    if (!activeAccountNames.has(fromName) || !activeAccountNames.has(toName)) {
      throw new MockHttpError("Akun tidak aktif tidak bisa dipakai untuk transaksi baru.", 400);
    }
    return {
      id: "",
      date: input.date,
      type: "Transfer",
      category: "",
      amount: input.amount,
      account: "",
      fromAccount: fromName,
      toAccount: toName,
      description: input.description,
      createdAt,
    };
  }

  const accountName = nameOf(input.account);
  if (!accountName) throw new MockHttpError("Akun tidak ditemukan.", 404);
  if (!activeAccountNames.has(accountName)) {
    throw new MockHttpError("Akun tidak aktif tidak bisa dipakai untuk transaksi baru.", 400);
  }
  if (!activeCategoryNames.has(input.type + "|" + input.category)) {
    throw new MockHttpError(
      "Kategori tidak sesuai atau tidak aktif untuk jenis transaksi ini.",
      400,
    );
  }

  return {
    id: "",
    date: input.date,
    type: input.type,
    category: input.category,
    amount: input.amount,
    account: accountName,
    fromAccount: "",
    toAccount: "",
    description: input.description,
    createdAt,
  };
}

export function transactionUsesAccount(dataset: DemoDataset, name: string): boolean {
  return dataset.transactions.some(
    (tx) => tx.account === name || tx.fromAccount === name || tx.toAccount === name,
  );
}

export function transactionUsesCategory(dataset: DemoDataset, name: string): boolean {
  if (dataset.transactions.some((tx) => tx.category === name)) return true;
  if (dataset.budgets.some((budget) => budget.category === name)) return true;
  return dataset.recurring.some((item) => item.category === name);
}

/**
 * Overdue is derived on read, never trusted from storage — the same rule the
 * original applied against the sheet, minus the write-back.
 */
export function withDerivedDebtStatuses(debts: Debt[]): Debt[] {
  const today = todayISO();
  return debts.map((debt) => ({ ...debt, status: deriveDebtStatus(debt, today) }));
}
