"use client";

import { forwardRef, type SelectHTMLAttributes } from "react";
import { fieldClass, HelperText, Label } from "./Field";
import { cn } from "@/lib/cn";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helper?: string;
}

/** The printed caret is drawn, not the platform default. */
function Caret() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 10 6"
      className="pointer-events-none absolute right-2.5 top-1/2 h-1.5 w-2.5 -translate-y-1/2 text-faint"
      fill="none"
    >
      <path d="M1 1.5 5 4.5 9 1.5" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, helper, className, id, children, ...props },
  ref,
) {
  const selectId = id ?? props.name;
  return (
    <div>
      {label ? <Label htmlFor={selectId}>{label}</Label> : null}
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          aria-invalid={error ? true : undefined}
          className={cn(fieldClass(Boolean(error), "appearance-none pr-7"), className)}
          {...props}
        >
          {children}
        </select>
        <Caret />
      </div>
      <HelperText error={Boolean(error)}>{error ?? helper}</HelperText>
    </div>
  );
});
