import { currentMonth, shiftMonth, todayISO } from "@/lib/format-date";
import type { Account } from "@/types/account";
import type { Budget } from "@/types/budget";
import type { Category, CategoryType } from "@/types/category";
import type { Debt } from "@/types/debt";
import type { Recurring } from "@/types/recurring";
import type { Transaction, TransactionType } from "@/types/transaction";
import type { DemoDataset } from "./types";

/** Bump when the seed shape or the generated history changes. */
export const DATASET_VERSION = 3;

/** Months of history generated behind the current month. */
const HISTORY_MONTHS = 8;

interface AccountSeed {
  name: string;
  type: Account["type"];
  initialBalance: number;
  accountNumber: string;
}

const ACCOUNT_SEEDS: AccountSeed[] = [
  { name: "Tunai", type: "Cash", initialBalance: 1_500_000, accountNumber: "" },
  { name: "BCA", type: "Bank", initialBalance: 24_000_000, accountNumber: "•••• 4471" },
  { name: "Mandiri", type: "Bank", initialBalance: 12_500_000, accountNumber: "•••• 2083" },
  { name: "GoPay", type: "E-Wallet", initialBalance: 850_000, accountNumber: "0812•••••77" },
  { name: "OVO", type: "E-Wallet", initialBalance: 420_000, accountNumber: "0812•••••77" },
  { name: "Jenius", type: "Bank", initialBalance: 6_400_000, accountNumber: "•••• 9012" },
];

const ACCOUNT_NAMES = ACCOUNT_SEEDS.map((entry) => entry.name);

const INCOME_CATEGORIES = ["Gaji", "Bonus", "Freelance", "Bunga & Dividen", "Lain-lain"];

const EXPENSE_CATEGORIES = [
  "Makan & Minum",
  "Transportasi",
  "Belanja Harian",
  "Tagihan & Utilitas",
  "Sewa & Tempat Tinggal",
  "Kesehatan",
  "Pendidikan",
  "Hiburan",
  "Pulsa & Internet",
  "Perawatan Diri",
  "Donasi",
  "Lain-lain",
];

const INACTIVE_CATEGORIES: Array<{ name: string; type: CategoryType }> = [
  { name: "Kripto", type: "Expense" },
  { name: "Bonus Lama", type: "Income" },
];

/** Mean amount, jitter, and how often a pattern shows up in a day. */
interface ExpensePattern {
  category: string;
  base: number;
  jitter: number;
  weight: number;
  account: string;
  note: string;
}

const EXPENSE_PATTERNS: ExpensePattern[] = [
  { category: "Makan & Minum", base: 38_000, jitter: 0.35, weight: 8, account: "GoPay", note: "Sarapan pagi" },
  { category: "Makan & Minum", base: 62_000, jitter: 0.4, weight: 11, account: "GoPay", note: "Makan siang kantor" },
  { category: "Makan & Minum", base: 28_000, jitter: 0.45, weight: 6, account: "Tunai", note: "Kopi sore" },
  { category: "Makan & Minum", base: 85_000, jitter: 0.5, weight: 5, account: "OVO", note: "Makan malam" },
  { category: "Belanja Harian", base: 720_000, jitter: 0.25, weight: 1, account: "BCA", note: "Belanja mingguan" },
  { category: "Transportasi", base: 45_000, jitter: 0.5, weight: 7, account: "GoPay", note: "Ojek online" },
  { category: "Transportasi", base: 180_000, jitter: 0.3, weight: 2, account: "Tunai", note: "Isi bensin" },
  { category: "Hiburan", base: 240_000, jitter: 0.6, weight: 2, account: "OVO", note: "Jalan akhir pekan" },
  { category: "Kesehatan", base: 215_000, jitter: 0.5, weight: 1, account: "Mandiri", note: "Vitamin dan obat" },
  { category: "Pendidikan", base: 450_000, jitter: 0.35, weight: 1, account: "BCA", note: "Kelas daring" },
  { category: "Perawatan Diri", base: 95_000, jitter: 0.2, weight: 1, account: "Tunai", note: "Potong rambut" },
  { category: "Lain-lain", base: 320_000, jitter: 0.7, weight: 1, account: "Jenius", note: "Kebutuhan rumah" },
];

