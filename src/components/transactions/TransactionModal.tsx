"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { FilterChip } from "@/components/ui/Chip";
import { Label } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { useToast } from "@/components/ui/Toaster";
import { apiFetch, apiPatch, apiPost } from "@/lib/api";
import { formatAmountInput, parseIDR } from "@/lib/currency";
import { todayISO } from "@/lib/format-date";
import { parseReceipt } from "@/lib/receipt/parse";
import { createWorker } from "tesseract.js";
import type { Account } from "@/types/account";
import type { Category } from "@/types/category";
import type { Transaction, TransactionType } from "@/types/transaction";

const TYPES: TransactionType[] = ["Income", "Expense", "Transfer"];

const TYPE_LABEL: Record<TransactionType, string> = {
  Income: "Pemasukan",
  Expense: "Pengeluaran",
  Transfer: "Transfer",
};

export function TransactionModal({
  open,
  onClose,
  onSaved,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
  initial?: Transaction | null;
}) {
  const toast = useToast();
  const [type, setType] = useState<TransactionType>("Expense");
  const [date, setDate] = useState(todayISO());
  const [category, setCategory] = useState("");
  const [account, setAccount] = useState("");
  const [fromAccount, setFromAccount] = useState("");
  const [toAccount, setToAccount] = useState("");
  const [amountText, setAmountText] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [idempotencyKey, setIdempotencyKey] = useState("");
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [optionsError, setOptionsError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // Reset or prefill the form on every open.
  useEffect(() => {
    if (!open) return;
    setSaving(false);
    setScanStatus("");
    if (initial) {
      setType(initial.type);
      setDate(initial.date || todayISO());
      setCategory(initial.category);
      setAccount(initial.account);
      setFromAccount(initial.fromAccount);
      setToAccount(initial.toAccount);
      setAmountText(initial.amount ? formatAmountInput(String(initial.amount)) : "");
      setDescription(initial.description);
    } else {
      setType("Expense");
      setDate(todayISO());
      setCategory("");
      setAccount("");
      setFromAccount("");
      setToAccount("");
      setAmountText("");
      setDescription("");
    }
  }, [open, initial]);

  // One idempotency key per open, so retries of the same submission are dropped.
  useEffect(() => {
    if (open) setIdempotencyKey(crypto.randomUUID());
  }, [open]);

  useEffect(() => {
    if (!open) return;
    let active = true;
    setOptionsError(null);
    Promise.all([
      apiFetch<{ accounts: Account[] }>("/api/accounts"),
      apiFetch<{ categories: Category[] }>("/api/categories"),
    ])
      .then(([accountPayload, categoryPayload]) => {
        if (!active) return;
        setAccounts(accountPayload.accounts);
        setCategories(categoryPayload.categories);
      })
      .catch((error: unknown) => {
        if (!active) return;
        setOptionsError(
          error instanceof Error ? error.message : "Gagal memuat data. Silakan coba lagi.",
        );
      });
    return () => {
      active = false;
    };
  }, [open]);

  const accountNames = accounts
    .filter((item) => item.status === "Active")
    .map((item) => item.name);
  const categoryNames = categories
    .filter((item) => item.status === "Active" && item.type === type)
    .map((item) => item.name);

  // Keep the current value selectable even if it was deactivated after the fact.
  const withCurrent = (options: string[], current: string) =>
    current && !options.includes(current) ? [current, ...options] : options;

  const accountOptions = withCurrent(accountNames, account);
  const fromOptions = withCurrent(accountNames, fromAccount);
  const toOptions = withCurrent(accountNames, toAccount);
  const categoryOptions = withCurrent(categoryNames, category);
  const sameAccount = Boolean(fromAccount) && fromAccount === toAccount;
  // Foto HP langsung ke OCR: samakan ukuran + dorong kontras dulu.
  // Struk thermal kontrasnya rendah; tanpa ini LSTM sering salah baca angka.
  async function preprocessReceipt(source: File): Promise<Blob> {
    const bitmap = await createImageBitmap(source);
    const scale = Math.min(1, 2000 / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) return source;
    context.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();
    const frame = context.getImageData(0, 0, width, height);
    const pixels = frame.data;
    for (let i = 0; i < pixels.length; i += 4) {
      const gray = ((pixels[i] * 77 + pixels[i + 1] * 150 + pixels[i + 2] * 29) >> 8);
      const boosted = gray < 128 ? Math.max(0, gray - 24) : Math.min(255, gray + 24);
      pixels[i] = boosted;
      pixels[i + 1] = boosted;
      pixels[i + 2] = boosted;
    }
    context.putImageData(frame, 0, 0);
    const encoded = Promise.withResolvers<Blob | null>();
    canvas.toBlob(encoded.resolve, "image/png");
    return (await encoded.promise) ?? source;
  }

  async function handleScanFile(event: React.ChangeEvent<HTMLInputElement>) {
    const source = event.target.files?.[0];
    event.target.value = "";
    if (!source || scanning) return;
    setScanning(true);
    setScanStatus("Menyiapkan foto…");
    try {
      const image = await preprocessReceipt(source);
      setScanStatus("Memuat model OCR…");
      const worker = await createWorker(["eng", "ind"], 1, {
        logger: (message) => {
          if (message.status === "recognizing text") {
            setScanStatus("Membaca struk… " + Math.round(message.progress * 100) + "%");
          }
        },
      });
      const {
        data: { text },
      } = await worker.recognize(image, { rotateAuto: true });
      await worker.terminate();
      const receipt = parseReceipt(text);
      if (receipt.amount !== null) setAmountText(formatAmountInput(String(receipt.amount)));
      if (receipt.date) setDate(receipt.date);
      if (receipt.description) setDescription(receipt.description);
      setType("Expense");
      setScanStatus("");
      const found = [
        receipt.amount !== null ? "nominal" : "",
        receipt.date ? "tanggal" : "",
      ].filter(Boolean);
      if (found.length > 0) {
        toast("Struk terbaca (" + found.join(" + ") + "). Cek lagi sebelum simpan.");
      } else {
        toast("Teks struk tidak terbaca. Isi manual ya.", "error");
      }
    } catch {
      setScanStatus("");
      toast("Gagal membaca struk. Isi manual ya.", "error");
    } finally {
      setScanning(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    if (!date) return toast("Tanggal wajib diisi.", "error");
    if (type === "Transfer") {
      if (!fromAccount || !toAccount) return toast("Akun asal dan tujuan wajib dipilih.", "error");
      if (fromAccount === toAccount) return toast("Akun asal dan tujuan tidak boleh sama.", "error");
    }
    const amount = parseIDR(amountText);
    if (amount <= 0) return toast("Nominal harus lebih besar dari 0.", "error");
    if (type !== "Transfer" && !category) return toast("Kategori wajib dipilih.", "error");
    if (type !== "Transfer" && !account) return toast("Akun wajib dipilih.", "error");

    const idOf = (name: string) => accounts.find((item) => item.name === name)?.id ?? "";
    const body = {
      date,
      type,
      category: type === "Transfer" ? "" : category,
      amount,
      account: type === "Transfer" ? "" : idOf(account),
      fromAccount: type === "Transfer" ? idOf(fromAccount) : "",
      toAccount: type === "Transfer" ? idOf(toAccount) : "",
      description,
    };

    setSaving(true);
    try {
      if (initial) {
        await apiPatch(`/api/transactions/${initial.id}`, body);
      } else {
        await apiPost("/api/transactions", body, {
          headers: { "Idempotency-Key": idempotencyKey },
        });
      }
      toast("Transaksi tersimpan.");
      onSaved?.();
      onClose();
    } catch (error) {
      toast(
        error instanceof Error ? error.message : "Gagal menyimpan transaksi. Silakan coba lagi.",
        "error",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? "Ubah Transaksi" : "Tambah Transaksi"}
      description={
        initial
          ? "Ubah detail catatan ini lalu simpan."
          : "Catat pemasukan, pengeluaran, atau transfer antar akun."
      }
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Batal
          </Button>
          <Button variant="primary" type="submit" form="transaction-form" loading={saving}>
            Simpan
          </Button>
        </>
      }
    >
      <form id="transaction-form" onSubmit={handleSubmit} className="space-y-4">
        {initial ? null : (
          <div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              aria-hidden={!scanning}
              tabIndex={-1}
              onChange={handleScanFile}
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              loading={scanning}
              onClick={() => fileRef.current?.click()}
            >
              Scan struk
            </Button>
            {scanStatus ? <p className="mt-2 text-caption text-faint">{scanStatus}</p> : null}
          </div>
        )}
        <div>
          <Label>Jenis</Label>
          <div className="flex flex-wrap gap-2">
            {TYPES.map((value) => (
              <FilterChip key={value} active={type === value} onClick={() => setType(value)}>
                {TYPE_LABEL[value]}
              </FilterChip>
            ))}
          </div>
        </div>

        <Input
          name="amount"
          label="Nominal"
          inputMode="numeric"
          placeholder="0"
          value={amountText}
          onChange={(event) => setAmountText(formatAmountInput(event.target.value))}
        />

        <Input
          name="date"
          label="Tanggal"
          type="date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
        />

        {type === "Transfer" ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              name="fromAccount"
              label="Dari akun"
              value={fromAccount}
              onChange={(event) => setFromAccount(event.target.value)}
              helper={optionsError ?? undefined}
            >
              <option value="">Pilih akun</option>
              {fromOptions.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </Select>
            <Select
              name="toAccount"
              label="Ke akun"
              value={toAccount}
              onChange={(event) => setToAccount(event.target.value)}
              error={sameAccount ? "Akun asal dan tujuan tidak boleh sama." : undefined}
            >
              <option value="">Pilih akun</option>
              {toOptions.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </Select>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              name="category"
              label="Kategori"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              helper={
                categoryOptions.length === 0
                  ? "Belum ada kategori untuk jenis ini. Tambahkan dulu di halaman Kategori."
                  : undefined
              }
            >
              <option value="">Pilih kategori</option>
              {categoryOptions.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </Select>
            <Select
              name="account"
              label="Akun"
              value={account}
              onChange={(event) => setAccount(event.target.value)}
              helper={optionsError ?? undefined}
            >
              <option value="">Pilih akun</option>
              {accountOptions.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </Select>
          </div>
        )}

        <Textarea
          name="description"
          label="Deskripsi (opsional)"
          rows={2}
          placeholder="Misal: makan siang"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </form>
    </Modal>
  );
}
