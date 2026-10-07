"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AXIS_STYLE,
  INK,
  ChartFrame,
  TOOLTIP_STYLE,
  formatAxisTick,
  useChartAnimation,
} from "./ChartFrame";
import type { MonthBucketRow } from "./IncomeVsExpenseChart";
import { formatIDR } from "@/lib/currency";
import { formatMonthShort } from "@/lib/format-date";

export function SpendingTrendChart({
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
    <ChartFrame title="Tren Pengeluaran" loading={loading} error={error} onRetry={onRetry}>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={buckets}>
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
          />
          <Area
            type="monotone"
            dataKey="expense"
            name="Pengeluaran"
            stroke={INK.deb}
            strokeWidth={2}
            fill={INK.deb}
            fillOpacity={0.12}
            isAnimationActive={animated}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}
