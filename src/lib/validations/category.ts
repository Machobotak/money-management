import { z } from "zod";

export const CATEGORY_TYPES = ["Income", "Expense"] as const;
export const CATEGORY_STATUSES = ["Active", "Inactive"] as const;

export const categoryCreateSchema = z.object({
  name: z.string().trim().min(1, "Nama kategori wajib diisi.").max(60, "Nama kategori maksimal 60 karakter."),
  type: z.enum(CATEGORY_TYPES, { message: "Jenis kategori wajib dipilih." }),
  status: z.enum(CATEGORY_STATUSES).default("Active"),
});

export const categoryUpdateSchema = categoryCreateSchema.partial();
