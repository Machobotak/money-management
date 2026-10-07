import { z } from "zod";
import { ISO_DATE } from "./common";

export const DEBT_TYPES = ["Debt", "Receivable"] as const;

const emptyOrDate = z
  .string()
  .trim()
  .refine((value) => value === "" || ISO_DATE.test(value), "Tanggal jatuh tempo tidak valid.")
  .default("");

export const debtCreateSchema = z
  .object({
    type: z.enum(DEBT_TYPES, { message: "Jenis wajib dipilih." }),
    person: z.string().trim().min(1, "Nama orang wajib diisi.").max(60, "Nama maksimal 60 karakter."),
    amount: z
      .number({ message: "Nominal harus berupa angka." })
      .positive("Nominal harus lebih besar dari 0."),
    paidAmount: z.number({ message: "Nominal dibayar harus berupa angka." }).min(0, "Nominal dibayar tidak boleh negatif.").default(0),
    dueDate: emptyOrDate,
    description: z.string().trim().max(280, "Deskripsi maksimal 280 karakter.").default(""),
  })
  .refine((value) => value.paidAmount <= value.amount, {
    message: "Pembayaran melebihi sisa hutang.",
    path: ["paidAmount"],
  });

export const debtUpdateSchema = z
  .object({
    type: z.enum(DEBT_TYPES).optional(),
    person: z.string().trim().min(1, "Nama orang wajib diisi.").optional(),
    amount: z.number().positive("Nominal harus lebih besar dari 0.").optional(),
    paidAmount: z.number().min(0, "Nominal dibayar tidak boleh negatif.").optional(),
    dueDate: z
      .string()
      .trim()
      .refine((value) => value === "" || ISO_DATE.test(value), "Tanggal jatuh tempo tidak valid.")
      .optional(),
    description: z.string().trim().max(280, "Deskripsi maksimal 280 karakter.").optional(),
  });

export const debtPaymentSchema = z.object({
  payAmount: z
    .number({ message: "Nominal pembayaran harus berupa angka." })
    .positive("Nominal pembayaran harus lebih besar dari 0."),
});
