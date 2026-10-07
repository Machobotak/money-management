/**
 * Receipt OCR post-processing: pull amount/date/merchant from raw OCR text.
 * Heuristic for Indonesian receipts ("TOTAL", "Rp46.050", "03/10/2026").
 * The user always reviews the prefilled form before saving.
 * ponytail: biggest-number-wins fallback; upgrade to an LLM parse when this misfires often.
 */
export interface ReceiptResult {
  amount: number | null;
  date: string | null; // YYYY-MM-DD
  description: string; // merchant guess, may be ""
}

const TOTAL_KEYS = [
  "grand total",
  "total belanja",
  "total bayar",
  "total",
  "jumlah",
  "tagihan",
  "subtotal",
  "sub total",
];

const SKIP_KEYS = [
  "tunai",
  "cash",
  "kembali",
  "kembalian",
  "change",
  "telp",
  "phone",
  "npwp",
  "kartu",
  "debit",
];

const MONTHS: Record<string, string> = {
  jan: "01", january: "01", januari: "01",
  feb: "02", february: "02", februari: "02",
  mar: "03", march: "03", maret: "03",
  apr: "04", april: "04",
  mei: "05", may: "05",
  jun: "06", june: "06", juni: "06",
  jul: "07", july: "07", juli: "07",
  agu: "08", agt: "08", august: "08", agustus: "08",
  sep: "09", sept: "09", september: "09",
  okt: "10", oct: "10", october: "10", oktober: "10",
  nov: "11", november: "11",
  des: "12", dec: "12", december: "12", desember: "12",
};

/** "46.050" -> 46050, "34.050,00" -> 34050, "100000" -> 100000. */
function parseAmount(token: string): number | null {
  const raw = token.replace(/[^\d.,]/g, "");
  if (!raw) return null;
  const head = /[.,]\d{2}$/.test(raw) ? raw.slice(0, -3) : raw;
  const digits = head.replace(/[^\d]/g, "");
  if (!digits || digits.length > 12) return null;
  const value = Number.parseInt(digits, 10);
  return value > 0 ? value : null;
}

/** Last money-looking token on the line (prefers Rp/separator tokens over counts). */
function lineAmount(line: string): number | null {
  const tokens = line.match(/(?:Rp\s?)?\d[\d.,]*/gi);
  if (!tokens) return null;
  const money = tokens.filter((token) => /rp/i.test(token) || /[.,]/.test(token));
  return parseAmount(money.length > 0 ? money[money.length - 1] : tokens[tokens.length - 1]);
}
function containsKey(line: string, key: string): boolean {
  const pattern = new RegExp("\\b" + key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b");
  return pattern.test(line);
}


function findAmount(lines: string[]): number | null {
  const lowered = lines.map((line) => line.toLowerCase());
  for (const key of TOTAL_KEYS) {
    for (let index = 0; index < lines.length; index++) {
      if (!containsKey(lowered[index], key)) continue;
      if (SKIP_KEYS.some((skip) => containsKey(lowered[index], skip))) continue;
      const value = lineAmount(lines[index]);
      if (value !== null) return value;
    }
  }
  let best: number | null = null;
  for (let index = 0; index < lines.length; index++) {
    if (SKIP_KEYS.some((skip) => containsKey(lowered[index], skip))) continue;
    const value = lineAmount(lines[index]);
    if (value !== null && (best === null || value > best)) best = value;
  }
  return best;
}

function toISO(day: string, month: string, year: string): string | null {
  const d = Number.parseInt(day, 10);
  const m = Number.parseInt(month, 10);
  let y = Number.parseInt(year, 10);
  if (year.length === 2) y += 2000;
  if (!(d >= 1 && d <= 31 && m >= 1 && m <= 12)) return null;
  if (y < 2000 || y > 2100) return null;
  const pad = (n: number) => String(n).padStart(2, "0");
  return y + "-" + pad(m) + "-" + pad(d);
}

/** DD/MM/YYYY first (Indonesian receipts), then "3 Okt 2026". First valid wins. */
function findDate(text: string): string | null {
  for (const match of text.matchAll(/(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/g)) {
    const iso = toISO(match[1], match[2], match[3]);
    if (iso) return iso;
  }
  for (const match of text.toLowerCase().matchAll(/(\d{1,2})\s+([a-z]+)\s+(\d{2,4})/g)) {
    const month = MONTHS[match[2]];
    if (!month) continue;
    const iso = toISO(match[1], month, match[3]);
    if (iso) return iso;
  }
  return null;
}

/** First text-heavy line — usually the store name. */
function guessMerchant(lines: string[]): string {
  for (const line of lines) {
    if (/[a-zA-Z]{3,}/.test(line)) {
      return line.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, "").slice(0, 60);
    }
  }
  return "";
}

export function parseReceipt(text: string): ReceiptResult {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  return {
    amount: findAmount(lines),
    date: findDate(text),
    description: guessMerchant(lines),
  };
}
