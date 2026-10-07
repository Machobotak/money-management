"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { useToast } from "@/components/ui/Toaster";
import { apiPatch, apiPost } from "@/lib/api";
import { cn } from "@/lib/cn";
import { formatAmountInput, parseIDR } from "@/lib/currency";
import { useApi } from "@/lib/client/use-api";
import { todayISO } from "@/lib/format-date";
import { FREQUENCIES } from "@/lib/validations/recurring";
import type { Account } from "@/types/account";
import type { Category } from "@/types/category";
import type { Recurring } from "@/types/recurring";

const FREQUENCY_LABEL: Record<Recurring["frequency"], string> = {
  Daily: "Harian",
  Weekly: "Mingguan",
  Monthly: "Bulanan",
  Yearly: "Tahunan",
};

/** A switch drawn as a ruled slot: the knob is a tab in the index. */
export function RecurringSwitch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-[22px] w-[40px] shrink-0 rounded-sm border transition-colors duration-150",
        checked ? "border-brass bg-raised" : "border-rule-hair bg-paper",
      )}
    >
      <span
        className={cn(
          "absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-[1px] transition-all duration-150",
          checked ? "left-[21px] bg-brass" : "left-[3px] bg-faint",
        )}
      />
    </button>
  );
}

interface FormState {
  name: string;
  type: "Income" | "Expense";
  category: string;
  amount: string;
  account: string;
  frequency: Recurring["frequency"];
  startDate: string;
  endDate: string;
  active: boolean;
}

function emptyForm(): FormState {
  return {
    name: "",
    type: "Expense",
    category: "",
    amount: "",
    account: "",
    frequency: "Monthly",
    startDate: todayISO(),
    endDate: "",
    active: true,
  };
}

export function RecurringModal({
  open,
  onClose,
  onSaved,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  initial?: Recurring | null;
}) {
  const toast = useToast();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const categories = useApi<{ categories: Category[] }>(open ? "/api/categories" : null);
  const accounts = useApi<{ accounts: Account[] }>(open ? "/api/accounts" : null);

  useEffect(() => {
    if (!open) return;
    setError("");
    setForm(
      initial
        ? {
            name: initial.name,
            type: initial.type,
            category: initial.category,
            amount: formatAmountInput(String(initial.amount)),
            account: initial.account,
            frequency: initial.frequency,
            startDate: initial.startDate,
            endDate: initial.endDate,
            active: initial.active,
          }
        : emptyForm(),
    );
  }, [open, initial]);

  const categoryOptions = (categories.data?.categories ?? []).filter(
    (category) => category.status === "Active" && category.type === form.type,
  );
  const accountOptions = (accounts.data?.accounts ?? []).filter(
    (account) => account.status === "Active",
  );

  async function submit() {
    setError("");
    if (!form.name.trim()) return setError("Nama wajib diisi.");
    if (parseIDR(form.amount) <= 0) return setError("Nominal harus lebih besar dari 0.");
    if (!form.category) return setError("Kategori wajib dipilih.");
    if (!form.account) return setError("Akun wajib dipilih.");
    if (!form.startDate) return setError("Tanggal mulai wajib diisi.");

    const payload = {
      name: form.name.trim(),
      type: form.type,
      category: form.category,
      amount: parseIDR(form.amount),
      account: form.account,
      frequency: form.frequency,
      startDate: form.startDate,
      endDate: form.endDate,
      active: form.active,
    };

    setSaving(true);
    try {
      if (initial) {
        await apiPatch<{ recurring: Recurring }>("/api/recurring/" + initial.id, payload);
      } else {
        await apiPost<{ recurring: Recurring }>("/api/recurring", payload);
      }
      toast(initial ? "Jadwal disimpan." : "Jadwal ditambahkan.", "success");
      onSaved();
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Gagal menyimpan. Silakan coba lagi.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? "Ubah Jadwal" : "Tambah Jadwal"}
      description="Jadwal dipakai untuk menandai kapan transaksi berikutnya jatuh tempo."
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Batal
          </Button>
          <Button variant="primary" onClick={submit} loading={saving}>
            Simpan
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input
          label="Nama"
          name="recurring-name"
          value={form.name}
          maxLength={60}
          placeholder="Contoh: Langganan musik"
          onChange={(event) => setForm({ ...form, name: event.target.value })}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Jenis"
            name="recurring-type"
            value={form.type}
            onChange={(event) =>
              setForm({
                ...form,
                type: event.target.value === "Income" ? "Income" : "Expense",
                category: "",
              })
            }
          >
            <option value="Income">Income</option>
            <option value="Expense">Expense</option>
          </Select>

          <Select
            label="Kategori"
            name="recurring-category"
            value={form.category}
            onChange={(event) => setForm({ ...form, category: event.target.value })}
          >
            <option value="">Pilih kategori</option>
            {categoryOptions.map((category) => (
              <option key={category.id} value={category.name}>
                {category.name}
              </option>
            ))}
          </Select>

          <Input
            label="Nominal"
            name="recurring-amount"
            inputMode="numeric"
            placeholder="0"
            value={form.amount}
            onChange={(event) => setForm({ ...form, amount: formatAmountInput(event.target.value) })}
          />

          <Select
            label="Akun"
            name="recurring-account"
            value={form.account}
            onChange={(event) => setForm({ ...form, account: event.target.value })}
          >
            <option value="">Pilih akun</option>
            {accountOptions.map((account) => (
              <option key={account.id} value={account.name}>
                {account.name}
              </option>
            ))}
          </Select>

          <Select
            label="Frekuensi"
            name="recurring-frequency"
            helper="MVP memprioritaskan Bulanan."
            value={form.frequency}
            onChange={(event) =>
              setForm({ ...form, frequency: event.target.value as Recurring["frequency"] })
            }
          >
            {FREQUENCIES.map((frequency) => (
              <option key={frequency} value={frequency}>
                {FREQUENCY_LABEL[frequency]}
              </option>
            ))}
          </Select>

          <Input
            label="Tanggal mulai"
            name="recurring-start"
            type="date"
            value={form.startDate}
            onChange={(event) => setForm({ ...form, startDate: event.target.value })}
          />

          <Input
            label="Tanggal selesai (opsional)"
            name="recurring-end"
            type="date"
            helper="Kosongkan bila berjalan terus."
            value={form.endDate}
            onChange={(event) => setForm({ ...form, endDate: event.target.value })}
          />
        </div>

        <div className="flex items-center gap-3">
          <RecurringSwitch
            checked={form.active}
            onChange={(next) => setForm({ ...form, active: next })}
            label="Aktif"
          />
          <span className="text-body text-muted">{form.active ? "Aktif" : "Nonaktif"}</span>
        </div>

        {error ? <p className="text-caption text-deb">{error}</p> : null}
      </div>
    </Modal>
  );
}
