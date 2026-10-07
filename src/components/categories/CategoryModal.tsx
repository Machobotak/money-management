"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { useToast } from "@/components/ui/Toaster";
import { apiPatch, apiPost } from "@/lib/api";
import type { Category, CategoryStatus, CategoryType } from "@/types";

const TYPE_OPTIONS: { value: CategoryType; label: string }[] = [
  { value: "Income", label: "Pemasukan" },
  { value: "Expense", label: "Pengeluaran" },
];

const STATUS_OPTIONS: { value: CategoryStatus; label: string }[] = [
  { value: "Active", label: "Aktif" },
  { value: "Inactive", label: "Nonaktif" },
];

const FORM_ID = "category-form";

export function CategoryModal({
  open,
  category,
  defaultType = "Expense",
  onClose,
  onSaved,
}: {
  open: boolean;
  category?: Category | null;
  defaultType?: CategoryType;
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [name, setName] = useState("");
  const [type, setType] = useState<CategoryType>(defaultType);
  const [status, setStatus] = useState<CategoryStatus>("Active");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(category?.name ?? "");
    setType(category?.type ?? defaultType);
    setStatus(category?.status ?? "Active");
    setError(null);
  }, [open, category, defaultType]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) {
      setError("Nama kategori wajib diisi.");
      return;
    }

    setPending(true);
    setError(null);
    try {
      const body = { name: name.trim(), type, status };
      if (category) {
        await apiPatch(`/api/categories/${category.id}`, body);
      } else {
        await apiPost("/api/categories", body);
      }
      toast(category ? "Kategori diperbarui." : "Kategori ditambahkan.", "success");
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
      title={category ? "Ubah Kategori" : "Tambah Kategori"}
      description={category ? "Perbarui kategori ini." : "Kelompokkan transaksimu."}
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
          id="category-name"
          label="Nama kategori"
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={60}
          placeholder="Contoh: Makanan"
        />
        <Select
          id="category-type"
          label="Jenis"
          value={type}
          onChange={(event) => setType(event.target.value as CategoryType)}
        >
          {TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
        <Select
          id="category-status"
          label="Status"
          value={status}
          onChange={(event) => setStatus(event.target.value as CategoryStatus)}
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
