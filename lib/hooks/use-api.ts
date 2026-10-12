"use client";

import { useEffect, useState } from "react";
import { ApiClientError } from "@/lib/api";

type UseApiResult<T> = {
  data: T | null;
  meta: Record<string, unknown>;
  loading: boolean;
  error: string | null;
  reload: () => void;
};

export function useApi<T>(
  loader: () => Promise<{ data: T; meta: Record<string, unknown> }>,
  deps: unknown[] = [],
): UseApiResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [meta, setMeta] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    void loader()
      .then((res) => {
        if (cancelled) return;
        setData(res.data);
        setMeta(res.meta ?? {});
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message =
          err instanceof ApiClientError
            ? err.message
            : "Something went wrong";
        setError(message);
        setData(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, ...deps]);

  return {
    data,
    meta,
    loading,
    error,
    reload: () => setTick((t) => t + 1),
  };
}

export function unwrapList(data: unknown): Record<string, unknown>[] {
  if (Array.isArray(data)) return data as Record<string, unknown>[];
  if (data && typeof data === "object" && Array.isArray((data as { data?: unknown }).data)) {
    return (data as { data: Record<string, unknown>[] }).data;
  }
  return [];
}

export type PaginationState = {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

function toPositiveInt(value: unknown, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

/** Supports meta.pagination and Laravel paginator-shaped data payloads. */
export function parsePagination(
  meta: unknown,
  data: unknown,
  fallbackPerPage = 20,
): PaginationState | null {
  const metaObj =
    meta && typeof meta === "object"
      ? (meta as Record<string, unknown>)
      : null;
  const fromMeta =
    metaObj?.pagination && typeof metaObj.pagination === "object"
      ? (metaObj.pagination as Record<string, unknown>)
      : null;

  const fromData =
    data &&
    typeof data === "object" &&
    !Array.isArray(data) &&
    ("current_page" in data || "last_page" in data)
      ? (data as Record<string, unknown>)
      : null;

  const source = fromMeta ?? fromData;
  if (!source) return null;

  const current_page = toPositiveInt(source.current_page, 1);
  const last_page = Math.max(1, toPositiveInt(source.last_page, 1));
  const per_page = toPositiveInt(source.per_page, fallbackPerPage);
  const total = Math.max(0, toPositiveInt(source.total, 0));

  return { current_page, last_page, per_page, total };
}
