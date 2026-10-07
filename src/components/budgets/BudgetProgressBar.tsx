import { cn } from "@/lib/cn";
import type { BudgetStatus } from "@/lib/calculations/finance";

/**
 * A budget line reads as a ruled scale, not a meter: the used portion is drawn
 * on the ruled scale, quarter marks cut it, and an overrun turns oxblood.
 */
export function BudgetProgressBar({
  percent,
  status,
}: {
  percent: number;
  status: BudgetStatus;
}) {
  const width = Math.max(0, Math.min(100, percent));
  const fill = percent > 90 ? "bg-deb" : percent >= 70 ? "bg-brass" : "bg-cre";

  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(percent)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Pemakaian anggaran ${Math.round(percent)}% (${status})`}
      className="relative h-1.5 w-full bg-raised"
    >
      <div
        className={cn("h-full transition-[width] duration-300", fill)}
        style={{ width: `${width}%` }}
      />
      {[25, 50, 75].map((mark) => (
        <span
          key={mark}
          aria-hidden
          className="absolute top-0 h-full w-px bg-paper"
          style={{ left: `${mark}%` }}
        />
      ))}
    </div>
  );
}
