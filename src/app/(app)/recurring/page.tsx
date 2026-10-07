"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { RecurringModal, RecurringSwitch } from "@/components/recurring/RecurringModal";
import { Button } from "@/components/ui/Button";
import { StatusChip } from "@/components/ui/Chip";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { SkeletonRows } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toaster";
import { apiDelete, apiPatch, apiPost } from "@/lib/api";
import { useApi } from "@/lib/client/use-api";
import { nextOccurrence } from "@/lib/calculations/finance";
import { formatIDR } from "@/lib/currency";
import { formatDate, todayISO } from "@/lib/format-date";
import type { Recurring } from "@/types/recurring";
import type { Transaction } from "@/types/transaction";

interface RecurringResponse {
  recurring: Recurring[];
}

interface GenerateResponse {
  generated: Transaction[];
  skipped: string[];
}

const FREQUENCY_LABEL: Record<Recurring["frequency"], string> = {
  Daily: "Harian",
  Weekly: "Mingguan",
  Monthly: "Bulanan",
  Yearly: "Tahunan",
};

export default function RecurringPage() {
  const toast = useToast();
  const { data, error, loading, reload } = useApi<RecurringResponse>("/api/recurring");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Recurring | null>(null);
  const [busyId, setBusyId] = useState("");
  const [generating, setGenerating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Recurring | null>(null);
  const [deleting, setDeleting] = useState(false);

  const today = todayISO();
  const items = data?.recurring ?? [];

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(item: Recurring) {
    setEditing(item);
    setModalOpen(true);
  }

  async function toggleActive(item: Recurring) {
    try {
      await apiPatch<{ recurring: Recurring }>("/api/recurring/" + item.id, { active: !item.active });
      toast("Status transaksi berulang diperbarui.", "success");
      reload();
    } catch (cause) {
      toast(cause instanceof Error ? cause.message : "Gagal menyimpan. Silakan coba lagi.", "error");
    }
  }

  async function generateNow(item: Recurring) {
    setBusyId(item.id);
    try {
      await apiPost<{ transaction: Transaction }>("/api/recurring/" + item.id + "/generate", {});
      toast("Transaksi dibuat.", "success");
      reload();
    } catch (cause) {
      toast(cause instanceof Error ? cause.message : "Gagal menyimpan. Silakan coba lagi.", "error");
    } finally {
      setBusyId("");
    }
  }

  async function generateDue() {
    setGenerating(true);
    try {
      const result = await apiPost<GenerateResponse>("/api/recurring/generate-due", {});
      if (result.generated.length > 0) {
        toast(result.generated.length + " transaksi dibuat.", "success");
      } else {
        toast("Tidak ada yang jatuh tempo.", "info");
      }
      reload();
    } catch (cause) {
      toast(cause instanceof Error ? cause.message : "Gagal memuat data. Silakan coba lagi.", "error");
    } finally {
      setGenerating(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiDelete<{ ok: true }>("/api/recurring/" + deleteTarget.id);
      toast("Transaksi berulang dihapus.", "success");
      setDeleteTarget(null);
      reload();
    } catch (cause) {
      toast(cause instanceof Error ? cause.message : "Gagal menyimpan. Silakan coba lagi.", "error");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Berulang"
        subtitle="Tagihan dan pemasukan yang datang menurut jadwal tetap."
        marker={data ? `${items.length} jadwal` : undefined}
        action={
          <>
            <Button variant="secondary" size="sm" onClick={generateDue} loading={generating}>
              Buat yang jatuh tempo
            </Button>
            <Button variant="primary" size="sm" onClick={openCreate}>
              Tambah jadwal
            </Button>
          </>
        }
      />

      {loading ? <SkeletonRows rows={4} /> : null}

      {!loading && error ? (
        <section className="sheet flex flex-wrap items-center justify-between gap-3 border-t-2 border-t-deb p-5">
          <p className="text-body text-deb">{error}</p>
          <Button variant="secondary" size="sm" onClick={reload}>
            Coba lagi
          </Button>
        </section>
      ) : null}

      {!loading && !error && items.length === 0 ? (
        <EmptyState
          title="Belum ada transaksi berulang."
          description="Jadwalkan sewa, langganan, atau gaji supaya tercatat sendiri."
          action={
            <Button variant="primary" size="sm" onClick={openCreate}>
              Tambah jadwal
            </Button>
          }
        />
      ) : null}

      {!loading && !error && items.length > 0 ? (
        <ul className="grid gap-4">
          {items.map((item) => {
            const next = nextOccurrence(item, today);
            return (
              <li key={item.id} className="sheet p-5">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
                  <div className="min-w-0">
                    <h2 className="truncate text-lead text-ink">{item.name}</h2>
                    <p className="fig mt-0.5 text-body text-muted">{formatIDR(item.amount)}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusChip tone="info">{FREQUENCY_LABEL[item.frequency]}</StatusChip>
                    <StatusChip tone={item.type === "Income" ? "success" : "neutral"}>
                      {item.type}
                    </StatusChip>
                  </div>
                </div>

                <dl className="rule-hair mt-3 flex flex-wrap gap-x-6 gap-y-1 pb-3 text-caption text-muted">
                  <div className="flex gap-1.5">
                    <dt>Akun</dt>
                    <dd className="text-ink">{item.account}</dd>
                  </div>
                  <div className="flex gap-1.5">
                    <dt>Kategori</dt>
                    <dd className="text-ink">{item.category}</dd>
                  </div>
                  <div className="flex gap-1.5">
                    <dt>Berikutnya</dt>
                    <dd className="fig text-ink">{next ? formatDate(next) : "Selesai"}</dd>
                  </div>
                </dl>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <RecurringSwitch
                      checked={item.active}
                      onChange={() => toggleActive(item)}
                      label={"Aktifkan " + item.name}
                    />
                    <span className="text-caption text-muted">
                      {item.active ? "Aktif" : "Nonaktif"}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => generateNow(item)}
                      loading={busyId === item.id}
                    >
                      Buat sekarang
                    </Button>
                    <Button variant="quiet" size="sm" onClick={() => openEdit(item)}>
                      Edit
                    </Button>
                    <Button
                      variant="quiet"
                      size="sm"
                      className="text-deb hover:text-deb"
                      onClick={() => setDeleteTarget(item)}
                    >
                      Hapus
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}

      <RecurringModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={() => {
          setModalOpen(false);
          reload();
        }}
        initial={editing}
      />

      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Hapus Jadwal"
        description={deleteTarget ? `Hapus "${deleteTarget.name}"?` : undefined}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)} disabled={deleting}>
              Batal
            </Button>
            <Button variant="destructive" loading={deleting} onClick={() => void confirmDelete()}>
              Hapus
            </Button>
          </>
        }
      >
        <p className="text-body text-muted">
          Transaksi yang sudah dibuat dari jadwal ini tidak ikut terhapus.
        </p>
      </Modal>
    </div>
  );
}
