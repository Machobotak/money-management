"use client";

import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/cn";
import { formatIDR } from "@/lib/currency";
import { formatDate } from "@/lib/format-date";

export interface ScopeTotals {
  income: number;
  expense: number;
  net: number;
}

function Section({
  stamp,
  scope,
}: {
  stamp: string;
  scope: ScopeTotals;
}) {
  const rows = [
    { label: "Masuk", value: scope.income, tone: "text-cre" },
    { label: "Keluar", value: scope.expense, tone: "text-deb" },
  ];
  return (
    <div className="rule-hair px-5 py-3 last:border-b-0">
      <p className="stamp text-micro text-faint">{stamp}</p>
      <dl className="mt-2 space-y-1.5">
        {rows.map((row) => (
          <div key={row.label} className="flex items-baseline justify-between gap-x-4">
            <dt className="text-body text-muted">{row.label}</dt>
            <dd className={cn("fig text-figure", row.tone)}>{formatIDR(row.value)}</dd>
          </div>
        ))}
        <div className="flex items-baseline justify-between gap-x-4">
          <dt className="text-body text-ink">Bersih</dt>
          <dd className={cn("fig text-figure", scope.net >= 0 ? "text-cre" : "text-deb")}>
            {formatIDR(scope.net)}
          </dd>
        </div>
      </dl>
    </div>
  );
}

/** Today + this-week totals, read from the same summary payload. No extra fetch. */
export function TodayWeekSummary({
  today,
  week,
  loading = false,
}: {
  today: (ScopeTotals & { date: string }) | null;
  week: (ScopeTotals & { from: string; to: string }) | null;
  loading?: boolean;
}) {
  if (loading || !today || !week) {
    return (
      <div className="sheet p-5">
        <Skeleton className="h-3 w-24" />
        <div className="mt-4 space-y-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-8 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <section className="sheet overflow-hidden">
      <h2 className="stamp rule-hair px-5 py-3 text-micro text-muted">Hari &amp; minggu ini</h2>
      <Section stamp={"Hari ini · " + formatDate(today.date)} scope={today} />
      <Section
        stamp={"Minggu ini · " + formatDate(week.from) + " — " + formatDate(week.to)}
        scope={week}
      />
    </section>
  );
}
