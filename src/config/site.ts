export const SITE = {
  /** Masthead of the book. */
  name: "Buku Besar",
  tagline: "Catatan keuangan pribadi — dibaca seperti buku besar.",
  owner: "Pemilik buku",
  currency: "IDR",
  locale: "id-ID",
} as const;

export const NAV_ITEMS = [
  { href: "/dashboard", label: "Ringkasan" },
  { href: "/transactions", label: "Transaksi" },
  { href: "/budgets", label: "Anggaran" },
  { href: "/accounts", label: "Akun" },
  { href: "/categories", label: "Kategori" },
  { href: "/debts", label: "Utang & Piutang" },
  { href: "/recurring", label: "Berulang" },
  { href: "/settings", label: "Pengaturan" },
] as const;
