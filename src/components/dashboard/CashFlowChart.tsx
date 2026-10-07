"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
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

/** Net is money that only moves between columns, so it is drawn in ultramarine. */
export function CashFlowChart({
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
    <ChartFrame title="Arus Kas Bersih" loading={loading} error={error} onRetry={onRetry}>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={buckets}>
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
          <Line
            type="monotone"
            dataKey="net"
            name="Arus Kas"
            stroke={INK.ult}
            strokeWidth={2}
            dot={{ r: 2.5, fill: INK.ult, stroke: INK.paper }}
            activeDot={{ r: 4, fill: INK.ult, stroke: INK.paper }}
            isAnimationActive={animated}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}
