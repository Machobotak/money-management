"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { StatusChip } from "@/components/ui/Chip";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toaster";
import { apiDelete } from "@/lib/api";
import { cn } from "@/lib/cn";
import { formatIDR } from "@/lib/currency";
import { formatDate, todayISO } from "@/lib/format-date";
import type { Transaction } from "@/types/transaction";
import { TransactionModal } from "./TransactionModal";

const TONES = {
  Income: "success",
  Expense: "error",
  Transfer: "info",
} as const;

const AMOUNT_TONE = {
  Income: "text-cre",
  Expense: "text-deb",
  Transfer: "text-ult",
} as const;

/**
 * The ruled leave of the ledger: one line per entry, debits right-aligned
 * beside their credits, the running rule only broken between months.
 */
export function TransactionTable({
  transactions,
  onChanged,
}: {
  transactions: Transaction[];
  onChanged: () => void;
}) {
  const toast = useToast();
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState<Transaction | null>(null);
  const [removing, setRemoving] = useState(false);
  const today = todayISO();

  async function confirmDelete() {
    if (!deleting || removing) return;
    setRemoving(true);
    try {
      await apiDelete(`/api/transactions/${deleting.id}`);
      toast("Transaksi dihapus.");
      setDeleting(null);
      onChanged();
    } catch (error) {
      toast(
        error instanceof Error ? error.message : "Gagal menghapus. Silakan coba lagi.",
        "error",
      );
    } finally {
      setRemoving(false);
    }
  }

  return (
    <>
      <div className="sheet overflow-x-auto">
        <table className="w-full min-w-[820px] border-collapse text-body">
          <thead>
            <tr className="rule-dense text-left">
              <th className="stamp px-4 py-2.5 text-micro text-faint">Tanggal</th>
              <th className="stamp px-4 py-2.5 text-micro text-faint">Jenis</th>
              <th className="stamp px-4 py-2.5 text-micro text-faint">Kategori</th>
              <th className="stamp px-4 py-2.5 text-micro text-faint">Akun</th>
              <th className="stamp px-4 py-2.5 text-right text-micro text-faint">Nominal</th>
              <th className="stamp px-4 py-2.5 text-micro text-faint">Keterangan</th>
              <th className="stamp px-4 py-2.5 text-right text-micro text-faint">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr
                key={tx.id}
                className="rule-hair transition-colors last:border-b-0 hover:bg-raised/60"
              >
                <td
                  className={cn(
                    "fig whitespace-nowrap px-4 py-2.5 text-caption text-muted",
                    tx.date === today && "ribbon",
                  )}
                >
                  {formatDate(tx.date)}
                </td>
                <td className="px-4 py-2.5">
                  <StatusChip tone={TONES[tx.type]}>{tx.type}</StatusChip>
                </td>
                <td className="px-4 py-2.5 text-ink">{tx.category || "—"}</td>
                <td className="whitespace-nowrap px-4 py-2.5 text-muted">
                  {tx.type === "Transfer"
                    ? `${tx.fromAccount} → ${tx.toAccount}`
                    : tx.account}
                </td>
                <td
                  className={cn(
                    "fig whitespace-nowrap px-4 py-2.5 text-right",
                    AMOUNT_TONE[tx.type],
                  )}
                >
                  {tx.type === "Expense" ? "−" : tx.type === "Income" ? "+" : ""}
                  {formatIDR(Math.abs(tx.amount))}
                </td>
                <td
                  className="max-w-[240px] truncate px-4 py-2.5 text-muted"
                  title={tx.description}
                >
                  {tx.description || "—"}
                </td>
                <td className="whitespace-nowrap px-4 py-2.5 text-right">
                  <Button variant="quiet" size="sm" onClick={() => setEditing(tx)}>
                    Edit
                  </Button>
                  <Button
                    variant="quiet"
                    size="sm"
                    className="text-deb hover:text-deb"
                    onClick={() => setDeleting(tx)}
                  >
                    Hapus
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <TransactionModal
        open={Boolean(editing)}
        initial={editing}
        onClose={() => setEditing(null)}
        onSaved={onChanged}
      />

      <Modal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title="Hapus Transaksi"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleting(null)} disabled={removing}>
              Batal
            </Button>
            <Button variant="destructive" onClick={confirmDelete} loading={removing}>
              {removing ? "Menghapus..." : "Hapus"}
            </Button>
          </>
        }
      >
        <p className="text-body text-muted">
          Catatan ini akan dihapus permanen dari buku. Lanjutkan?
        </p>
      </Modal>
    </>
  );
}
