import { z } from "zod";

export const ACCOUNT_TYPES = ["Cash", "Bank", "E-Wallet", "Other"] as const;
export const ACCOUNT_STATUSES = ["Active", "Inactive"] as const;

export const accountCreateSchema = z.object({
  name: z.string().trim().min(1, "Nama akun wajib diisi.").max(60, "Nama akun maksimal 60 karakter."),
  type: z.enum(ACCOUNT_TYPES, { message: "Tipe akun wajib dipilih." }),
  initialBalance: z
    .number({ message: "Saldo awal harus berupa angka." })
    .min(0, "Saldo awal tidak boleh negatif.")
    .default(0),
  status: z.enum(ACCOUNT_STATUSES).default("Active"),
  accountNumber: z.string().trim().max(40, "Nomor rekening/HP maksimal 40 karakter.").default(""),
});

export const accountUpdateSchema = accountCreateSchema.partial();
