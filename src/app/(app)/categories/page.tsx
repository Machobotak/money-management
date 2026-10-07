"use client";

import { useState } from "react";
import { CategoryModal } from "@/components/categories/CategoryModal";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { StatusChip } from "@/components/ui/Chip";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { SkeletonRows } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toaster";
import { apiDelete, apiPatch } from "@/lib/api";
import { cn } from "@/lib/cn";
import { useApi } from "@/lib/client/use-api";
import type { Category, CategoryType } from "@/types";

const GROUPS: { type: CategoryType; title: string; empty: string }[] = [
  { type: "Income", title: "Pemasukan", empty: "Belum ada kategori pemasukan." },
  { type: "Expense", title: "Pengeluaran", empty: "Belum ada kategori pengeluaran." },
];

export default function CategoriesPage() {
  const toast = useToast();
  const { data, error, loading, reload } = useApi<{ categories: Category[] }>("/api/categories");
  const [pending, setPending] = useState<{ id: string; action: "toggle" | "delete" } | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [defaultType, setDefaultType] = useState<CategoryType>("Expense");
  const [confirming, setConfirming] = useState<Category | null>(null);

  function openModal(category: Category | null, type: CategoryType) {
    setEditing(category);
    setDefaultType(type);
    setModalOpen(true);
  }

  async function toggleStatus(category: Category) {
    const status = category.status === "Active" ? "Inactive" : "Active";
    setPending({ id: category.id, action: "toggle" });
    try {
      await apiPatch(`/api/categories/${category.id}`, { status });
      toast(status === "Active" ? "Kategori diaktifkan." : "Kategori dinonaktifkan.", "success");
      reload();
    } catch (cause) {
      toast(cause instanceof Error ? cause.message : "Gagal menyimpan. Silakan coba lagi.", "error");
    } finally {
      setPending(null);
    }
  }

  async function remove(category: Category) {
    setPending({ id: category.id, action: "delete" });
    try {
      await apiDelete(`/api/categories/${category.id}`);
      toast("Kategori dihapus.", "success");
      setConfirming(null);
      reload();
    } catch (cause) {
      toast(cause instanceof Error ? cause.message : "Gagal menyimpan. Silakan coba lagi.", "error");
    } finally {
      setPending(null);
    }
  }

  const categories = data?.categories ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kategori"
        subtitle="Kelompok pemasukan dan pengeluaran yang dipakai saat mencatat."
        marker={data ? `${categories.length} kategori` : undefined}
        action={
          <Button variant="primary" onClick={() => openModal(null, "Expense")}>
            Tambah kategori
          </Button>
        }
      />

      {error ? (
        <section className="sheet flex flex-wrap items-center justify-between gap-3 border-t-2 border-t-deb p-5">
          <p className="text-body text-deb">{error}</p>
          <Button variant="secondary" size="sm" onClick={reload}>
            Coba lagi
          </Button>
        </section>
      ) : loading && !data ? (
        <SkeletonRows rows={6} />
      ) : categories.length === 0 ? (
        <EmptyState
          title="Belum ada kategori."
          description="Kategori membuat pengeluaran bisa dibaca per kelompok."
          action={
            <Button variant="primary" onClick={() => openModal(null, "Expense")}>
              Tambah kategori
            </Button>
          }
        />
      ) : (
        <div className="space-y-6">
          {GROUPS.map((group) => {
            const items = categories.filter((category) => category.type === group.type);
            return (
              <section key={group.type} className="sheet overflow-hidden">
                <div className="rule-hair flex items-center justify-between gap-3 px-5 py-3">
                  <h2 className="stamp text-micro text-muted">
                    {group.title}
                    <span className="fig ml-2 normal-case tracking-normal text-faint">
                      {items.length}
                    </span>
                  </h2>
                  <Button variant="quiet" size="sm" onClick={() => openModal(null, group.type)}>
                    Tambah
                  </Button>
                </div>

                {items.length === 0 ? (
                  <p className="px-5 py-6 text-body text-muted">{group.empty}</p>
                ) : (
                  <ul className="px-5">
                    {items.map((category) => (
                      <li
                        key={category.id}
                        className={cn(
                          "rule-hair flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-3 last:border-b-0",
                          category.status === "Inactive" && "opacity-60",
                        )}
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="truncate text-body text-ink">{category.name}</span>
                          <StatusChip tone={category.status === "Active" ? "success" : "neutral"}>
                            {category.status === "Active" ? "Aktif" : "Nonaktif"}
                          </StatusChip>
                        </div>
                        <div className="flex flex-wrap items-center gap-1">
                          <Button
                            variant="quiet"
                            size="sm"
                            onClick={() => openModal(category, category.type)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="quiet"
                            size="sm"
                            loading={pending?.id === category.id && pending.action === "toggle"}
                            onClick={() => toggleStatus(category)}
                          >
                            {category.status === "Active" ? "Nonaktifkan" : "Aktifkan"}
                          </Button>
                          <Button
                            variant="quiet"
                            size="sm"
                            className="text-deb hover:text-deb"
                            onClick={() => setConfirming(category)}
                          >
                            Hapus
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      )}

      <CategoryModal
        open={modalOpen}
        category={editing}
        defaultType={defaultType}
        onClose={() => setModalOpen(false)}
        onSaved={() => {
          setModalOpen(false);
          reload();
        }}
      />

      <Modal
        open={Boolean(confirming)}
        onClose={() => setConfirming(null)}
        title="Hapus Kategori"
        description={confirming ? `Kategori "${confirming.name}" akan dihapus permanen.` : undefined}
        size="sm"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setConfirming(null)}
              disabled={pending?.action === "delete"}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              loading={pending?.action === "delete"}
              onClick={() => confirming && remove(confirming)}
            >
              Hapus
            </Button>
          </>
        }
      >
        <p className="text-body text-muted">
          Kategori yang masih dipakai transaksi, anggaran, atau transaksi berulang tidak bisa dihapus.
          Nonaktifkan saja bila sudah tidak dipakai.
        </p>
      </Modal>
    </div>
  );
}
