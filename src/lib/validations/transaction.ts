import { z } from "zod";
import { ISO_DATE } from "./common";

const amount = z
  .number({ message: "Nominal harus berupa angka." })
  .int("Nominal harus bilangan bulat.")
  .positive("Nominal harus lebih besar dari 0.");

export const transactionSchema = z
  .object({
    date: z.string().trim().regex(ISO_DATE, "Tanggal wajib diisi."),
    type: z.enum(["Income", "Expense", "Transfer"], { message: "Jenis transaksi wajib dipilih." }),
    category: z.string().trim().default(""),
    amount,
    account: z.string().trim().default(""),
    fromAccount: z.string().trim().default(""),
    toAccount: z.string().trim().default(""),
    description: z.string().trim().max(280, "Deskripsi maksimal 280 karakter.").default(""),
  })
  .superRefine((value, ctx) => {
    if (value.type === "Transfer") {
      if (!value.fromAccount || !value.toAccount) {
        ctx.addIssue({
          code: "custom",
          path: ["fromAccount"],
          message: "Akun asal dan tujuan wajib dipilih.",
        });
      } else if (value.fromAccount === value.toAccount) {
        ctx.addIssue({
          code: "custom",
          path: ["toAccount"],
          message: "Akun asal dan tujuan tidak boleh sama.",
        });
      }
    } else {
      if (!value.category) {
        ctx.addIssue({ code: "custom", path: ["category"], message: "Kategori wajib dipilih." });
      }
      if (!value.account) {
        ctx.addIssue({ code: "custom", path: ["account"], message: "Akun wajib dipilih." });
      }
    }
  });

export type TransactionFormInput = z.input<typeof transactionSchema>;
export type TransactionParsed = z.output<typeof transactionSchema>;
