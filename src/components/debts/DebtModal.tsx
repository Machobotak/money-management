"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { useToast } from "@/components/ui/Toaster";
import { apiPatch, apiPost } from "@/lib/api";
import { formatAmountInput, parseIDR } from "@/lib/currency";
import type { Debt, DebtType } from "@/types/debt";

const TYPE_LABEL: Record<DebtType, string> = {
  Debt: "Hutang (saya berhutang)",
  Receivable: "Piutang (orang berhutang)",
};

export function DebtModal({
  open,
  onClose,
  onSaved,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  initial?: Debt;
}) {
  const toast = useToast();
  const [type, setType] = useState<DebtType>("Debt");
  const [person, setPerson] = useState("");
  const [amount, setAmount] = useState("");
  const [paidAmount, setPaidAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setType(initial?.type ?? "Debt");
    setPerson(initial?.person ?? "");
    setAmount(initial ? formatAmountInput(String(initial.amount)) : "");
    setPaidAmount(formatAmountInput(String(initial?.paidAmount ?? 0)));
    setDueDate(initial?.dueDate ?? "");
    setDescription(initial?.description ?? "");
    setError(null);
    setSaving(false);
  }, [open, initial]);

  const submit = async () => {
    const amountValue = parseIDR(amount);
    const paidValue = parseIDR(paidAmount);
    if (!person.trim()) {
      setError("Nama orang wajib diisi.");
      return;
    }
    if (amountValue <= 0) {
      setError("Nominal harus lebih besar dari 0.");
      return;
    }
    if (paidValue > amountValue) {
      setError("Pembayaran melebihi sisa hutang.");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const body = {
        type,
        person: person.trim(),
        amount: amountValue,
        paidAmount: paidValue,
        dueDate,
        description: description.trim(),
      };
      if (initial) await apiPatch(`/api/debts/${initial.id}`, body);
      else await apiPost("/api/debts", body);
      toast(initial ? "Catatan diperbarui." : "Catatan ditambahkan.", "success");
      onSaved();
      onClose();
    } catch (cause) {
      toast(cause instanceof Error ? cause.message : "Gagal menyimpan. Silakan coba lagi.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? "Ubah Catatan" : "Tambah Catatan"}
      description="Hutang atau piutang tidak mengubah saldo akun — hanya catatan siapa berhutang kepada siapa."
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
        <Select
          label="Jenis"
          name="debt-type"
          value={type}
          onChange={(event) => setType(event.target.value as DebtType)}
        >
          {(["Debt", "Receivable"] as DebtType[]).map((value) => (
            <option key={value} value={value}>
              {TYPE_LABEL[value]}
            </option>
          ))}
        </Select>
        <Input
          label="Nama orang"
          name="person"
          value={person}
          onChange={(event) => setPerson(event.target.value)}
          placeholder="Contoh: Budi"
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Nominal"
            name="amount"
            inputMode="numeric"
            value={amount}
            onChange={(event) => setAmount(formatAmountInput(event.target.value))}
            placeholder="0"
          />
          <Input
            label="Sudah dibayar"
            name="paidAmount"
            inputMode="numeric"
            value={paidAmount}
            onChange={(event) => setPaidAmount(formatAmountInput(event.target.value))}
            placeholder="0"
          />
        </div>
        <Input
          label="Jatuh tempo (opsional)"
          name="dueDate"
          type="date"
          value={dueDate}
          onChange={(event) => setDueDate(event.target.value)}
        />
        <Textarea
          label="Catatan (opsional)"
          name="description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Detail tambahan..."
        />
        {error ? <p className="text-caption text-deb">{error}</p> : null}
      </div>
    </Modal>
  );
}
