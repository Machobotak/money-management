"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { StatusChip } from "@/components/ui/Chip";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useToast } from "@/components/ui/Toaster";
import { apiPost } from "@/lib/api";
import { useApi } from "@/lib/client/use-api";
import type { Account } from "@/types/account";
import type { Category } from "@/types/category";

const DEFAULT_ACCOUNT_KEY = "pfm.defaultAccount";
const DEFAULT_CATEGORY_KEY = "pfm.defaultCategory";

interface DemoUser {
  name: string;
  email: string;
  role: string;
}

interface StorageInfo {
  persistent: boolean;
  datasetVersion: number;
  accounts: number;
  transactions: number;
  budgets: number;
  debts: number;
  recurring: number;
}

interface StatusResponse {
  storage: StorageInfo;
  user: DemoUser;
}

export default function SettingsPage() {
  const toast = useToast();
  const status = useApi<StatusResponse>("/api/settings/status");
  const accounts = useApi<{ accounts: Account[] }>("/api/accounts");
  const categories = useApi<{ categories: Category[] }>("/api/categories");

  const [defaultAccount, setDefaultAccount] = useState("");
  const [defaultCategory, setDefaultCategory] = useState("");
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    setDefaultAccount(window.localStorage.getItem(DEFAULT_ACCOUNT_KEY) ?? "");
    setDefaultCategory(window.localStorage.getItem(DEFAULT_CATEGORY_KEY) ?? "");
  }, []);

  function saveDefaults() {
    window.localStorage.setItem(DEFAULT_ACCOUNT_KEY, defaultAccount);
    window.localStorage.setItem(DEFAULT_CATEGORY_KEY, defaultCategory);
    toast("Pengaturan default disimpan.", "success");
  }

  async function resetDemo() {
    setResetting(true);
    try {
      await apiPost<{ ok: true }>("/api/settings/reset", {});
      status.reload();
      accounts.reload();
      categories.reload();
      toast("Data demo dikembalikan ke contoh awal.", "success");
    } catch (cause) {
      toast(cause instanceof Error ? cause.message : "Gagal menyetel ulang data.", "error");
    } finally {
      setResetting(false);
    }
  }

  async function logout() {
    try {
      await apiPost<{ ok: true }>("/api/auth/logout", {});
    } finally {
      window.location.assign("/login");
    }
  }

  const accountOptions = (accounts.data?.accounts ?? []).filter(
    (account) => account.status === "Active",
  );
  const categoryOptions = (categories.data?.categories ?? []).filter(
    (category) => category.status === "Active",
  );
  const storage = status.data?.storage;
  const user = status.data?.user;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pengaturan"
        subtitle="Profil, penyimpanan demo, dan nilai awal saat mencatat."
      />

      <section className="sheet overflow-hidden">
        <h2 className="stamp rule-hair px-5 py-3 text-micro text-muted">Profil</h2>
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
          <div>
            <p className="text-body text-ink">{user?.name ?? "Pemilik"}</p>
            <p className="text-caption text-muted">
              {user?.email ?? "Akun contoh untuk keperluan portofolio."}
            </p>
          </div>
          <StatusChip tone="neutral">{user?.role ?? "Pengguna Tunggal"}</StatusChip>
        </div>
      </section>

      <section className="sheet overflow-hidden">
        <h2 className="stamp rule-hair px-5 py-3 text-micro text-muted">Penyimpanan Demo</h2>
        <div className="space-y-4 px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {status.loading ? (
              <span className="text-body text-muted">Memuat…</span>
            ) : storage?.persistent ? (
              <StatusChip tone="success">Tersimpan di browser</StatusChip>
            ) : (
              <div className="space-y-1">
                <StatusChip tone="warning">Hanya di memori</StatusChip>
                <p className="text-caption text-muted">
                  {status.error ??
                    "Penyimpanan browser tidak dapat dipakai, jadi perubahan hilang saat halaman dimuat ulang."}
                </p>
              </div>
            )}
            <Button variant="secondary" size="sm" onClick={status.reload}>
              Periksa ulang
            </Button>
          </div>

          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
            {[
              { label: "Transaksi", value: storage?.transactions },
              { label: "Akun", value: storage?.accounts },
              { label: "Kategori", value: categories.data?.categories.length },
              { label: "Anggaran", value: storage?.budgets },
              { label: "Utang & Piutang", value: storage?.debts },
              { label: "Berulang", value: storage?.recurring },
            ].map((entry) => (
              <div key={entry.label} className="rule-hair pb-1.5">
                <dt className="stamp text-micro text-faint">{entry.label}</dt>
                <dd className="fig mt-0.5 text-body text-ink">
                  {typeof entry.value === "number" ? entry.value.toLocaleString("id-ID") : "—"}
                </dd>
              </div>
            ))}
          </dl>

          <p className="text-caption text-faint">
            Seluruh isi buku adalah data contoh yang disimpan di localStorage browser ini. Tidak ada
            server, database, atau layanan pihak ketiga yang dipakai.
          </p>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-caption text-muted">
              Setel ulang akan mengembalikan seluruh buku ke contoh awal dan menghapus perubahanmu.
            </p>
            <Button variant="destructive" size="sm" loading={resetting} onClick={resetDemo}>
              Reset data demo
            </Button>
          </div>
        </div>
      </section>

      <section className="sheet overflow-hidden">
        <h2 className="stamp rule-hair px-5 py-3 text-micro text-muted">Nilai awal</h2>
        <div className="space-y-4 px-5 py-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Mata uang" value="IDR — Rupiah" disabled readOnly />
            <Input label="Tema" value="Gelap — Buku Besar" disabled readOnly />
            <Select
              label="Akun default"
              name="default-account"
              value={defaultAccount}
              onChange={(event) => setDefaultAccount(event.target.value)}
            >
              <option value="">Pilih akun</option>
              {accountOptions.map((account) => (
                <option key={account.id} value={account.name}>
                  {account.name}
                </option>
              ))}
            </Select>
            <Select
              label="Kategori default"
              name="default-category"
              value={defaultCategory}
              onChange={(event) => setDefaultCategory(event.target.value)}
            >
              <option value="">Pilih kategori</option>
              {categoryOptions.map((category) => (
                <option key={category.id} value={category.name}>
                  {category.name} ({category.type})
                </option>
              ))}
            </Select>
          </div>
          <p className="text-caption text-faint">
            Buku dicetak gelap permanen, sama seperti kertasnya. Tidak ada mode terang.
          </p>
          <div className="flex justify-end">
            <Button variant="primary" size="sm" onClick={saveDefaults}>
              Simpan
            </Button>
          </div>
        </div>
      </section>

      <section className="sheet flex flex-wrap items-center justify-between gap-3 px-5 py-4">
        <div>
          <h2 className="text-lead text-ink">Keluar</h2>
          <p className="mt-1 text-body text-muted">Akhiri sesi dan kembali ke halaman masuk.</p>
        </div>
        <Button variant="destructive" size="sm" onClick={logout}>
          Keluar
        </Button>
      </section>
    </div>
  );
}
