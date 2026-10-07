"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { TransactionModal } from "./TransactionModal";

/** Drawn plus, one stroke weight with the rest of the furniture. */
function PlusIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 14 14" className={className} fill="none">
      <path d="M7 1.5v11M1.5 7h11" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

export function QuickAddButton({ onSaved }: { onSaved?: () => void }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="primary"
        onClick={() => setOpen(true)}
        className="hidden md:inline-flex"
      >
        Tambah transaksi
      </Button>
      <button
        type="button"
        aria-label="Tambah transaksi"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-sm border border-ink bg-ink text-paper transition-colors duration-150 hover:bg-muted active:bg-faint md:hidden"
      >
        <PlusIcon className="h-4 w-4" />
      </button>
      <TransactionModal
        open={open}
        onClose={() => setOpen(false)}
        onSaved={onSaved}
      />
    </>
  );
}
