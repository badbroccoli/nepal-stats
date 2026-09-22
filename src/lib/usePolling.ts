"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface PollingState<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
  lastUpdated: number | null;
  refresh: () => void;
}

export function usePolling<T>(url: string, intervalMs: number): PollingState<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const mounted = useRef(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      const json = (await res.json()) as T;
      if (!mounted.current) return;
      setData(json);
      setError(null);
      setLastUpdated(Date.now());
    } catch (err) {
      if (!mounted.current) return;
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    mounted.current = true;
    load();
    const id = setInterval(load, intervalMs);
    return () => {
      mounted.current = false;
      clearInterval(id);
    };
  }, [load, intervalMs]);

  return { data, error, loading, lastUpdated, refresh: load };
}
