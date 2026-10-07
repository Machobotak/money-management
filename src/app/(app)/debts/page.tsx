"use client";

import { useMemo, useState } from "react";
import { DebtModal } from "@/components/debts/DebtModal";
import { PaymentModal } from "@/components/debts/PaymentModal";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { StatusChip, type ChipTone } from "@/components/ui/Chip";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { SkeletonRows } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toaster";
import { apiDelete } from "@/lib/api";
import { cn } from "@/lib/cn";
import { debtRemaining } from "@/lib/calculations/finance";
import { useApi } from "@/lib/client/use-api";
import { formatIDR } from "@/lib/currency";
import { formatDate, todayISO } from "@/lib/format-date";
import type { Debt, DebtStatus, DebtType } from "@/types/debt";

const STATUS_TONE: Record<DebtStatus, ChipTone> = {
  Pending: "neutral",
  "Partially Paid": "warning",
  Paid: "success",
  Overdue: "error",
};

const STATUS_LABEL: Record<DebtStatus, string> = {
  Pending: "Belum dibayar",
  "Partially Paid": "Sebagian",
  Paid: "Lunas",
  Overdue: "Terlambat",
};

const GROUPS: Array<{ type: DebtType; title: string; empty: string }> = [
  { type: "Debt", title: "Hutang saya", empty: "Tidak ada hutang aktif." },
  { type: "Receivable", title: "Piutang saya", empty: "Tidak ada piutang aktif." },
];

export default function DebtsPage() {
  const toast = useToast();
  const { data, error, loading, reload } = useApi<{ debts: Debt[] }>("/api/debts");
  const [editing, setEditing] = useState<Debt | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [payTarget, setPayTarget] = useState<Debt | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Debt | null>(null);
  const [deleting, setDeleting] = useState(false);

  const debts = useMemo(() => data?.debts ?? [], [data]);
  const grouped = useMemo(
    () =>
      GROUPS.map((group) => {
        const items = debts.filter((debt) => debt.type === group.type);
        return {
          ...group,
          items,
          total: items.reduce((sum, debt) => sum + debtRemaining(debt), 0),
        };
      }),
    [debts],
  );
  const [debtsGroup, receivablesGroup] = grouped;
  const today = todayISO();

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (debt: Debt) => {
    setEditing(debt);
    setModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiDelete(`/api/debts/${deleteTarget.id}`);
      toast("Hutang dihapus.", "success");
      setDeleteTarget(null);
      reload();
    } catch (cause) {
      toast(cause instanceof Error ? cause.message : "Gagal menghapus. Silakan coba lagi.", "error");
    } finally {
      setDeleting(false);
    }
  };

  const renderItem = (debt: Debt) => {
    const remaining = debtRemaining(debt);
    return (
      <li key={debt.id} className="sheet p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
          <div className="min-w-0">
            <p className="truncate text-lead text-ink">{debt.person}</p>
            {debt.description ? (
              <p className="mt-0.5 text-caption text-muted">{debt.description}</p>
            ) : null}
          </div>
          <StatusChip tone={STATUS_TONE[debt.status]}>{STATUS_LABEL[debt.status]}</StatusChip>
        </div>

        <dl className="rule-hair mt-3 flex flex-wrap gap-x-6 gap-y-1 pb-3 text-caption text-muted">
          <div className="flex gap-1.5">
            <dt>Nilai</dt>
            <dd className="fig text-ink">{formatIDR(debt.amount)}</dd>
          </div>
          <div className="flex gap-1.5">
            <dt>Terbayar</dt>
            <dd className="fig text-muted">{formatIDR(debt.paidAmount)}</dd>
          </div>
          <div className="flex gap-1.5">
            <dt>Sisa</dt>
            <dd className={cn("fig", remaining > 0 ? "text-deb" : "text-cre")}>
              {formatIDR(remaining)}
            </dd>
          </div>
        </dl>

        <p
          className={cn(
            "mt-2 text-caption",
            debt.dueDate && debt.dueDate < today && debt.status !== "Paid"
              ? "text-deb"
              : "text-faint",
          )}
        >
          {debt.dueDate ? `Jatuh tempo ${formatDate(debt.dueDate)}` : "Tanpa jatuh tempo"}
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setPayTarget(debt)}
            disabled={remaining <= 0}
          >
            Catat pembayaran
          </Button>
          <Button size="sm" variant="quiet" onClick={() => openEdit(debt)}>
            Edit
          </Button>
          <Button
            size="sm"
            variant="quiet"
            className="text-deb hover:text-deb"
            onClick={() => setDeleteTarget(debt)}
          >
            Hapus
          </Button>
        </div>
      </li>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Utang & Piutang"
        subtitle="Catatan pinjaman, tagihan, dan pembayarannya."
        marker={data ? `${debts.length} catatan` : undefined}
        action={
          <Button variant="primary" onClick={openCreate}>
            Tambah catatan
          </Button>
        }
      />

      <section className="sheet overflow-hidden">
        <h2 className="stamp rule-hair px-5 py-3 text-micro text-muted">Posisi bersih</h2>
        <dl className="px-5">
          <div className="rule-hair flex flex-wrap items-baseline justify-between gap-4 py-3">
            <dt className="text-body text-muted">Total hutang</dt>
            <dd className="fig text-figure text-deb">{formatIDR(debtsGroup.total)}</dd>
          </div>
          <div className="flex flex-wrap items-baseline justify-between gap-4 pb-5 pt-3">
            <dt className="text-body text-muted">Total piutang</dt>
            <dd className="fig text-figure text-cre">{formatIDR(receivablesGroup.total)}</dd>
          </div>
        </dl>
      </section>

      {error ? (
        <section className="sheet flex flex-wrap items-center justify-between gap-3 border-t-2 border-t-deb p-5">
          <p className="text-body text-deb">{error}</p>
          <Button size="sm" variant="secondary" onClick={reload}>
            Coba lagi
          </Button>
        </section>
      ) : null}

      {grouped.map((group) => (
        <section key={group.type} className="space-y-3">
          <div className="rule-dense flex flex-wrap items-baseline justify-between gap-3 pb-2">
            <h2 className="text-lead text-ink">{group.title}</h2>
            <span className="fig text-caption text-faint">{group.items.length}</span>
          </div>

          {loading && !data ? (
            <SkeletonRows rows={2} />
          ) : group.items.length === 0 ? (
            <EmptyState title={group.empty} />
          ) : (
            <ul className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {group.items.map(renderItem)}
            </ul>
          )}
        </section>
      ))}

      <DebtModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={reload}
        initial={editing ?? undefined}
      />

      <PaymentModal
        open={Boolean(payTarget)}
        onClose={() => setPayTarget(null)}
        onSaved={reload}
        debt={payTarget}
      />

      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Hapus Catatan"
        description={deleteTarget ? `Hapus data ${deleteTarget.person}?` : undefined}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)} disabled={deleting}>
              Batal
            </Button>
            <Button variant="destructive" onClick={confirmDelete} loading={deleting}>
              Hapus
            </Button>
          </>
        }
      >
        <p className="text-body text-muted">
          Tindakan ini tidak bisa dibatalkan. Riwayat transaksi tidak ikut terhapus.
        </p>
      </Modal>
    </div>
  );
}
