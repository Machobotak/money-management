import { z } from "zod";
import { MONTH } from "./common";

export const budgetCreateSchema = z.object({
  month: z.string().trim().regex(MONTH, "Bulan wajib diisi (YYYY-MM)."),
  category: z.string().trim().min(1, "Kategori wajib dipilih."),
  amount: z
    .number({ message: "Nominal budget harus berupa angka." })
    .positive("Nominal budget harus lebih besar dari 0."),
});

export const budgetUpdateSchema = budgetCreateSchema.partial();
