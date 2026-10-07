export type RangeKey =
  | "this-month"
  | "last-month"
  | "3-months"
  | "6-months"
  | "this-year"
  | "custom";

export const RANGE_OPTIONS: Array<{ key: RangeKey; label: string }> = [
  { key: "this-month", label: "Bulan ini" },
  { key: "last-month", label: "Bulan lalu" },
  { key: "3-months", label: "3 bulan" },
  { key: "6-months", label: "6 bulan" },
  { key: "this-year", label: "Tahun ini" },
  { key: "custom", label: "Rentang khusus" },
];

function bounds(month: string) {
  const [year, m] = month.split("-").map(Number);
  const lastDay = new Date(Date.UTC(year, m, 0)).getUTCDate();
  return { from: month + "-01", to: month + "-" + String(lastDay).padStart(2, "0") };
}

export function currentMonthISO(): string {
  return new Date().toISOString().slice(0, 7);
}

export function resolveRange(key: RangeKey): { from: string; to: string } {
  const month = currentMonthISO();
  const [year, m] = month.split("-").map(Number);

  switch (key) {
    case "last-month": {
      const previous = new Date(Date.UTC(year, m - 2, 1)).toISOString().slice(0, 7);
      return bounds(previous);
    }
    case "3-months": {
      const start = new Date(Date.UTC(year, m - 3, 1)).toISOString().slice(0, 7);
      return { from: start + "-01", to: bounds(month).to };
    }
    case "6-months": {
      const start = new Date(Date.UTC(year, m - 6, 1)).toISOString().slice(0, 7);
      return { from: start + "-01", to: bounds(month).to };
    }
    case "this-year":
      return { from: year + "-01-01", to: bounds(month).to };
    case "custom":
    case "this-month":
    default:
      return bounds(month);
  }
}
