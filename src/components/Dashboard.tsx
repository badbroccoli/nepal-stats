"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { formatRelative } from "@/lib/format";
import { usePolling } from "@/lib/usePolling";
import type { DisasterEvent } from "@/lib/types";

const NepalMap = dynamic(() => import("./NepalMap").then((m) => m.NepalMap), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-base-950 text-xs text-neutral-500">
      Loading map…
    </div>
  ),
});

interface DisasterResponse {
  count: number;
  sinceHours: number;
  stale: boolean;
  events: DisasterEvent[];
}

export function Dashboard() {
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const { data } = usePolling<DisasterResponse>("/api/v1/disasters?sinceHours=720", 45_000);
  const quakes = useMemo(() => data?.events ?? [], [data]);
  const recent = useMemo(
    () => [...quakes].sort((a, b) => Date.parse(b.observedAt) - Date.parse(a.observedAt)).slice(0, 6),
    [quakes],
  );

  return (
    <div className="relative h-full w-full">
      <NepalMap
        earthquakes={quakes}
        selectedDistrict={selectedDistrict}
        onSelectDistrict={setSelectedDistrict}
      />

      <div className="pointer-events-none absolute left-3 top-3 rounded-md border border-line bg-base-900/80 px-3 py-2 text-[11px] text-neutral-400 backdrop-blur">
        <span className="text-accent">{quakes.length}</span> earthquakes · last 30 days
        {data?.stale && <span className="ml-2 text-danger">(cached)</span>}
      </div>

      {selectedDistrict && (
        <div className="absolute right-3 top-3 z-10 w-72 rounded-lg border border-line bg-base-850/95 p-4 shadow-xl backdrop-blur">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-neutral-500">District</p>
              <h3 className="text-lg font-semibold text-neutral-50">{selectedDistrict}</h3>
            </div>
            <button
              type="button"
              onClick={() => setSelectedDistrict(null)}
              className="rounded p-1 text-neutral-500 hover:bg-base-700 hover:text-neutral-200"
              aria-label="Close district panel"
            >
              ✕
            </button>
          </div>
          <p className="mt-3 text-[11px] uppercase tracking-widest text-neutral-500">
            Recent national hazards
          </p>
          <ul className="mt-1.5 flex flex-col gap-1.5">
            {recent.map((q) => (
              <li
                key={q.id}
                className="flex items-center justify-between rounded border border-line bg-base-800 px-2 py-1.5 text-xs"
              >
                <span className="flex items-center gap-2">
                  <span className="font-mono font-semibold text-danger">M{q.magnitude.toFixed(1)}</span>
                  <span className="max-w-[9rem] truncate text-neutral-400">{q.place}</span>
                </span>
                <span className="text-[10px] text-neutral-600">{formatRelative(q.observedAt)}</span>
              </li>
            ))}
            {recent.length === 0 && (
              <li className="text-xs text-neutral-500">No recent earthquakes in range.</li>
            )}
          </ul>
          <p className="mt-3 text-[10px] leading-relaxed text-neutral-600">
            District-level KPIs (NPHC 2021 population, BIPAD incidents) are planned for Phase 1–2.
            Hazards shown are national USGS events pending admin-code joins.
          </p>
        </div>
      )}
    </div>
  );
}