/** Fixed monthly commitments, written on a specific day of every month. */
const MONTHLY_FIXED: Array<{
  day: number;
  category: string;
  base: number;
  jitter: number;
  account: string;
  note: string;
}> = [
  { day: 1, category: "Sewa & Tempat Tinggal", base: 4_500_000, jitter: 0, account: "BCA", note: "Sewa apartemen" },
  { day: 3, category: "Tagihan & Utilitas", base: 640_000, jitter: 0.15, account: "BCA", note: "Token listrik dan PDAM" },
  { day: 5, category: "Pulsa & Internet", base: 385_000, jitter: 0.05, account: "Mandiri", note: "IndiHome + kuota" },
  { day: 7, category: "Hiburan", base: 186_000, jitter: 0.03, account: "Jenius", note: "Langganan streaming" },
  { day: 12, category: "Belanja Harian", base: 1_250_000, jitter: 0.2, account: "BCA", note: "Belanja bulanan" },
  { day: 20, category: "Donasi", base: 300_000, jitter: 0.1, account: "BCA", note: "Donasi bulanan" },
];

/**
 * Monthly wallet top-ups. Daily spending drafts almost entirely from the wallets,
 * so without these the e-wallet and cash balances would drift tens of millions
 * into the red over the generated history.
 */
const MONTHLY_TOP_UPS: Array<{ day: number; from: string; to: string; base: number }> = [
  { day: 2, from: "BCA", to: "GoPay", base: 1_700_000 },
  { day: 2, from: "BCA", to: "OVO", base: 1_150_000 },
  { day: 16, from: "Mandiri", to: "GoPay", base: 1_500_000 },
  { day: 16, from: "BCA", to: "OVO", base: 1_050_000 },
  { day: 6, from: "BCA", to: "Tunai", base: 1_000_000 },
  { day: 21, from: "BCA", to: "Tunai", base: 1_000_000 },
];

/**
 * xorshift32 keyed by a hashed seed: the same seed always prints the same
 * ledger, so the demo looks identical on every machine and every reload.
 */
function createRandom(seed: string): () => number {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  let state = hash >>> 0 || 1;
  return () => {
    state ^= state << 13;
    state >>>= 0;
    state ^= state >>> 17;
    state ^= state << 5;
    state >>>= 0;
    return state / 4294967296;
  };
}

/** Rupiah is quoted in round numbers; every seeded amount lands on a step. */
function roundTo(value: number, step: number): number {
  return Math.max(step, Math.round(value / step) * step);
}

/** Date.UTC keeps the day from drifting across timezones. */
function isoDay(year: number, month: number, day: number): string {
  return new Date(Date.UTC(year, month - 1, day)).toISOString().slice(0, 10);
}

function pickPattern(random: () => number, weekend: boolean): ExpensePattern {
  const pools = EXPENSE_PATTERNS.map((pattern) => {
    let weight = pattern.weight;
    if (weekend && (pattern.category === "Hiburan" || pattern.category === "Makan & Minum")) {
      weight *= 1.8;
    }
    if (!weekend && pattern.category === "Transportasi") weight *= 1.4;
    return { pattern, weight };
  });
  const total = pools.reduce((sum, entry) => sum + entry.weight, 0);
  let ticket = random() * total;
  for (const entry of pools) {
    ticket -= entry.weight;
    if (ticket <= 0) return entry.pattern;
  }
  return pools[pools.length - 1].pattern;
}

