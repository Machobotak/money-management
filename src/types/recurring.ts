export type RecurringFrequency = "Daily" | "Weekly" | "Monthly" | "Yearly";
export type RecurringType = "Income" | "Expense";

export interface Recurring {
  id: string;
  name: string;
  type: RecurringType;
  category: string;
  amount: number;
  account: string;
  frequency: RecurringFrequency;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD or ""
  active: boolean;
  createdAt: string;
}
