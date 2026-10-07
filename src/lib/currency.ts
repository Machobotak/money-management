import { SITE } from "@/config/site";

const NUMBER = new Intl.NumberFormat(SITE.locale, { maximumFractionDigits: 0 });

/** 1000000 -> "Rp1.000.000" */
export function formatIDR(value: number): string {
  const safe = Number.isFinite(value) ? Math.round(value) : 0;
  const sign = safe < 0 ? "-" : "";
  return sign + "Rp" + NUMBER.format(Math.abs(safe));
}

/** "Rp1.000.000" | "1000000" -> 1000000 */
export function parseIDR(input: string): number {
  const digits = input.replace(/[^0-9]/g, "");
  if (!digits) return 0;
  return Number.parseInt(digits, 10);
}

/** Formats while typing: "100000" -> "100.000" */
export function formatAmountInput(input: string): string {
  const digits = input.replace(/[^0-9]/g, "").replace(/^0+(?=\d)/, "");
  if (!digits) return "";
  return NUMBER.format(Number.parseInt(digits, 10));
}

export function formatPercent(value: number): string {
  return (Math.round(value * 10) / 10).toLocaleString("id-ID") + "%";
}
