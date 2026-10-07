"use client";

import { useState } from "react";
import { AccountModal } from "@/components/accounts/AccountModal";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { StatusChip, type ChipTone } from "@/components/ui/Chip";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toaster";
import { apiDelete, apiPatch } from "@/lib/api";
import { cn } from "@/lib/cn";
import { useApi } from "@/lib/client/use-api";
import { formatIDR } from "@/lib/currency";
import type { Account } from "@/types";

const TYPE_LABELS: Record<Account["type"], string> = {
  Cash: "Tunai",
  Bank: "Bank",
  "E-Wallet": "E-Wallet",
  Other: "Lainnya",
};

const STATUS_TONE: Record<Account["status"], ChipTone> = {
  Active: "success",
  Inactive: "neutral",
};

type Pending = { id: string; action: "toggle" | "delete" };

export default function AccountsPage() {
  const toast = useToast();
  const { data, error, loading, reload } = useApi<{
    accounts: Account[];
    balances: Record<string, number>;
    transactionCounts: Record<string, number>;
  }>("/api/accounts");
  const [pending, setPending] = useState<Pending | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);

  function openModal(account: Account | null) {
    setEditing(account);
    setModalOpen(true);
  }

  async function toggleStatus(account: Account) {
    const status = account.status === "Active" ? "Inactive" : "Active";
    setPending({ id: account.id, action: "toggle" });
    try {
      await apiPatch(`/api/accounts/${account.id}`, { status });
      toast(status === "Active" ? "Akun diaktifkan." : "Akun dinonaktifkan.", "success");
      reload();
    } catch (cause) {
      toast(cause instanceof Error ? cause.message : "Gagal menyimpan. Silakan coba lagi.", "error");
    } finally {
      setPending(null);
    }
  }

  async function remove(account: Account) {
    setPending({ id: account.id, action: "delete" });
    try {
      await apiDelete(`/api/accounts/${account.id}`);
      toast("Akun dihapus.", "success");
      reload();
    } catch (cause) {
      toast(cause instanceof Error ? cause.message : "Gagal menyimpan. Silakan coba lagi.", "error");
    } finally {
      setPending(null);
    }
  }

  const accounts = data?.accounts ?? [];
  const balances = data?.balances ?? {};

  return (
    <div className="space-y-6">
      <PageHeader
        title="Akun"
        subtitle="Tempat uang disimpan, beserta saldo yang sedang berjalan."
        marker={data ? `${accounts.length} akun` : undefined}
        action={
          <Button variant="primary" onClick={() => openModal(null)}>
            Tambah akun
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
        <section className="sheet p-5">
          <Skeleton className="h-3 w-full" />
          <div className="mt-4 space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-9 w-full" />
            ))}
          </div>
        </section>
      ) : accounts.length === 0 ? (
        <EmptyState
          title="Belum ada akun."
          description="Tambahkan dompet, rekening, atau e-wallet tempat uangmu berada."
          action={
            <Button variant="primary" onClick={() => openModal(null)}>
              Tambah akun
            </Button>
          }
        />
      ) : (
        <section className="sheet overflow-hidden">
          <h2 className="stamp rule-hair px-5 py-3 text-micro text-muted">Daftar akun</h2>
          <ul className="px-5">
            {accounts.map((account) => {
              const balance = balances[account.name] ?? account.initialBalance;
              const empty = (data?.transactionCounts[account.name] ?? 0) === 0;
              const inactive = account.status === "Inactive";

              return (
                <li
                  key={account.id}
                  className={cn(
                    "rule-hair flex flex-wrap items-baseline justify-between gap-x-6 gap-y-3 py-4 last:border-b-0",
                    inactive && "opacity-60",
                  )}
                >
                  <div className="min-w-0">
                    <p className="truncate text-lead text-ink">{account.name}</p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-caption text-muted">
                      <span className="stamp text-micro text-faint">
                        {TYPE_LABELS[account.type]}
                      </span>
                      {account.accountNumber ? (
                        <span className="fig">No. {account.accountNumber}</span>
                      ) : null}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                    <p className={cn("fig text-figure", balance < 0 ? "text-deb" : "text-ink")}>
                      {formatIDR(balance)}
                    </p>
                    <StatusChip tone={STATUS_TONE[account.status]}>
                      {account.status === "Active" ? "Aktif" : "Nonaktif"}
                    </StatusChip>
                    <div className="flex items-center gap-1">
                      <Button variant="quiet" size="sm" onClick={() => openModal(account)}>
                        Edit
                      </Button>
                      <Button
                        variant="quiet"
                        size="sm"
                        loading={pending?.id === account.id && pending?.action === "toggle"}
                        onClick={() => toggleStatus(account)}
                      >
                        {account.status === "Active" ? "Nonaktifkan" : "Aktifkan"}
                      </Button>
                      {empty ? (
                        <Button
                          variant="quiet"
                          size="sm"
                          className="text-deb hover:text-deb"
                          loading={pending?.id === account.id && pending?.action === "delete"}
                          onClick={() => remove(account)}
                        >
                          Hapus
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <AccountModal
        open={modalOpen}
        account={editing}
        onClose={() => setModalOpen(false)}
        onSaved={() => {
          setModalOpen(false);
          reload();
        }}
      />
    </div>
  );
}
