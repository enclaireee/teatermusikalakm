"use client";

import { useCallback, useEffect, useState } from "react";
import type { Availability, TierAvailability } from "./availability";
import type { ShowId } from "./event";

export type { Availability, TierAvailability };

/** Live tier stock + taken seats for a show. `refresh()` refetches (e.g. after a lost seat). */
export function useAvailability(show: ShowId) {
  const [data, setData] = useState<Availability | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [n, setN] = useState(0);

  useEffect(() => {
    const ctl = new AbortController();
    fetch(`/api/show/${show}`, { cache: "no-store", signal: ctl.signal })
      .then((r) => (r.ok ? (r.json() as Promise<Availability>) : Promise.reject(new Error(String(r.status)))))
      .then((d) => {
        setData(d);
        setError(false);
      })
      .catch(() => {
        if (!ctl.signal.aborted) setError(true);
      })
      .finally(() => {
        if (!ctl.signal.aborted) setLoading(false);
      });
    return () => ctl.abort();
  }, [show, n]);

  useEffect(() => {
    const id = setInterval(() => {
      if (!document.hidden) setN((x) => x + 1);
    }, 30_000);
    return () => clearInterval(id);
  }, []);

  const refresh = useCallback(() => {
    setLoading(true);
    setN((x) => x + 1);
  }, []);
  return { data, error, loading, refresh };
}
