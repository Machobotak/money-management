const MONTHS_ID = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];

/** "2026-10-02" -> "2 Okt 2026" */
export function formatDate(iso: string): string {
  if (!iso) return "-";
  const [year, month, day] = iso.slice(0, 10).split("-").map(Number);
  if (!year || !month || !day) return iso;
  return day + " " + MONTHS_ID[month - 1] + " " + year;
}

/** "2026-10" -> "Oktober 2026" */
export function formatMonth(month: string): string {
  const [year, m] = month.split("-").map(Number);
  if (!year || !m) return month;
  const full = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
  ];
  return full[m - 1] + " " + year;
}

/** "2026-10" -> "Okt 26" */
export function formatMonthShort(month: string): string {
  const [year, m] = month.split("-").map(Number);
  if (!year || !m) return month;
  return MONTHS_ID[m - 1] + " " + String(year).slice(2);
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

export function monthBounds(month: string): { from: string; to: string } {
  const [year, m] = month.split("-").map(Number);
  const last = new Date(Date.UTC(year, m, 0)).getUTCDate();
  return { from: month + "-01", to: month + "-" + String(last).padStart(2, "0") };
}

export function shiftMonth(month: string, delta: number): string {
  const [year, m] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year, m - 1 + delta, 1));
  return date.toISOString().slice(0, 7);
}

/** Monday–Sunday bounds containing `iso` ("YYYY-MM-DD"). */
export function weekBounds(iso: string): { from: string; to: string } {
  const [year, month, day] = iso.slice(0, 10).split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const sinceMonday = (date.getUTCDay() + 6) % 7;
  const from = new Date(date);
  from.setUTCDate(date.getUTCDate() - sinceMonday);
  const to = new Date(from);
  to.setUTCDate(from.getUTCDate() + 6);
  return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) };
}
