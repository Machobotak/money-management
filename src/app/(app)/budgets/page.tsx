"use client";

import { useState } from "react";
import { BudgetModal } from "@/components/budgets/BudgetModal";
import { BudgetProgressBar } from "@/components/budgets/BudgetProgressBar";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { StatusChip, type ChipTone } from "@/components/ui/Chip";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { SkeletonRows } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toaster";
import { apiDelete } from "@/lib/api";
import { cn } from "@/lib/cn";
import { budgetStatus, budgetUsagePercent, type BudgetStatus } from "@/lib/calculations/finance";
import { useApi } from "@/lib/client/use-api";
import { formatIDR, formatPercent } from "@/lib/currency";
import { currentMonth, formatMonth, shiftMonth } from "@/lib/format-date";
import type { Budget } from "@/types/budget";
import type { Category } from "@/types/category";

interface BudgetsPayload {
  budgets: Budget[];
  spent: Record<string, number>;
  summary: { totalBudget: number; totalSpent: number; remaining: number };
}

interface CategoriesPayload {
  categories: Category[];
}

const STATUS_TONE: Record<BudgetStatus, ChipTone> = {
  Safe: "success",
  Warning: "warning",
  Critical: "error",
  "Over Budget": "error",
};

export default function BudgetsPage() {
  const toast = useToast();
  const [month, setMonth] = useState(currentMonth());
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Budget | null>(null);
  const [deleting, setDeleting] = useState<Budget | null>(null);
  const [deletingBusy, setDeletingBusy] = useState(false);

  const { data, error, loading, reload } = useApi<BudgetsPayload>(`/api/budgets?month=${month}`);
  const { data: categoryData } = useApi<CategoriesPayload>("/api/categories");

  const budgets = data?.budgets ?? [];
  const spent = data?.spent ?? {};
  const summary = data?.summary ?? { totalBudget: 0, totalSpent: 0, remaining: 0 };
  const ready = Boolean(data);

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(budget: Budget) {
    setEditing(budget);
    setModalOpen(true);
  }

  async function confirmDelete() {
    if (!deleting) return;
    setDeletingBusy(true);
    try {
      await apiDelete<{ ok: true }>(`/api/budgets/${deleting.id}`);
      toast("Budget dihapus.", "success");
      setDeleting(null);
      reload();
    } catch (cause) {
      toast(cause instanceof Error ? cause.message : "Gagal menghapus budget.", "error");
    } finally {
      setDeletingBusy(false);
    }
  }

  const takenCategories = budgets
    .filter((budget) => budget.id !== editing?.id)
    .map((budget) => budget.category);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Anggaran"
        subtitle="Batas pengeluaran per kategori, dihitung ulang setiap bulan."
        marker={formatMonth(month)}
        action={
          <Button variant="primary" onClick={openCreate}>
            Tambah anggaran
          </Button>
        }
      />

      <section className="sheet flex flex-wrap items-end gap-4 p-5">
        <Input
          label="Bulan"
          type="month"
          name="month"
          className="max-w-48"
          value={month}
          onChange={(event) => {
            if (event.target.value) setMonth(event.target.value);
          }}
        />
        <div className="flex flex-wrap gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMonth(currentMonth())}
            disabled={month === currentMonth()}
          >
            Bulan ini
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMonth(shiftMonth(month, -1))}
          >
            Bulan sebelumnya
          </Button>
        </div>
      </section>

      {error ? (
        <section className="sheet flex flex-wrap items-center justify-between gap-3 border-t-2 border-t-deb p-5">
          <p className="text-body text-deb">{error}</p>
          <Button variant="secondary" size="sm" onClick={reload}>
            Coba lagi
          </Button>
        </section>
      ) : null}

      <section className="sheet overflow-hidden">
        <h2 className="stamp rule-hair px-5 py-3 text-micro text-muted">
          Rekap {formatMonth(month)}
        </h2>
        <dl className="px-5">
          <div className="rule-hair flex flex-wrap items-baseline justify-between gap-4 py-3">
            <dt className="text-body text-muted">Total anggaran</dt>
            <dd className="fig text-figure text-ink">
              {ready ? formatIDR(summary.totalBudget) : "—"}
            </dd>
          </div>
          <div className="rule-hair flex flex-wrap items-baseline justify-between gap-4 py-3">
            <dt className="text-body text-muted">Terpakai</dt>
            <dd className="fig text-figure text-deb">
              {ready ? formatIDR(summary.totalSpent) : "—"}
            </dd>
          </div>
          <div className="flex flex-wrap items-baseline justify-between gap-4 pb-5 pt-4">
            <dt className="stamp text-micro text-faint">Sisa</dt>
            <dd
              className={cn(
                "fig rule-total pt-2 text-total",
                summary.remaining < 0 ? "text-deb" : "text-cre",
              )}
            >
              {ready ? formatIDR(summary.remaining) : "—"}
            </dd>
          </div>
        </dl>
      </section>

      {loading && !ready ? (
        <section className="sheet p-5">
          <SkeletonRows rows={3} />
        </section>
      ) : budgets.length === 0 ? (
        <EmptyState
          title="Belum ada anggaran bulan ini."
          description="Tetapkan batas per kategori supaya pengeluaran mudah dibaca."
          action={
            <Button variant="primary" onClick={openCreate}>
              Tambah anggaran
            </Button>
          }
        />
      ) : (
        <section className="sheet overflow-hidden">
          <h2 className="stamp rule-hair px-5 py-3 text-micro text-muted">
            Anggaran per kategori
          </h2>
          <ul className="px-5">
            {budgets.map((budget) => {
              const used = spent[budget.category] ?? 0;
              const percent = budgetUsagePercent(used, budget.amount);
              const status = budgetStatus(percent);
              const remaining = budget.amount - used;

              return (
                <li key={budget.id} className="rule-hair py-4 last:border-b-0">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
                    <div className="min-w-0">
                      <p className="truncate text-lead text-ink">{budget.category}</p>
                      <p className="fig text-caption text-muted">
                        {formatPercent(percent)} dari {formatIDR(budget.amount)}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusChip tone={STATUS_TONE[status]}>{status}</StatusChip>
                      <Button size="sm" variant="quiet" onClick={() => openEdit(budget)}>
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="quiet"
                        className="text-deb hover:text-deb"
                        onClick={() => setDeleting(budget)}
                      >
                        Hapus
                      </Button>
                    </div>
                  </div>

                  <div className="mt-3 max-w-2xl">
                    <BudgetProgressBar percent={percent} status={status} />
                  </div>

                  <dl className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-caption text-muted">
                    <div className="flex gap-1.5">
                      <dt>terpakai</dt>
                      <dd className="fig text-ink">{formatIDR(used)}</dd>
                    </div>
                    <div className="flex gap-1.5">
                      <dt>sisa</dt>
                      <dd className={cn("fig", remaining < 0 ? "text-deb" : "text-ink")}>
                        {formatIDR(remaining)}
                      </dd>
                    </div>
                  </dl>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <BudgetModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={() => {
          setModalOpen(false);
          reload();
        }}
        month={month}
        initial={editing}
        categories={categoryData?.categories ?? []}
        takenCategories={takenCategories}
      />

      <Modal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title="Hapus Anggaran"
        description={
          deleting
            ? `Anggaran ${deleting.category} untuk ${formatMonth(deleting.month)} akan dihapus.`
            : undefined
        }
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleting(null)} disabled={deletingBusy}>
              Batal
            </Button>
            <Button variant="destructive" loading={deletingBusy} onClick={() => void confirmDelete()}>
              Hapus
            </Button>
          </>
        }
      >
        <p className="text-body text-muted">
          Riwayat transaksi tidak ikut terhapus — hanya batas anggarannya.
        </p>
      </Modal>
    </div>
  );
}
