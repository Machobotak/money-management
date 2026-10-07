"use client";

import { forwardRef, type TextareaHTMLAttributes } from "react";
import { fieldClass, HelperText, Label } from "./Field";
import { cn } from "@/lib/cn";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helper?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, helper, className, id, rows = 3, ...props },
  ref,
) {
  const areaId = id ?? props.name;
  return (
    <div>
      {label ? <Label htmlFor={areaId}>{label}</Label> : null}
      <textarea
        ref={ref}
        id={areaId}
        rows={rows}
        aria-invalid={error ? true : undefined}
        className={cn(fieldClass(Boolean(error), "h-auto py-2 leading-relaxed"), className)}
        {...props}
      />
      <HelperText error={Boolean(error)}>{error ?? helper}</HelperText>
    </div>
  );
});
