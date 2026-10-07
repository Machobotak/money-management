"use client";

import Link from "next/link";
import { cn } from "@/lib/cn";
import { formatIDR } from "@/lib/currency";
import { formatDate, todayISO } from "@/lib/format-date";
import type { Transaction } from "@/types";

const TONE = {
  Income: "text-cre",
  Expense: "text-deb",
  Transfer: "text-ult",
} as const;

/** The last lines written in the book, with today's ribbon still in place. */
export function RecentTransactions({ transactions }: { transactions: Transaction[] }) {
  const today = todayISO();

  return (
    <section className="sheet overflow-hidden">
      <div className="rule-hair flex flex-wrap items-center justify-between gap-3 px-5 py-3">
        <h2 className="stamp text-micro text-muted">Transaksi terbaru</h2>
        <Link
          href="/transactions"
          className="text-caption text-muted underline decoration-rule-dense underline-offset-4 transition-colors hover:text-deb hover:decoration-deb"
        >
          Lihat semua
        </Link>
      </div>

      {transactions.length === 0 ? (
        <p className="px-5 py-8 text-body text-muted">Belum ada transaksi tercatat.</p>
      ) : (
        <ul className="px-5">
          {transactions.map((tx) => (
            <li
              key={tx.id}
              className={cn(
                "rule-hair flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-3 last:border-b-0",
                tx.date === today && "ribbon pl-3",
              )}
            >
              <span className="min-w-0">
                <span className="block truncate text-body text-ink">
                  {tx.category || tx.type}
                </span>
                <span className="fig text-caption text-faint">{formatDate(tx.date)}</span>
              </span>
              <span className={cn("fig shrink-0 text-body", TONE[tx.type])}>
                {tx.type === "Expense" ? "−" : tx.type === "Income" ? "+" : ""}
                {formatIDR(Math.abs(tx.amount))}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
