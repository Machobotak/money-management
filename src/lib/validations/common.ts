import { z } from "zod";

export const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
export const MONTH = /^\d{4}-\d{2}$/;

export function firstIssue(error: z.ZodError): string {
  const issue = error.issues[0];
  return issue?.message || "Input tidak valid.";
}

export function zodMessage(error: z.ZodError): string {
  return firstIssue(error);
}
