export type TransactionType = "Income" | "Expense" | "Transfer";

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  type: TransactionType;
  category: string;
  amount: number;
  account: string;
  fromAccount: string;
  toAccount: string;
  description: string;
  createdAt: string;
}

export interface TransactionInput {
  date: string;
  type: TransactionType;
  category: string;
  amount: number;
  account: string;
  fromAccount: string;
  toAccount: string;
  description: string;
}