export function buildSeedDataset(seed: string): DemoDataset {
  const random = createRandom(seed);
  const today = todayISO();
  const current = currentMonth();
  const currentDay = Number(today.slice(8, 10));
  const currentYear = Number(current.slice(0, 4));
  const createdAt = new Date().toISOString();

  const accounts: Account[] = ACCOUNT_SEEDS.map((entry, index) => ({
    id: "acc-" + String(index + 1).padStart(2, "0"),
    name: entry.name,
    type: entry.type,
    initialBalance: entry.initialBalance,
    status: "Active",
    accountNumber: entry.accountNumber,
    createdAt,
  }));

  const categories: Category[] = [
    ...INCOME_CATEGORIES.map((name, index) => ({
      id: "cat-in-" + String(index + 1).padStart(2, "0"),
      name,
      type: "Income" as CategoryType,
      status: "Active" as const,
      createdAt,
    })),
    ...EXPENSE_CATEGORIES.map((name, index) => ({
      id: "cat-ex-" + String(index + 1).padStart(2, "0"),
      name,
      type: "Expense" as CategoryType,
      status: "Active" as const,
      createdAt,
    })),
    ...INACTIVE_CATEGORIES.map((entry, index) => ({
      id: "cat-off-" + String(index + 1).padStart(2, "0"),
      name: entry.name,
      type: entry.type,
      status: "Inactive" as const,
      createdAt,
    })),
  ];

  // ---------------------------------------------------------------------
  // History: one month at a time, oldest first, so ids stay stable.
  // ---------------------------------------------------------------------
  const transactions: Transaction[] = [];
  let sequence = 0;
  let salary = 18_500_000;

  function push(
    date: string,
    type: TransactionType,
    category: string,
    amount: number,
    account: string,
    description: string,
    fromAccount = "",
    toAccount = "",
  ) {
    sequence += 1;
    transactions.push({
      id: "tx-" + String(sequence).padStart(5, "0"),
      date,
      type,
      category,
      amount: Math.round(amount),
      account,
      fromAccount,
      toAccount,
      description,
      createdAt: date + "T" + String(7 + (sequence % 12)).padStart(2, "0") + ":15:00.000Z",
    });
  }

  for (let back = HISTORY_MONTHS; back >= 0; back -= 1) {
    const month = shiftMonth(current, -back);
    const year = Number(month.slice(0, 4));
    const monthNumber = Number(month.slice(5, 7));
    const lastDay = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
    // The current month is printed only up to today.
    const limit = back === 0 ? currentDay : lastDay;
    const growth = 1 + (HISTORY_MONTHS - back) * 0.012;

    // Salary lands on the 1st, so the current month already shows income.
    if (limit >= 1) {
      // A realistic salary leaves savings after covering monthly spending (~7JT).
      salary = roundTo(12_500_000 * growth * (1 + (random() - 0.5) * 0.02), 50_000);
      push(isoDay(year, monthNumber, 1), "Income", "Gaji", salary, "BCA", "Gaji bulanan");
    }
    if (random() < 0.45) {
      const day = 8 + Math.floor(random() * 12);
      if (day <= limit) {
        push(
          isoDay(year, monthNumber, day),
          "Income",
          "Freelance",
          roundTo(2_500_000 + random() * 4_000_000, 50_000),
          "Mandiri",
          "Proyek sampingan",
        );
      }
    }
    if ((monthNumber === 3 || monthNumber === 12) && limit >= 20) {
      push(isoDay(year, monthNumber, 20), "Income", "Bonus", roundTo(12_000_000 * growth, 100_000), "BCA", "Bonus tahunan");
    }
    if (random() < 0.7) {
      const day = Math.min(28, limit);
      push(isoDay(year, monthNumber, day), "Income", "Bunga & Dividen", roundTo(120_000 + random() * 260_000, 500), "Jenius", "Bunga tabungan");
    }

    for (const fixed of MONTHLY_FIXED) {
      if (fixed.day > limit) continue;
      push(
        isoDay(year, monthNumber, fixed.day),
        "Expense",
        fixed.category,
        roundTo(fixed.base * (1 + (random() - 0.5) * fixed.jitter), 1_000),
        fixed.account,
        fixed.note,
      );
    }

    // Day-to-day spending, with weekends leaning toward leisure.
    for (let day = 1; day <= limit; day += 1) {
      const date = isoDay(year, monthNumber, day);
      const weekday = new Date(date + "T00:00:00Z").getUTCDay();
      const weekend = weekday === 0 || weekday === 6;
      const entries = 1 + (random() < (weekend ? 0.75 : 0.55) ? 1 : 0);

      for (let entry = 0; entry < entries; entry += 1) {
        const pattern = pickPattern(random, weekend);
        push(
          date,
          "Expense",
          pattern.category,
          roundTo(pattern.base * (1 + (random() - 0.5) * pattern.jitter) * growth, 500),
          pattern.account,
          pattern.note,
        );
      }
    }

    // Wallet top-ups keep the cash and e-wallet balances healthy.
    for (const topUp of MONTHLY_TOP_UPS) {
      if (topUp.day > limit) continue;
      push(
        isoDay(year, monthNumber, topUp.day),
        "Transfer",
        "",
        roundTo(topUp.base * (1 + (random() - 0.3) * 0.2), 100_000),
        "",
        "Isi " + topUp.to,
        topUp.from,
        topUp.to,
      );
    }

    // Two or three transfers a month between own accounts.
    for (let index = 0; index < 2 + (random() < 0.5 ? 1 : 0); index += 1) {
      const day = 4 + Math.floor(random() * Math.max(1, limit - 6));
      if (day > limit) continue;
      const fromIndex = Math.floor(random() * ACCOUNT_NAMES.length);
      const toIndex = Math.floor(random() * ACCOUNT_NAMES.length);
      push(
        isoDay(year, monthNumber, day),
        "Transfer",
        "",
        roundTo(500_000 + random() * 2_000_000, 100_000),
        "",
        index === 0 ? "Isi dompet digital" : "Pindah dana",
        ACCOUNT_NAMES[fromIndex],
        ACCOUNT_NAMES[toIndex === fromIndex ? (fromIndex + 1) % ACCOUNT_NAMES.length : toIndex],
      );
    }
  }

  // ---------------------------------------------------------------------
  // Budgets for the current month and the one before it.
  // ---------------------------------------------------------------------
  const budgetTargets: Array<{ category: string; amount: number }> = [
    { category: "Makan & Minum", amount: 2_600_000 },
    { category: "Transportasi", amount: 1_100_000 },
    { category: "Belanja Harian", amount: 2_400_000 },
    { category: "Tagihan & Utilitas", amount: 800_000 },
    { category: "Sewa & Tempat Tinggal", amount: 4_500_000 },
    { category: "Hiburan", amount: 700_000 },
    { category: "Pulsa & Internet", amount: 420_000 },
    { category: "Kesehatan", amount: 450_000 },
    { category: "Perawatan Diri", amount: 260_000 },
    { category: "Pendidikan", amount: 600_000 },
    { category: "Donasi", amount: 350_000 },
    { category: "Lain-lain", amount: 500_000 },
  ];

  const budgets: Budget[] = [];
  for (const month of [shiftMonth(current, -1), current]) {
    budgetTargets.forEach((target, index) => {
      budgets.push({
        id: "bud-" + month.replace("-", "") + "-" + String(index + 1).padStart(2, "0"),
        month,
        category: target.category,
        amount: target.amount,
        createdAt,
      });
    });
  }

  // ---------------------------------------------------------------------
  // Debts, receivables, and recurring rules. Statuses are seeded already
  // consistent with the read-time derivation, so nothing drifts on first load.
  // ---------------------------------------------------------------------
  const debts: Debt[] = [
    {
      id: "debt-01",
      type: "Debt",
      person: "Koperasi Karyawan",
      amount: 12_000_000,
      paidAmount: 4_500_000,
      dueDate: shiftMonth(current, 4) + "-15",
      status: "Partially Paid",
      description: "Pinjaman renovasi kamar",
      createdAt,
    },
    {
      id: "debt-02",
      type: "Debt",
      person: "Rian",
      amount: 1_500_000,
      paidAmount: 0,
      dueDate: shiftMonth(current, -1) + "-20",
      status: "Overdue",
      description: "Pinjam untuk servis motor",
      createdAt,
    },
    {
      id: "debt-03",
      type: "Debt",
      person: "Toko Elektronik Sinar",
      amount: 6_800_000,
      paidAmount: 6_800_000,
      dueDate: shiftMonth(current, -2) + "-10",
      status: "Paid",
      description: "Cicilan kulkas, sudah lunas",
      createdAt,
    },
    {
      id: "debt-04",
      type: "Debt",
      person: "Dita",
      amount: 2_000_000,
      paidAmount: 0,
      dueDate: shiftMonth(current, 1) + "-05",
      status: "Pending",
      description: "Talangan tiket liburan",
      createdAt,
    },
    {
      id: "debt-05",
      type: "Receivable",
      person: "Bagas",
      amount: 3_200_000,
      paidAmount: 1_200_000,
      dueDate: shiftMonth(current, 2) + "-08",
      status: "Partially Paid",
      description: "Pinjaman proyek sampingan",
      createdAt,
    },
    {
      id: "debt-06",
      type: "Receivable",
      person: "Nadia",
      amount: 750_000,
      paidAmount: 0,
      dueDate: shiftMonth(current, -1) + "-12",
      status: "Overdue",
      description: "Patungan konser yang belum dibayar",
      createdAt,
    },
    {
      id: "debt-07",
      type: "Receivable",
      person: "Tim Kantor",
      amount: 1_400_000,
      paidAmount: 0,
      dueDate: shiftMonth(current, 1) + "-18",
      status: "Pending",
      description: "Talangan makan tim",
      createdAt,
    },
  ];

  const recurring: Recurring[] = [
    {
      id: "rec-01",
      name: "Gaji bulanan",
      type: "Income",
      category: "Gaji",
      amount: salary,
      account: "BCA",
      frequency: "Monthly",
      startDate: shiftMonth(current, -6) + "-01",
      endDate: "",
      active: true,
      createdAt,
    },
    {
      id: "rec-02",
      name: "Sewa apartemen",
      type: "Expense",
      category: "Sewa & Tempat Tinggal",
      amount: 4_500_000,
      account: "BCA",
      frequency: "Monthly",
      startDate: shiftMonth(current, -6) + "-01",
      endDate: "",
      active: true,
      createdAt,
    },
    {
      id: "rec-03",
      name: "IndiHome + kuota",
      type: "Expense",
      category: "Pulsa & Internet",
      amount: 385_000,
      account: "Mandiri",
      frequency: "Monthly",
      startDate: shiftMonth(current, -6) + "-05",
      endDate: "",
      active: true,
      createdAt,
    },
    {
      id: "rec-04",
      name: "Langganan streaming",
      type: "Expense",
      category: "Hiburan",
      amount: 186_000,
      account: "Jenius",
      frequency: "Monthly",
      startDate: shiftMonth(current, -6) + "-07",
      endDate: "",
      active: true,
      createdAt,
    },
    {
      id: "rec-05",
      name: "Donasi bulanan",
      type: "Expense",
      category: "Donasi",
      amount: 300_000,
      account: "BCA",
      frequency: "Monthly",
      startDate: shiftMonth(current, -6) + "-20",
      endDate: "",
      active: true,
      createdAt,
    },
    {
      id: "rec-06",
      name: "Air minum galon",
      type: "Expense",
      category: "Belanja Harian",
      amount: 120_000,
      account: "Tunai",
      frequency: "Weekly",
      startDate: shiftMonth(current, -2) + "-01",
      endDate: "",
      active: true,
      createdAt,
    },
    {
      id: "rec-07",
      name: "Kelas bahasa Inggris",
      type: "Expense",
      category: "Pendidikan",
      amount: 950_000,
      account: "Mandiri",
      frequency: "Monthly",
      startDate: shiftMonth(current, -3) + "-10",
      endDate: shiftMonth(current, 2) + "-10",
      active: false,
      createdAt,
    },
    {
      id: "rec-08",
      name: "Bonus tahunan",
      type: "Income",
      category: "Bonus",
      amount: 12_000_000,
      account: "BCA",
      frequency: "Yearly",
      startDate: currentYear + "-03-20",
      endDate: "",
      active: true,
      createdAt,
    },
  ];

  transactions.sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt));

  return {
    version: DATASET_VERSION,
    accounts,
    categories,
    transactions,
    budgets,
    debts,
    recurring,
  };
}
