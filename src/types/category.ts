export type CategoryType = "Income" | "Expense";
export type CategoryStatus = "Active" | "Inactive";

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  status: CategoryStatus;
  createdAt: string;
}
