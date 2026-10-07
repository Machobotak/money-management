"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";

/** PRD: grafik statis di layar sempit, animasi hanya dari 640px ke atas. */
export function useChartAnimation(): boolean {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(min-width: 640px)");
    const sync = () => setAnimated(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  return animated;
}

/** The ledger's own ink, for the parts Recharts paints in JavaScript. */
export const INK = {
  paper: "#0D0C0B",
  block: "#171613",
  ink: "#F3F0E9",
  muted: "#B8B0A1",
  faint: "#8A8175",
  hair: "#2C2823",
  dense: "#5A5348",
  deb: "#D6584A",
  debDeep: "#B03A2E",
  cre: "#5FA97A",
  ult: "#6E86C8",
  brass: "#C9A227",
} as const;

export const TOOLTIP_STYLE = {
  backgroundColor: INK.block,
  border: "1px solid " + INK.dense,
  borderRadius: 2,
  color: INK.ink,
} as const;

export const LEGEND_STYLE = { color: INK.muted, fontSize: 11 } as const;

export const AXIS_STYLE = { fill: INK.faint, fontSize: 11 } as const;

export const CURSOR_FILL = { fill: INK.ink, fillOpacity: 0.06 } as const;

/** Tick ringkas agar sumbu Y tetap muat di 390px: 1_250_000 -> "1,3jt". */
export function formatAxisTick(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) {
    return (value / 1_000_000).toFixed(1).replace(".", ",").replace(",0", "") + "jt";
  }
  if (abs >= 1_000) return Math.round(value / 1_000) + "rb";
  return String(value);
}

export function ChartFrame({
  title,
  loading = false,
  error,
  onRetry,
  children,
}: {
  title: string;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  children: React.ReactNode;
}) {
  return (
    <Card className="flex min-w-0 flex-col gap-3">
      <h2 className="rule-dense pb-2 text-lead text-ink">{title}</h2>
      {error ? (
        <ErrorBlock message={error} onRetry={onRetry} />
      ) : loading ? (
        <Skeleton className="h-[280px] w-full" />
      ) : (
        children
      )}
    </Card>
  );
}

export function ErrorBlock({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-sm border border-deb/40 bg-deb/[0.07] p-4">
      <p className="text-body text-deb">{message}</p>
      {onRetry ? (
        <Button size="sm" onClick={onRetry}>
          Coba lagi
        </Button>
      ) : null}
    </div>
  );
}
