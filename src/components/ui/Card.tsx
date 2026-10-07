import { cn } from "@/lib/cn";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated";
}

/**
 * A leaf of the book. No drop shadow, no glow: depth is carried by the rule
 * hierarchy and by one step of paper tone.
 */
export function Card({ variant = "default", className, children, ...props }: CardProps) {
  return (
    <div
      className={cn("rounded-sm p-5", variant === "default" ? "sheet" : "sheet-raised", className)}
      {...props}
    >
      {children}
    </div>
  );
}