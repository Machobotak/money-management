export const PUBLIC_ERRORS = {
  load: "Gagal memuat data. Silakan coba lagi.",
  save: "Gagal menyimpan. Silakan coba lagi.",
  saveTransaction: "Gagal menyimpan transaksi. Silakan coba lagi.",
  transactionNotFound: "Transaksi tidak ditemukan.",
  accountNotFound: "Akun tidak ditemukan.",
  categoryNotFound: "Kategori tidak ditemukan.",
  budgetNotFound: "Budget tidak ditemukan.",
  debtNotFound: "Hutang tidak ditemukan.",
  recurringNotFound: "Transaksi berulang tidak ditemukan.",
  accountInUse: "Akun masih memiliki transaksi. Nonaktifkan saja.",
  categoryInUse: "Kategori masih memiliki transaksi. Nonaktifkan saja.",
  duplicateBudget: "Budget kategori ini sudah ada di bulan tersebut.",
  duplicateTransaction: "Transaksi sudah tersimpan.",
  overPayment: "Pembayaran melebihi sisa hutang.",
  unauthorized: "Sesi tidak valid. Silakan masuk kembali.",
} as const;

export class AppError extends Error {
  readonly status: number;
  readonly publicMessage: string;

  constructor(publicMessage: string, status = 400) {
    super(publicMessage);
    this.name = "AppError";
    this.status = status;
    this.publicMessage = publicMessage;
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
