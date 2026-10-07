"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { ChartFrame, INK, LEGEND_STYLE, TOOLTIP_STYLE, useChartAnimation } from "./ChartFrame";
import { formatIDR } from "@/lib/currency";

/** Spending is money out, so the family starts in oxblood and cools from there. */
const PALETTE = [INK.deb, INK.debDeep, INK.brass, INK.ult, INK.faint, INK.cre];

export function ExpenseBreakdownChart({
  data,
  loading,
  error,
  onRetry,
}: {
  data: Array<{ category: string; total: number }>;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}) {
  const animated = useChartAnimation();

  return (
    <ChartFrame title="Pengeluaran per Kategori" loading={loading} error={error} onRetry={onRetry}>
      {data.length === 0 ? (
        <p className="flex h-[280px] items-center justify-center text-body text-muted">
          Belum ada pengeluaran pada periode ini.
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={data}
              dataKey="total"
              nameKey="category"
              innerRadius={58}
              outerRadius={88}
              stroke={INK.paper}
              strokeWidth={2}
              isAnimationActive={animated}
            >
              {data.map((entry, index) => (
                <Cell key={entry.category} fill={PALETTE[index % PALETTE.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              itemStyle={{ color: INK.ink }}
              formatter={(value) => formatIDR(Number(value))}
            />
            <Legend
              wrapperStyle={LEGEND_STYLE}
              formatter={(value, entry) => {
                const payload = entry.payload as { category?: string; total?: number } | undefined;
                if (!payload || typeof payload.total !== "number") return value;
                return (payload.category ?? value) + " — " + formatIDR(payload.total);
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </ChartFrame>
  );
}
