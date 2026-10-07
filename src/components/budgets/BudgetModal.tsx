"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { useToast } from "@/components/ui/Toaster";
import { apiPatch, apiPost } from "@/lib/api";
import { formatAmountInput, parseIDR } from "@/lib/currency";
import type { Budget } from "@/types/budget";
import type { Category } from "@/types/category";

export function BudgetModal({
  open,
  onClose,
  onSaved,
  month,
  initial = null,
  categories = [],
  takenCategories = [],
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  month: string;
  initial?: Budget | null;
  /** Expense categories to choose from. */
  categories?: Category[];
  /**
   * Category names already budgeted this month (never includes `initial`).
   * ponytail: scoped to the page month; if the user switches month inside the form
   * the API's 409 is the real guard.
   */
  takenCategories?: string[];
}) {
  const toast = useToast();
  const [formMonth, setFormMonth] = useState(month);
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setFormMonth(initial?.month ?? month);
    setCategory(initial?.category ?? "");
    setAmount(initial ? formatAmountInput(String(initial.amount)) : "");
    setSaving(false);
    setCategoryError(null);
    setFormError(null);
  }, [open, initial, month]);

  const expense = categories.filter(
    (item) => item.type === "Expense" && item.status === "Active",
  );
  const options = expense.filter(
    (item) => item.name === initial?.category || !takenCategories.includes(item.name),
  );
  const missingInitial =
    initial && !options.some((item) => item.name === initial.category) ? initial.category : null;

  async function submit() {
    const value = parseIDR(amount);
    setCategoryError(null);
    setFormError(null);

    if (!category) {
      setCategoryError("Kategori wajib dipilih.");
      return;
    }
    if (value <= 0) {
      setFormError("Nominal anggaran harus lebih besar dari 0.");
      return;
    }

    setSaving(true);
    try {
      const body = { month: formMonth, category, amount: value };
      if (initial) {
        await apiPatch<{ budget: Budget }>(`/api/budgets/${initial.id}`, body);
      } else {
        await apiPost<{ budget: Budget }>("/api/budgets", body);
      }
      toast("Anggaran tersimpan.", "success");
      onSaved();
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal menyimpan anggaran.";
      if (message.includes("sudah ada")) setCategoryError(message);
      else setFormError(message);
      toast(message, "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? "Ubah Anggaran" : "Tambah Anggaran"}
      description="Tentukan batas pengeluaran satu kategori untuk bulan ini."
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Batal
          </Button>
          <Button type="submit" form="budget-form" variant="primary" loading={saving}>
            Simpan
          </Button>
        </>
      }
    >
      <form
        id="budget-form"
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <Input
          label="Bulan"
          type="month"
          name="month"
          value={formMonth}
          onChange={(event) => setFormMonth(event.target.value)}
        />
        <Select
          label="Kategori"
          name="category"
          error={categoryError ?? undefined}
          helper={
            options.length || missingInitial ? undefined : "Belum ada kategori pengeluaran aktif."
          }
          value={category}
          onChange={(event) => setCategory(event.target.value)}
        >
          <option value="">Pilih kategori</option>
          {missingInitial ? <option value={missingInitial}>{missingInitial}</option> : null}
          {options.map((item) => (
            <option key={item.id} value={item.name}>
              {item.name}
            </option>
          ))}
        </Select>
        <Input
          label="Nominal anggaran"
          name="amount"
          inputMode="numeric"
          placeholder="0"
          error={formError ?? undefined}
          helper="Contoh: 1.000.000"
          value={amount}
          onChange={(event) => setAmount(formatAmountInput(event.target.value))}
        />
      </form>
    </Modal>
  );
}
