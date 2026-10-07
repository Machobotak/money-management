"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AXIS_STYLE,
  CURSOR_FILL,
  INK,
  ChartFrame,
  LEGEND_STYLE,
  TOOLTIP_STYLE,
  formatAxisTick,
  useChartAnimation,
} from "./ChartFrame";
import { formatIDR } from "@/lib/currency";
import { formatMonthShort } from "@/lib/format-date";

export interface MonthBucketRow {
  month: string;
  income: number;
  expense: number;
  net: number;
}

/** Two columns of the same leaf: money in beside money out. */
export function IncomeVsExpenseChart({
  buckets,
  loading,
  error,
  onRetry,
}: {
  buckets: MonthBucketRow[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}) {
  const animated = useChartAnimation();

  return (
    <ChartFrame
      title="Pemasukan vs Pengeluaran"
      loading={loading}
      error={error}
      onRetry={onRetry}
    >
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={buckets} barGap={2}>
          <CartesianGrid stroke={INK.hair} vertical={false} />
          <XAxis
            dataKey="month"
            stroke={INK.hair}
            tick={AXIS_STYLE}
            tickFormatter={formatMonthShort}
          />
          <YAxis
            stroke={INK.hair}
            tick={AXIS_STYLE}
            width={48}
            tickFormatter={formatAxisTick}
          />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            labelStyle={{ color: INK.ink }}
            formatter={(value) => formatIDR(Number(value))}
            labelFormatter={(label) => formatMonthShort(String(label))}
            cursor={CURSOR_FILL}
          />
          <Legend wrapperStyle={LEGEND_STYLE} />
          <Bar dataKey="income" name="Pemasukan" fill={INK.cre} isAnimationActive={animated} />
          <Bar dataKey="expense" name="Pengeluaran" fill={INK.deb} isAnimationActive={animated} />
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}
