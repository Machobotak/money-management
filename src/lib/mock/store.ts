"use client";

import { DATASET_VERSION, buildSeedDataset } from "./seed";
import type { DemoDataset, DemoSession } from "./types";

const DATASET_KEY = "pfm.demo.dataset";
const SESSION_KEY = "pfm.demo.session";

/**
 * The seed the demo prints from. Changing it reprints the whole ledger.
 * No personal data lives here: every name and amount is invented.
 */
const SEED = "buku-besar-portfolio-v1";

const listeners = new Set<() => void>();

let dataset: DemoDataset | null = null;
let session: DemoSession | null = null;

/** Flips when the browser blocks localStorage; the demo then runs from memory. */
let storageBlocked = false;

function storage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    const probe = "__pfm_probe__";
    window.localStorage.setItem(probe, "1");
    window.localStorage.removeItem(probe);
    return window.localStorage;
  } catch {
    // Private mode or blocked storage: the demo still runs, just not across reloads.
    storageBlocked = true;
    return null;
  }
}

function readStoredDataset(): DemoDataset | null {
  const store = storage();
  if (!store) return null;
  try {
    const raw = store.getItem(DATASET_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DemoDataset;
    if (!parsed || parsed.version !== DATASET_VERSION) return null;
    if (!Array.isArray(parsed.accounts) || !Array.isArray(parsed.transactions)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function persist(next: DemoDataset): void {
  const store = storage();
  if (!store) return;
  try {
    store.setItem(DATASET_KEY, JSON.stringify(next));
  } catch {
    // Quota or blocked write: keep working from memory.
    storageBlocked = true;
  }
}

function notify(): void {
  for (const listener of listeners) listener();
}

/** Reads the ledger, seeding it on first use in this browser. */
export function readDataset(): DemoDataset {
  if (dataset) return dataset;
  const stored = readStoredDataset();
  dataset = stored ?? buildSeedDataset(SEED);
  if (!stored) persist(dataset);
  return dataset;
}

/** Replaces the ledger wholesale, then tells every subscribed page to refetch. */
export function commitDataset(next: DemoDataset): DemoDataset {
  dataset = next;
  persist(next);
  notify();
  return dataset;
}

export function updateDataset(apply: (current: DemoDataset) => DemoDataset): DemoDataset {
  return commitDataset(apply(readDataset()));
}

/** Prints a brand-new ledger from the seed. Everything the demo added is dropped. */
export function resetDataset(): DemoDataset {
  return commitDataset(buildSeedDataset(SEED));
}

export function subscribeDataset(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export interface StorageInfo {
  /** False when the browser blocks localStorage, so nothing survives a reload. */
  persistent: boolean;
  datasetVersion: number;
  accounts: number;
  transactions: number;
  budgets: number;
  debts: number;
  recurring: number;
}

export function storageInfo(): StorageInfo {
  const current = readDataset();
  return {
    persistent: !storageBlocked && storage() !== null,
    datasetVersion: current.version,
    accounts: current.accounts.length,
    transactions: current.transactions.length,
    budgets: current.budgets.length,
    debts: current.debts.length,
    recurring: current.recurring.length,
  };
}

// ---------------------------------------------------------------------------
// Session: a demo sign-in, never a credential check.
// ---------------------------------------------------------------------------

export function readSession(): DemoSession | null {
  if (session) return session;
  const store = storage();
  if (!store) return null;
  try {
    const raw = store.getItem(SESSION_KEY);
    if (!raw) return null;
    session = JSON.parse(raw) as DemoSession;
    return session;
  } catch {
    return null;
  }
}

/** True once this browser has opened the demo book. */
export function hasSession(): boolean {
  return readSession() !== null;
}

export function writeSession(next: DemoSession): void {
  session = next;
  const store = storage();
  if (store) {
    try {
      store.setItem(SESSION_KEY, JSON.stringify(next));
    } catch {
      storageBlocked = true;
    }
  }
  notify();
}

export function clearSession(): void {
  session = null;
  const store = storage();
  if (store) {
    try {
      store.removeItem(SESSION_KEY);
    } catch {
      storageBlocked = true;
    }
  }
  notify();
}

/** Fresh id for anything the user creates. */
export function nextId(prefix: string): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return prefix + "-" + crypto.randomUUID().slice(0, 8);
  }
  return prefix + "-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
