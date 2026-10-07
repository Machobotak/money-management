"use client";

import { useEffect, useState } from "react";
import { QuickAddButton } from "@/components/transactions/QuickAddButton";
import { TransactionTable } from "@/components/transactions/TransactionTable";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { SkeletonRows } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toaster";
import { apiFetch } from "@/lib/api";
import { useApi } from "@/lib/client/use-api";
import type { Account } from "@/types/account";
import type { Category } from "@/types/category";
import type { Transaction } from "@/types/transaction";

type SortOrder = "desc" | "asc";
const LIMIT = 20;

interface TransactionsPayload {
  transactions: Transaction[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function TransactionsPage() {
  const toast = useToast();
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [type, setType] = useState("");
  const [category, setCategory] = useState("");
  const [account, setAccount] = useState("");
  const [sort, setSort] = useState<SortOrder>("desc");
  const [page, setPage] = useState(1);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    let active = true;
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
        toast(
          error instanceof Error ? error.message : "Gagal memuat data. Silakan coba lagi.",
          "error",
        );
      });
    return () => {
      active = false;
    };
  }, [toast]);

  // Debounce the search box into the query parameter.
  useEffect(() => {
    const timer = setTimeout(() => setSearch(q.trim()), 300);
    return () => clearTimeout(timer);
  }, [q]);

  const params = new URLSearchParams({
    page: String(page),
    limit: String(LIMIT),
  });
  if (search) params.set("q", search);
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  if (type) params.set("type", type);
  if (category) params.set("category", category);
  if (account) params.set("account", account);

  const { data, error, loading, reload } = useApi<TransactionsPayload>(
    `/api/transactions?${params.toString()}`,
  );

  const rows = data
    ? sort === "asc"
      ? [...data.transactions].reverse()
      : data.transactions
    : [];
  const hasFilters = Boolean(search || from || to || type || category || account);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Transaksi"
        subtitle="Semua pemasukan, pengeluaran, dan transfer yang tercatat di buku."
        marker={data ? `${data.total} baris` : loading ? "memuat…" : undefined}
        action={<QuickAddButton onSaved={reload} />}
      />

      <section className="sheet flex flex-col gap-4 p-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Input
            name="q"
            label="Cari"
            placeholder="Deskripsi, kategori, akun..."
            value={q}
            onChange={(event) => {
              setQ(event.target.value);
              setPage(1);
            }}
          />
          <Input
            name="from"
            label="Dari tanggal"
            type="date"
            value={from}
            onChange={(event) => {
              setFrom(event.target.value);
              setPage(1);
            }}
          />
          <Input
            name="to"
            label="Sampai tanggal"
            type="date"
            value={to}
            onChange={(event) => {
              setTo(event.target.value);
              setPage(1);
            }}
          />
          <Select
            name="type"
            label="Jenis"
            value={type}
            onChange={(event) => {
              setType(event.target.value);
              setPage(1);
            }}
          >
            <option value="">Semua</option>
            <option value="Income">Income</option>
            <option value="Expense">Expense</option>
            <option value="Transfer">Transfer</option>
          </Select>
          <Select
            name="category"
            label="Kategori"
            value={category}
            onChange={(event) => {
              setCategory(event.target.value);
              setPage(1);
            }}
          >
            <option value="">Semua</option>
            {categories.map((item) => (
              <option key={item.id} value={item.name}>
                {item.name}
              </option>
            ))}
          </Select>
          <Select
            name="account"
            label="Akun"
            value={account}
            onChange={(event) => {
              setAccount(event.target.value);
              setPage(1);
            }}
          >
            <option value="">Semua</option>
            {accounts.map((item) => (
              <option key={item.id} value={item.name}>
                {item.name}
              </option>
            ))}
          </Select>
        </div>

        {hasFilters ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="stamp text-micro text-faint">filter aktif</span>
            <Button
              variant="quiet"
              size="sm"
              onClick={() => {
                setQ("");
                setFrom("");
                setTo("");
                setType("");
                setCategory("");
                setAccount("");
                setPage(1);
              }}
            >
              Bersihkan filter
            </Button>
          </div>
        ) : null}
      </section>

      {loading && !data ? <SkeletonRows rows={6} /> : null}

      {error ? (
        <section className="sheet flex flex-wrap items-center justify-between gap-3 p-5">
          <p className="text-body text-deb">{error}</p>
          <Button variant="secondary" size="sm" onClick={reload}>
            Coba lagi
          </Button>
        </section>
      ) : null}

      {!error && data && data.transactions.length === 0 ? (
        hasFilters ? (
          <EmptyState
            title="Tidak ada baris yang cocok."
            description="Longgarkan filter untuk melihat lebih banyak catatan."
          />
        ) : (
          <EmptyState
            title="Buku masih kosong."
            description="Catat transaksi pertama untuk mulai mengisi halaman ini."
            action={<QuickAddButton onSaved={reload} />}
          />
        )
      ) : null}

      {!error && rows.length > 0 ? (
        <>
          <TransactionTable transactions={rows} onChanged={reload} />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button
              variant="quiet"
              size="sm"
              onClick={() => setSort((current) => (current === "desc" ? "asc" : "desc"))}
            >
              Urut: {sort === "desc" ? "terbaru dulu" : "terlama dulu"}
            </Button>
            <div className="flex flex-wrap items-center gap-3">
              <span className="fig text-caption text-faint">
                halaman {data?.page ?? 1} / {data?.totalPages ?? 1}
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={(data?.page ?? 1) <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                Sebelumnya
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={(data?.page ?? 1) >= (data?.totalPages ?? 1)}
                onClick={() => setPage((current) => current + 1)}
              >
                Berikutnya
              </Button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
