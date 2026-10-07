"use client";

import { useState } from "react";
import { CashFlowChart } from "@/components/dashboard/CashFlowChart";
import { ExpenseBreakdownChart } from "@/components/dashboard/ExpenseBreakdownChart";
import { IncomeVsExpenseChart, type MonthBucketRow } from "@/components/dashboard/IncomeVsExpenseChart";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { SpendingTrendChart } from "@/components/dashboard/SpendingTrendChart";
import { SummaryCards } from "@/components/dashboard/SummaryCards";
import { TodayWeekSummary } from "@/components/dashboard/TodayWeekSummary";
import { PageHeader } from "@/components/layout/PageHeader";
import { QuickAddButton } from "@/components/transactions/QuickAddButton";
import { Button } from "@/components/ui/Button";
import { FilterChip } from "@/components/ui/Chip";
import { Input } from "@/components/ui/Input";
import { useApi } from "@/lib/client/use-api";
import { RANGE_OPTIONS, resolveRange, type RangeKey } from "@/lib/client/range";
import { formatDate, todayISO } from "@/lib/format-date";
import type { Transaction } from "@/types";

interface ScopeTotals {
  income: number;
  expense: number;
  net: number;
}

interface AnalyticsSummary {
  summary: {
    totalBalance: number;
    monthlyIncome: number;
    monthlyExpense: number;
    netCashFlow: number;
    today: ScopeTotals & { date: string };
    week: ScopeTotals & { from: string; to: string };
  };
  buckets: MonthBucketRow[];
  expenseByCategory: Array<{ category: string; total: number }>;
  recent: Transaction[];
}

const BUCKET_MONTHS: Record<RangeKey, number> = {
  "this-month": 3,
  "last-month": 3,
  "3-months": 3,
  "6-months": 6,
  "this-year": 12,
  custom: 6,
};

export default function DashboardPage() {
  const [range, setRange] = useState<RangeKey>("this-month");
  const [customFrom, setCustomFrom] = useState(todayISO());
  const [customTo, setCustomTo] = useState(todayISO());

  const bounds = range === "custom" ? { from: customFrom, to: customTo } : resolveRange(range);
  const validRange =
    /^\d{4}-\d{2}-\d{2}$/.test(bounds.from) && /^\d{4}-\d{2}-\d{2}$/.test(bounds.to);
  const url = validRange
    ? `/api/analytics/summary?from=${bounds.from}&to=${bounds.to}&months=${BUCKET_MONTHS[range]}`
    : null;

  const { data, error, loading, reload } = useApi<AnalyticsSummary>(url);
  const pending = loading && !data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ringkasan"
        subtitle="Saldo, arus kas, dan ke mana uang pergi pada periode yang sedang dibuka."
        marker={
          validRange ? `${formatDate(bounds.from)} — ${formatDate(bounds.to)}` : undefined
        }
        action={<QuickAddButton onSaved={reload} />}
      />

      {/* The interval scale: the chosen key is stamped solid. */}
      <section
        className="rule-hair flex flex-wrap items-center gap-1.5 pb-3"
        aria-label="Periode laporan"
      >
        {RANGE_OPTIONS.map((option) => (
          <FilterChip
            key={option.key}
            active={range === option.key}
            onClick={() => setRange(option.key)}
          >
            {option.label}
          </FilterChip>
        ))}
      </section>

      {range === "custom" ? (
        <div className="sheet grid gap-3 p-5 sm:grid-cols-2">
          <Input
            label="Dari"
            type="date"
            value={customFrom}
            onChange={(event) => setCustomFrom(event.target.value)}
          />
          <Input
            label="Sampai"
            type="date"
            value={customTo}
            onChange={(event) => setCustomTo(event.target.value)}
          />
        </div>
      ) : null}

      {error ? (
        <section className="sheet flex flex-wrap items-center justify-between gap-3 border-t-2 border-t-deb p-5">
          <p className="text-body text-deb">{error}</p>
          <Button variant="secondary" size="sm" onClick={reload}>
            Coba lagi
          </Button>
        </section>
      ) : (
        <>
          <SummaryCards summary={data?.summary ?? null} loading={pending} />
          <TodayWeekSummary today={data?.summary.today ?? null} week={data?.summary.week ?? null} loading={pending} />

          <div className="grid gap-5 lg:grid-cols-2">
            <IncomeVsExpenseChart buckets={data?.buckets ?? []} loading={pending} />
            <CashFlowChart buckets={data?.buckets ?? []} loading={pending} />
            <ExpenseBreakdownChart data={data?.expenseByCategory ?? []} loading={pending} />
            <SpendingTrendChart buckets={data?.buckets ?? []} loading={pending} />
          </div>

          <RecentTransactions transactions={data?.recent ?? []} />
        </>
      )}
    </div>
  );
}
