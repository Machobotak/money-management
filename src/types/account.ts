export type AccountType = "Cash" | "Bank" | "E-Wallet" | "Other";
export type AccountStatus = "Active" | "Inactive";

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  initialBalance: number;
  status: AccountStatus;
  accountNumber: string;
  createdAt: string;
}
