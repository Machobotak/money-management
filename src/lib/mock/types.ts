import type { Account } from "@/types/account";
import type { Budget } from "@/types/budget";
import type { Category } from "@/types/category";
import type { Debt } from "@/types/debt";
import type { Recurring } from "@/types/recurring";
import type { Transaction } from "@/types/transaction";

/** Everything the demo app knows, held in one browser-local document. */
export interface DemoDataset {
  version: number;
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
  debts: Debt[];
  recurring: Recurring[];
}

/** Signed-in demo user. No credentials are ever checked against a server. */
export interface DemoUser {
  name: string;
  email: string;
  role: string;
}

export interface DemoSession {
  user: DemoUser;
  signedInAt: string;
}
