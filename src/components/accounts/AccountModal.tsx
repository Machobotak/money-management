"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { useToast } from "@/components/ui/Toaster";
import { apiPatch, apiPost } from "@/lib/api";
import { formatAmountInput, formatIDR, parseIDR } from "@/lib/currency";
import type { Account, AccountStatus, AccountType } from "@/types";

const TYPE_OPTIONS: { value: AccountType; label: string }[] = [
  { value: "Cash", label: "Tunai" },
  { value: "Bank", label: "Bank" },
  { value: "E-Wallet", label: "E-Wallet" },
  { value: "Other", label: "Lainnya" },
];

const STATUS_OPTIONS: { value: AccountStatus; label: string }[] = [
  { value: "Active", label: "Aktif" },
  { value: "Inactive", label: "Nonaktif" },
];

const FORM_ID = "account-form";

export function AccountModal({
  open,
  account,
  onClose,
  onSaved,
}: {
  open: boolean;
  account?: Account | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [name, setName] = useState("");
  const [type, setType] = useState<AccountType>("Cash");
  const [initialBalance, setInitialBalance] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [status, setStatus] = useState<AccountStatus>("Active");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(account?.name ?? "");
    setType(account?.type ?? "Cash");
    setInitialBalance(account ? formatAmountInput(String(account.initialBalance)) : "");
    setAccountNumber(account?.accountNumber ?? "");
    setStatus(account?.status ?? "Active");
    setError(null);
  }, [open, account]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) {
      setError("Nama akun wajib diisi.");
      return;
    }

    setPending(true);
    setError(null);
    try {
      const body = {
        name: name.trim(),
        type,
        initialBalance: parseIDR(initialBalance),
        accountNumber: accountNumber.trim(),
        status,
      };
      if (account) {
        await apiPatch(`/api/accounts/${account.id}`, body);
      } else {
        await apiPost("/api/accounts", body);
      }
      toast(account ? "Akun diperbarui." : "Akun ditambahkan.", "success");
      onSaved();
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Gagal menyimpan. Silakan coba lagi.";
      setError(message);
      toast(message, "error");
    } finally {
      setPending(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={account ? "Ubah Akun" : "Tambah Akun"}
      description={
        account
          ? "Perbarui data akun ini."
          : "Catat tempat uang disimpan supaya saldonya bisa dibaca."
      }
      footer={
        <>
          <Button type="button" variant="ghost" onClick={onClose} disabled={pending}>
            Batal
          </Button>
          <Button type="submit" form={FORM_ID} variant="primary" loading={pending}>
            Simpan
          </Button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={submit} className="space-y-4">
        <Input
          id="account-name"
          label="Nama akun"
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={60}
          placeholder="Contoh: Jago"
          error={error && error.toLowerCase().includes("nama") ? error : undefined}
          helper={
            account
              ? "Mengganti nama tidak memindahkan transaksi lama. Riwayat tetap memakai nama sebelumnya."
              : undefined
          }
        />
        <Select
          id="account-type"
          label="Tipe akun"
          value={type}
          onChange={(event) => setType(event.target.value as AccountType)}
        >
          {TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
        <Input
          id="account-number"
          label="No. rekening / HP"
          value={accountNumber}
          onChange={(event) => setAccountNumber(event.target.value)}
          maxLength={40}
          placeholder="Contoh: 1234567890"
          error={error && /nomor|rekening/i.test(error) ? error : undefined}
          helper="Opsional. Kosongkan jika tidak ada."
        />
        <Input
          id="account-initial-balance"
          label="Saldo awal"
          value={initialBalance}
          onChange={(event) => setInitialBalance(formatAmountInput(event.target.value))}
          inputMode="numeric"
          placeholder="0"
          helper={
            initialBalance
              ? `Saldo awal: ${formatIDR(parseIDR(initialBalance))}`
              : "Kosongkan jika saldo awal nol."
          }
        />
        <Select
          id="account-status"
          label="Status"
          value={status}
          onChange={(event) => setStatus(event.target.value as AccountStatus)}
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
        {error ? <p className="text-caption text-deb">{error}</p> : null}
      </form>
    </Modal>
  );
}
