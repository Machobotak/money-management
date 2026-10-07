export type DebtType = "Debt" | "Receivable";
export type DebtStatus = "Pending" | "Partially Paid" | "Paid" | "Overdue";

export interface Debt {
  id: string;
  type: DebtType;
  person: string;
  amount: number;
  paidAmount: number;
  dueDate: string; // YYYY-MM-DD or ""
  status: DebtStatus;
  description: string;
  createdAt: string;
}
