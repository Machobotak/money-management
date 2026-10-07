"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toaster";
import { apiPatch } from "@/lib/api";
import { formatAmountInput, formatIDR, parseIDR } from "@/lib/currency";
import { debtRemaining } from "@/lib/calculations/finance";
import type { Debt } from "@/types/debt";

export function PaymentModal({
  open,
  onClose,
  onSaved,
  debt,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  debt: Debt | null;
}) {
  const toast = useToast();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const remaining = debt ? debtRemaining(debt) : 0;

  useEffect(() => {
    if (!open) return;
    setValue("");
    setError(null);
    setSaving(false);
  }, [open, debt]);

  const submit = async () => {
    if (!debt) return;
    const payAmount = parseIDR(value);
    if (payAmount <= 0) {
      setError("Nominal pembayaran harus lebih besar dari 0.");
      return;
    }
    if (payAmount > remaining) {
      setError("Pembayaran melebihi sisa hutang.");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await apiPatch(`/api/debts/${debt.id}`, { payAmount });
      toast("Pembayaran tercatat.", "success");
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
      title="Catat Pembayaran"
      description={debt ? `Pembayaran untuk ${debt.person}.` : undefined}
      size="sm"
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
      <Input
        label="Nominal pembayaran"
        name="payAmount"
        inputMode="numeric"
        value={value}
        onChange={(event) => setValue(formatAmountInput(event.target.value))}
        placeholder="0"
        error={error ?? undefined}
        helper={`Sisa saat ini: ${formatIDR(remaining)}`}
      />
    </Modal>
  );
}
