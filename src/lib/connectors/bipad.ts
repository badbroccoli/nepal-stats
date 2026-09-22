import type {
  DisasterIncident,
  FloodAlert,
  HazardType,
  RiverWatchSummary,
} from "../types";
import { cachedFetch } from "./cache";

const BIPAD = "https://bipadportal.gov.np/api/v1";
const UA = "NepalStatsDashboard/1.0 (+https://github.com/badbroccoli/nepal-stats)";

type BipadHazard = {
  id: number;
  title?: string;
  titleEn?: string;
  titleNe?: string;
  color?: string;
  type?: string;
};

type BipadIncident = {
  id: number;
  title?: string;
  titleNe?: string;
  hazard?: number;
  incidentOn?: string;
  reportedOn?: string;
  point?: { type: string; coordinates?: [number, number] } | null;
  verified?: boolean;
  approved?: boolean;
};

type BipadAlert = {
  id: number;
  title?: string;
  description?: string;
  hazard?: number;
  startedOn?: string;
  expireOn?: string;
  point?: { type: string; coordinates?: [number, number] } | null;
  public?: boolean;
};

type BipadRiverStation = {
  id: number;
  title?: string;
  status?: string;
  waterLevel?: number;
  warningLevel?: number;
  dangerLevel?: number;
  point?: { type: string; coordinates?: [number, number] } | null;
};

async function bipadJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BIPAD}${path}`, {
    headers: { "User-Agent": UA, Accept: "application/json" },
    next: { revalidate: 120 },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`BIPAD HTTP ${res.status} ${path}`);
  return (await res.json()) as T;
}

function parseTime(value?: string): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function fetchNaturalHazards(): Promise<HazardType[]> {
  return cachedFetch("bipad-hazards-natural", 60 * 60 * 1000, async () => {
    const json = await bipadJson<{ results?: BipadHazard[] }>(
      "/hazard/?limit=200",
    );
    return (json.results ?? [])
      .filter((h) => (h.type ?? "").toLowerCase() === "natural")
      .map((h) => ({
        id: h.id,
        title: h.titleEn || h.title || `Hazard ${h.id}`,
        titleNe: h.titleNe,
        color: h.color || "#FF6B6B",
        kind: "natural" as const,
      }))
      .sort((a, b) => a.title.localeCompare(b.title));
  }).catch(() => []);
}

async function fetchIncidentsForHazard(
  hazard: HazardType,
  days: number,
  perHazard: number,
): Promise<DisasterIncident[]> {
  const json = await bipadJson<{ results?: BipadIncident[] }>(
    `/incident/?limit=${perHazard}&ordering=-id&hazard=${hazard.id}`,
  );
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  const out: DisasterIncident[] = [];

  for (const r of json.results ?? []) {
    const when = parseTime(r.incidentOn) ?? parseTime(r.reportedOn);
    if (!when || when.getTime() < cutoff) continue;
    const coords = r.point?.coordinates;
    if (!coords || coords.length < 2) continue;
    out.push({
      id: `bipad-${r.id}`,
      source: "bipad",
      hazardId: hazard.id,
      hazard: hazard.title,
      hazardColor: hazard.color,
      title: r.title || r.titleNe || hazard.title,
      time: when.toISOString(),
      lon: coords[0],
      lat: coords[1],
      url: `https://bipadportal.gov.np/incidents/${r.id}`,
    });
  }
  return out;
}

/** Recent BIPAD natural-hazard incidents (floods, landslides, fire, etc.). */
export async function fetchNaturalDisasterIncidents(
  days = 30,
): Promise<DisasterIncident[]> {
  return cachedFetch(`bipad-natural-incidents-${days}d`, 2 * 60 * 1000, async () => {
    const hazards = await fetchNaturalHazards();
    if (!hazards.length) return [];

    // Cap per-hazard pages so monsoon seasons stay responsive.
    const perHazard = 40;
    const batches = await Promise.all(
      hazards.map((h) =>
        fetchIncidentsForHazard(h, days, perHazard).catch(() => [] as DisasterIncident[]),
      ),
    );

    return batches
      .flat()
      .sort((a, b) => +new Date(b.time) - +new Date(a.time));
  }).catch(() => []);
}

export async function fetchActiveFloodAlerts(): Promise<FloodAlert[]> {
  return cachedFetch("bipad-alerts", 60 * 1000, async () => {
    const hazards = await fetchNaturalHazards();
    const byId = new Map(hazards.map((h) => [h.id, h]));
    const json = await bipadJson<{ results?: BipadAlert[] }>(
      "/alert/?limit=80&ordering=-id",
    );
    const now = Date.now();
    const out: FloodAlert[] = [];

    for (const a of json.results ?? []) {
      if (a.public === false) continue;
      const exp = parseTime(a.expireOn);
      if (exp && exp.getTime() < now) continue;
      const coords = a.point?.coordinates;
      if (!coords || coords.length < 2) continue;
      const hazard = byId.get(a.hazard ?? -1);
      out.push({
        id: `alert-${a.id}`,
        title: a.title || "Hazard alert",
        hazard: hazard?.title ?? "Alert",
        hazardColor: hazard?.color ?? "#FF6B6B",
        startedOn: (parseTime(a.startedOn) ?? new Date()).toISOString(),
        expireOn: exp?.toISOString(),
        lat: coords[1],
        lon: coords[0],
        description: a.description,
      });
    }
    return out;
  }).catch(() => []);
}

export async function fetchRiverWatchSummary(): Promise<RiverWatchSummary> {
  return cachedFetch("bipad-river-watch", 2 * 60 * 1000, async () => {
    const stations: BipadRiverStation[] = [];
    for (let offset = 0; offset < 400; offset += 100) {
      const json = await bipadJson<{ results?: BipadRiverStation[] }>(
        `/river-stations/?limit=100&offset=${offset}`,
      );
      const batch = json.results ?? [];
      if (!batch.length) break;
      stations.push(...batch);
      if (batch.length < 100) break;
    }

    let elevated = 0;
    let danger = 0;
    for (const s of stations) {
      const status = (s.status ?? "").toUpperCase();
      if (status.includes("DANGER")) {
        danger += 1;
        elevated += 1;
      } else if (status.includes("WARNING")) {
        elevated += 1;
      }
    }

    return {
      monitored: stations.length,
      elevated,
      danger,
    };
  }).catch(() => ({ monitored: 0, elevated: 0, danger: 0 }));
}

export function summarizeIncidentsByHazard(
  incidents: DisasterIncident[],
): { hazard: string; color: string; count: number }[] {
  const map = new Map<string, { hazard: string; color: string; count: number }>();
  for (const i of incidents) {
    const cur = map.get(i.hazard) ?? {
      hazard: i.hazard,
      color: i.hazardColor,
      count: 0,
    };
    cur.count += 1;
    map.set(i.hazard, cur);
  }
  return [...map.values()].sort((a, b) => b.count - a.count);
}

export async function fetchDisasterSnapshot(days = 30) {
  const [incidents, alerts, rivers, hazards] = await Promise.all([
    fetchNaturalDisasterIncidents(days),
    fetchActiveFloodAlerts(),
    fetchRiverWatchSummary(),
    fetchNaturalHazards(),
  ]);
  return {
    incidents,
    alerts,
    rivers,
    hazards,
    byHazard: summarizeIncidentsByHazard(incidents),
  };
}
