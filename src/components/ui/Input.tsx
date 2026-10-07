"use client";

import { forwardRef, type InputHTMLAttributes } from "react";
import { fieldClass, HelperText, Label } from "./Field";
import { cn } from "@/lib/cn";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helper?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, helper, className, id, ...props },
  ref,
) {
  const inputId = id ?? props.name;
  return (
    <div>
      {label ? <Label htmlFor={inputId}>{label}</Label> : null}
      <input
        ref={ref}
        id={inputId}
        aria-invalid={error ? true : undefined}
        className={cn(fieldClass(Boolean(error)), className)}
        {...props}
      />
      <HelperText error={Boolean(error)}>{error ?? helper}</HelperText>
    </div>
  );
});
