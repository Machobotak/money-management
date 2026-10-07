import type { Account } from "@/types/account";
import type { Budget } from "@/types/budget";
import type { Debt, DebtStatus } from "@/types/debt";
import type { Recurring } from "@/types/recurring";
import type { Transaction } from "@/types/transaction";

export type BudgetStatus = "Safe" | "Warning" | "Critical" | "Over Budget";

export interface MonthlyTotals {
  income: number;
  expense: number;
  net: number;
}

export function inRange(date: string, from?: string, to?: string): boolean {
  const day = date.slice(0, 10);
  if (from && day < from) return false;
  if (to && day > to) return false;
  return true;
}

/** Balance = initial + income - expense - transferOut + transferIn (per account name). */
export function balanceForAccount(account: Account, transactions: Transaction[]): number {
  let balance = account.initialBalance;
  for (const tx of transactions) {
    if (tx.type === "Income" && tx.account === account.name) balance += tx.amount;
    else if (tx.type === "Expense" && tx.account === account.name) balance -= tx.amount;
    else if (tx.type === "Transfer") {
      if (tx.fromAccount === account.name) balance -= tx.amount;
      if (tx.toAccount === account.name) balance += tx.amount;
    }
  }
  return balance;
}

/** Internal transfers cancel out, so the total only moves through income/expense. */
export function totalBalance(accounts: Account[], transactions: Transaction[]): number {
  return accounts.reduce((sum, account) => sum + balanceForAccount(account, transactions), 0);
}

export function sumIncome(transactions: Transaction[]): number {
  return transactions.reduce((sum, tx) => (tx.type === "Income" ? sum + tx.amount : sum), 0);
}

export function sumExpense(transactions: Transaction[]): number {
  return transactions.reduce((sum, tx) => (tx.type === "Expense" ? sum + tx.amount : sum), 0);
}

/** Cash Flow = Income - Expense. Transfers are excluded. */
export function cashFlow(transactions: Transaction[]): number {
  return sumIncome(transactions) - sumExpense(transactions);
}

export function monthlyTotals(transactions: Transaction[]): MonthlyTotals {
  const income = sumIncome(transactions);
  const expense = sumExpense(transactions);
  return { income, expense, net: income - expense };
}

export function budgetUsagePercent(spent: number, budget: number): number {
  if (budget <= 0) return 0;
  return (spent / budget) * 100;
}

export function budgetStatus(percent: number): BudgetStatus {
  if (percent > 100) return "Over Budget";
  if (percent > 90) return "Critical";
  if (percent >= 70) return "Warning";
  return "Safe";
}

export function debtRemaining(debt: Debt): number {
  return Math.max(0, debt.amount - debt.paidAmount);
}

/** Overdue is derived on read, never stored. */
export function deriveDebtStatus(debt: Debt, today: string): DebtStatus {
  const remaining = debt.amount - debt.paidAmount;
  if (remaining <= 0) return "Paid";
  if (debt.paidAmount > 0) return "Partially Paid";
  if (debt.dueDate && debt.dueDate < today) return "Overdue";
  return "Pending";
}

export function expenseByCategory(
  transactions: Transaction[],
): Array<{ category: string; total: number }> {
  const totals = new Map<string, number>();
  for (const tx of transactions) {
    if (tx.type !== "Expense") continue;
    const key = tx.category || "Lainnya";
    totals.set(key, (totals.get(key) ?? 0) + tx.amount);
  }
  return [...totals.entries()]
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);
}

export function spentByCategory(transactions: Transaction[]): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const tx of transactions) {
    if (tx.type !== "Expense") continue;
    const key = tx.category || "Lainnya";
    totals[key] = (totals[key] ?? 0) + tx.amount;
  }
  return totals;
}

export interface MonthBucket extends MonthlyTotals {
  month: string;
}

export function monthlyBuckets(transactions: Transaction[], months: string[]): MonthBucket[] {
  return months.map((month) => {
    const scoped = transactions.filter((tx) => tx.date.slice(0, 7) === month);
    const totals = monthlyTotals(scoped);
    return { month, ...totals };
  });
}

export function budgetSummary(budgets: Budget[], spent: Record<string, number>) {
  const totalBudget = budgets.reduce((sum, budget) => sum + budget.amount, 0);
  const totalSpent = budgets.reduce((sum, budget) => sum + (spent[budget.category] ?? 0), 0);
  return { totalBudget, totalSpent, remaining: totalBudget - totalSpent };
}

function daysInMonth(year: number, monthIndex: number): number {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + days));
  return date.toISOString().slice(0, 10);
}

function stepDate(iso: string, frequency: Recurring["frequency"]): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (frequency === "Daily") return addDays(iso, 1);
  if (frequency === "Weekly") return addDays(iso, 7);
  if (frequency === "Yearly") {
    const date = new Date(Date.UTC(y + 1, m - 1, Math.min(d, daysInMonth(y + 1, m - 1))));
    return date.toISOString().slice(0, 10);
  }
  // Monthly: keep the day-of-month, clamped to the end of the target month.
  const date = new Date(Date.UTC(y, m, Math.min(d, daysInMonth(y, m))));
  return date.toISOString().slice(0, 10);
}

/** First occurrence on/after `fromDate` (inclusive), respecting endDate. */
export function nextOccurrence(recurring: Recurring, fromDate: string): string | null {
  if (!recurring.startDate) return null;
  const end = recurring.endDate || "";
  let cursor = recurring.startDate;
  if (end && cursor > end) return null;

  for (let guard = 0; guard < 1000 && cursor < fromDate; guard += 1) {
    cursor = stepDate(cursor, recurring.frequency);
    if (end && cursor > end) return null;
  }
  if (cursor < recurring.startDate) return null;
  return cursor;
}

export function dueRecurring(recurring: Recurring[], today: string): Recurring[] {
  return recurring.filter((item) => {
    if (!item.active) return false;
    const next = nextOccurrence(item, today);
    return next !== null && next <= today;
  });
}

export function monthsBack(endMonth: string, count: number): string[] {
  const [year, month] = endMonth.split("-").map(Number);
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(Date.UTC(year, month - 1 - (count - 1 - index), 1));
    return date.toISOString().slice(0, 7);
  });
}
