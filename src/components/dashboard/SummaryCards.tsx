"use client";

import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/cn";
import { formatIDR } from "@/lib/currency";

interface SummaryValues {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpense: number;
  netCashFlow: number;
}

/**
 * The opening statement of the book: four lines that add up, closed by a
 * double rule above the balance. Not four cards — one leaf, read top to bottom.
 */
export function SummaryCards({
  summary,
  loading = false,
}: {
  summary: SummaryValues | null;
  loading?: boolean;
}) {
  if (loading || !summary) {
    return (
      <div className="sheet p-5">
        <Skeleton className="h-3 w-16" />
        <div className="mt-4 space-y-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-8 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const flow = [
    { label: "Pemasukan bulan ini", value: summary.monthlyIncome, tone: "text-cre" },
    { label: "Pengeluaran bulan ini", value: summary.monthlyExpense, tone: "text-deb" },
    {
      label: "Arus kas bersih",
      value: summary.netCashFlow,
      tone: summary.netCashFlow >= 0 ? "text-cre" : "text-deb",
    },
  ];

  return (
    <section className="sheet overflow-hidden">
      <h2 className="stamp rule-hair px-5 py-3 text-micro text-muted">Saldo</h2>

      <dl className="px-5">
        {flow.map((row) => (
          <div
            key={row.label}
            className="rule-hair flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-3"
          >
            <dt className="text-body text-muted">{row.label}</dt>
            <dd className={cn("fig text-figure", row.tone)}>{formatIDR(row.value)}</dd>
          </div>
        ))}

        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 pb-5 pt-4">
          <dt className="stamp text-micro text-faint">
            Total saldo
            <span className="mt-1 block font-sans text-caption normal-case tracking-normal text-faint">
              Seluruh akun, saldo awal dihitung
            </span>
          </dt>
          <dd className="fig rule-total pt-2 text-total text-ink">
            {formatIDR(summary.totalBalance)}
          </dd>
        </div>
      </dl>
    </section>
  );
}
