"use client";

import { useCallback, useEffect, useState } from "react";
import { mockRequest } from "@/lib/mock/routes";
import { subscribeDataset } from "@/lib/mock/store";

interface ApiState<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
  reload: () => void;
}

/**
 * Minimal GET hook: refetches whenever `url` changes, keeps the previous payload
 * visible while reloading, and reloads on demand. Any write through the mock
 * router also bumps the subscription below, so sibling pages stay in step.
 */
export function useApi<T>(url: string | null): ApiState<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(Boolean(url));
  const [nonce, setNonce] = useState(0);

  const reload = useCallback(() => setNonce((value) => value + 1), []);

  useEffect(() => {
    if (!url) {
      setData(null);
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);

    mockRequest<T>(url)
      .then((payload) => {
        if (!active) return;
        setData(payload);
        setError(null);
      })
      .catch((cause: unknown) => {
        if (!active || (cause instanceof Error && cause.name === "AbortError")) return;
        setError(cause instanceof Error ? cause.message : "Gagal memuat data. Silakan coba lagi.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [url, nonce]);

  useEffect(() => {
    if (!url) return;
    return subscribeDataset(() => {
      setNonce((value) => value + 1);
    });
  }, [url]);

  return { data, error, loading, reload };
}
