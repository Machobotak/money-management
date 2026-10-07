import { cn } from "@/lib/cn";

/** Entries are written on the ruled line: square, hairline, no glow. */
export const FIELD_BASE =
  "w-full rounded-sm border bg-paper/60 px-2.5 text-body text-ink placeholder:text-faint transition-colors duration-150 disabled:bg-raised/60 disabled:opacity-50";

export function fieldClass(error?: boolean, extra?: string) {
  return cn(
    FIELD_BASE,
    "h-9",
    error
      ? "border-deb"
      : "border-rule-hair focus:border-brass focus:outline-none",
    extra,
  );
}

export function Label({ htmlFor, children }: { htmlFor?: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="stamp mb-1.5 block text-micro text-muted">
      {children}
    </label>
  );
}

export function HelperText({ children, error }: { children?: React.ReactNode; error?: boolean }) {
  if (!children) return null;
  return (
    <p className={cn("mt-1 text-caption", error ? "text-deb" : "text-faint")}>{children}</p>
  );
}
