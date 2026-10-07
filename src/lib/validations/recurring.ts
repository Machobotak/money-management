import { z } from "zod";
import { ISO_DATE } from "./common";

export const FREQUENCIES = ["Daily", "Weekly", "Monthly", "Yearly"] as const;

const emptyOrDate = z
  .string()
  .trim()
  .refine((value) => value === "" || ISO_DATE.test(value), "Tanggal tidak valid.")
  .default("");

export const recurringCreateSchema = z.object({
  name: z.string().trim().min(1, "Nama wajib diisi.").max(60, "Nama maksimal 60 karakter."),
  type: z.enum(["Income", "Expense"], { message: "Jenis wajib dipilih." }),
  category: z.string().trim().min(1, "Kategori wajib dipilih."),
  amount: z
    .number({ message: "Nominal harus berupa angka." })
    .positive("Nominal harus lebih besar dari 0."),
  account: z.string().trim().min(1, "Akun wajib dipilih."),
  frequency: z.enum(FREQUENCIES, { message: "Frekuensi wajib dipilih." }),
  startDate: z.string().trim().regex(ISO_DATE, "Tanggal mulai wajib diisi."),
  endDate: emptyOrDate,
  active: z.boolean().default(true),
});

export const recurringUpdateSchema = recurringCreateSchema.partial();
