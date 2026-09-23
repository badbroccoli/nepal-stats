/** Good→bad (or higher-better) color scales for metrics that have a meaningful range. */

export type ScaleKind = "higher-better" | "higher-worse";

export interface ScaleStop {
  at: number;
  color: string;
  label: string;
}

export interface ValueScale {
  id: string;
  kind: ScaleKind;
  min: number;
  max: number;
  /** Display unit for axis labels */
  unit?: string;
  stops: ScaleStop[];
  /** Short ends for the legend strip */
  goodLabel: string;
  badLabel: string;
}

const COLORS = {
  good: "#3ddc97",
  fair: "#8fd460",
  caution: "#f4d35e",
  warn: "#ff9f1c",
  bad: "#ff6b6b",
  severe: "#c23b3b",
  critical: "#8b1e1e",
} as const;

export const SCALES: Record<string, ValueScale> = {
  aqi: {
    id: "aqi",
    kind: "higher-worse",
    min: 0,
    max: 300,
    unit: "AQI",
    goodLabel: "Good",
    badLabel: "Hazardous",
    stops: [
      { at: 0, color: COLORS.good, label: "Good" },
      { at: 50, color: COLORS.caution, label: "Moderate" },
      { at: 100, color: COLORS.warn, label: "Sensitive" },
      { at: 150, color: COLORS.bad, label: "Unhealthy" },
      { at: 200, color: COLORS.severe, label: "Very unhealthy" },
      { at: 300, color: COLORS.critical, label: "Hazardous" },
    ],
  },
  cpi: {
    id: "cpi",
    kind: "higher-worse",
    min: 0,
    max: 20,
    unit: "%",
    goodLabel: "Calm",
    badLabel: "Hot",
    stops: [
      { at: 0, color: COLORS.good, label: "Low" },
      { at: 4, color: COLORS.fair, label: "Comfortable" },
      { at: 7, color: COLORS.caution, label: "Elevated" },
      { at: 12, color: COLORS.warn, label: "High" },
      { at: 20, color: COLORS.bad, label: "Very high" },
    ],
  },
  gdp_growth: {
    id: "gdp_growth",
    kind: "higher-better",
    min: -2,
    max: 10,
    unit: "%",
    goodLabel: "Strong",
    badLabel: "Weak",
    stops: [
      { at: -2, color: COLORS.bad, label: "Contraction" },
      { at: 0, color: COLORS.warn, label: "Flat" },
      { at: 2, color: COLORS.caution, label: "Soft" },
      { at: 4, color: COLORS.fair, label: "Solid" },
      { at: 7, color: COLORS.good, label: "Strong" },
      { at: 10, color: COLORS.good, label: "Boom" },
    ],
  },
  literacy: {
    id: "literacy",
    kind: "higher-better",
    min: 0,
    max: 100,
    unit: "%",
    goodLabel: "High",
    badLabel: "Low",
    stops: [
      { at: 0, color: COLORS.bad, label: "Low" },
      { at: 50, color: COLORS.warn, label: "Developing" },
      { at: 70, color: COLORS.caution, label: "Fair" },
      { at: 85, color: COLORS.fair, label: "Good" },
      { at: 100, color: COLORS.good, label: "Excellent" },
    ],
  },
  urban_share: {
    id: "urban_share",
    kind: "higher-better",
    min: 0,
    max: 100,
    unit: "%",
    goodLabel: "Urbanized",
    badLabel: "Rural",
    stops: [
      { at: 0, color: "#4cc9f0", label: "Rural" },
      { at: 40, color: COLORS.caution, label: "Mixed" },
      { at: 66, color: COLORS.fair, label: "Urbanizing" },
      { at: 100, color: COLORS.good, label: "Urban" },
    ],
  },
  hdi: {
    id: "hdi",
    kind: "higher-better",
    min: 0,
    max: 1,
    goodLabel: "High",
    badLabel: "Low",
    stops: [
      { at: 0, color: COLORS.bad, label: "Low" },
      { at: 0.55, color: COLORS.warn, label: "Medium" },
      { at: 0.7, color: COLORS.caution, label: "High" },
      { at: 0.8, color: COLORS.fair, label: "Very high" },
      { at: 1, color: COLORS.good, label: "Top" },
    ],
  },
  life_exp: {
    id: "life_exp",
    kind: "higher-better",
    min: 50,
    max: 85,
    unit: "yr",
    goodLabel: "Longer",
    badLabel: "Shorter",
    stops: [
      { at: 50, color: COLORS.bad, label: "Low" },
      { at: 60, color: COLORS.warn, label: "Fair" },
      { at: 70, color: COLORS.caution, label: "Good" },
      { at: 78, color: COLORS.fair, label: "High" },
      { at: 85, color: COLORS.good, label: "Top" },
    ],
  },
  import_cover: {
    id: "import_cover",
    kind: "higher-better",
    min: 0,
    max: 24,
    unit: "mo",
    goodLabel: "Cushioned",
    badLabel: "Thin",
    stops: [
      { at: 0, color: COLORS.critical, label: "Critical" },
      { at: 3, color: COLORS.bad, label: "Tight" },
      { at: 6, color: COLORS.warn, label: "Adequate" },
      { at: 12, color: COLORS.caution, label: "Comfortable" },
      { at: 18, color: COLORS.good, label: "Strong" },
      { at: 24, color: COLORS.good, label: "Ample" },
    ],
  },
  forest_cover: {
    id: "forest_cover",
    kind: "higher-better",
    min: 0,
    max: 100,
    unit: "%",
    goodLabel: "Lush",
    badLabel: "Bare",
    stops: [
      { at: 0, color: COLORS.bad, label: "Bare" },
      { at: 20, color: COLORS.warn, label: "Sparse" },
      { at: 40, color: COLORS.caution, label: "Fair" },
      { at: 55, color: COLORS.good, label: "Healthy" },
      { at: 100, color: COLORS.good, label: "Dense" },
    ],
  },
  co2_pc: {
    id: "co2_pc",
    kind: "higher-worse",
    min: 0,
    max: 8,
    unit: "t",
    goodLabel: "Light",
    badLabel: "Heavy",
    stops: [
      { at: 0, color: COLORS.good, label: "Light" },
      { at: 1, color: COLORS.fair, label: "Low" },
      { at: 3, color: COLORS.caution, label: "Moderate" },
      { at: 5, color: COLORS.warn, label: "High" },
      { at: 8, color: COLORS.bad, label: "Heavy" },
    ],
  },
  incidents_30d: {
    id: "incidents_30d",
    kind: "higher-worse",
    min: 0,
    max: 500,
    goodLabel: "Quiet",
    badLabel: "Busy",
    stops: [
      { at: 0, color: COLORS.good, label: "Quiet" },
      { at: 50, color: COLORS.fair, label: "Light" },
      { at: 150, color: COLORS.caution, label: "Active" },
      { at: 300, color: COLORS.warn, label: "Heavy" },
      { at: 500, color: COLORS.bad, label: "Severe" },
    ],
  },
  quakes_30d: {
    id: "quakes_30d",
    kind: "higher-worse",
    min: 0,
    max: 80,
    goodLabel: "Calm",
    badLabel: "Active",
    stops: [
      { at: 0, color: COLORS.good, label: "Calm" },
      { at: 10, color: COLORS.caution, label: "Light" },
      { at: 25, color: COLORS.warn, label: "Active" },
      { at: 50, color: COLORS.bad, label: "Busy" },
      { at: 80, color: COLORS.severe, label: "Intense" },
    ],
  },
  active_alerts: {
    id: "active_alerts",
    kind: "higher-worse",
    min: 0,
    max: 40,
    goodLabel: "Clear",
    badLabel: "Alert",
    stops: [
      { at: 0, color: COLORS.good, label: "Clear" },
      { at: 3, color: COLORS.caution, label: "Watch" },
      { at: 8, color: COLORS.warn, label: "Elevated" },
      { at: 20, color: COLORS.bad, label: "Many" },
      { at: 40, color: COLORS.severe, label: "Crisis" },
    ],
  },
  rivers_elevated: {
    id: "rivers_elevated",
    kind: "higher-worse",
    min: 0,
    max: 40,
    goodLabel: "Normal",
    badLabel: "Flood risk",
    stops: [
      { at: 0, color: COLORS.good, label: "Normal" },
      { at: 3, color: COLORS.caution, label: "Watch" },
      { at: 8, color: COLORS.warn, label: "Elevated" },
      { at: 15, color: COLORS.bad, label: "Danger" },
      { at: 40, color: COLORS.severe, label: "Widespread" },
    ],
  },
  quake_mag: {
    id: "quake_mag",
    kind: "higher-worse",
    min: 1,
    max: 8,
    unit: "M",
    goodLabel: "Minor",
    badLabel: "Major",
    stops: [
      { at: 1, color: COLORS.good, label: "Minor" },
      { at: 3, color: COLORS.caution, label: "Light" },
      { at: 4, color: COLORS.warn, label: "Moderate" },
      { at: 5, color: COLORS.bad, label: "Strong" },
      { at: 6, color: COLORS.severe, label: "Major" },
      { at: 8, color: COLORS.critical, label: "Great" },
    ],
  },
  // Common health/education percents
  immunization: {
    id: "immunization",
    kind: "higher-better",
    min: 0,
    max: 100,
    unit: "%",
    goodLabel: "Covered",
    badLabel: "Gaps",
    stops: [
      { at: 0, color: COLORS.bad, label: "Gaps" },
      { at: 60, color: COLORS.warn, label: "Low" },
      { at: 80, color: COLORS.caution, label: "Fair" },
      { at: 90, color: COLORS.fair, label: "Good" },
      { at: 100, color: COLORS.good, label: "Full" },
    ],
  },
  electrification: {
    id: "electrification",
    kind: "higher-better",
    min: 0,
    max: 100,
    unit: "%",
    goodLabel: "Connected",
    badLabel: "Off-grid",
    stops: [
      { at: 0, color: COLORS.bad, label: "Off-grid" },
      { at: 50, color: COLORS.warn, label: "Partial" },
      { at: 80, color: COLORS.caution, label: "Mostly" },
      { at: 95, color: COLORS.fair, label: "Near full" },
      { at: 100, color: COLORS.good, label: "Universal" },
    ],
  },
};

/** Map metric keys → scale ids (supports aliases). */
const KEY_TO_SCALE: Record<string, string> = {
  ktm_aqi: "aqi",
  aqi: "aqi",
  cpi: "cpi",
  gdp_growth: "gdp_growth",
  literacy: "literacy",
  urban_share: "urban_share",
  hdi: "hdi",
  life_exp: "life_exp",
  import_cover: "import_cover",
  forest_cover: "forest_cover",
  co2_pc: "co2_pc",
  incidents_30d: "incidents_30d",
  quakes_30d: "quakes_30d",
  active_alerts: "active_alerts",
  rivers_elevated: "rivers_elevated",
  // fuzzy health / energy keys used in seed
  immunization: "immunization",
  dtp3: "immunization",
  measles: "immunization",
  electrification: "electrification",
  access_electricity: "electrification",
};

export function scaleForMetricKey(key: string): ValueScale | null {
  const id = KEY_TO_SCALE[key];
  if (id && SCALES[id]) return SCALES[id];
  if (key.includes("aqi")) return SCALES.aqi;
  if (key.includes("immun")) return SCALES.immunization;
  if (key.includes("electr")) return SCALES.electrification;
  return null;
}

function lerpColor(a: string, b: string, t: number): string {
  const pa = hexToRgb(a);
  const pb = hexToRgb(b);
  if (!pa || !pb) return a;
  const u = Math.max(0, Math.min(1, t));
  const r = Math.round(pa.r + (pb.r - pa.r) * u);
  const g = Math.round(pa.g + (pb.g - pa.g) * u);
  const bl = Math.round(pa.b + (pb.b - pa.b) * u);
  return `#${toHex(r)}${toHex(g)}${toHex(bl)}`;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const h = hex.replace("#", "");
  if (h.length !== 6) return null;
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

function toHex(n: number) {
  return n.toString(16).padStart(2, "0");
}

/** Interpolated color for a value on a scale. */
export function colorAt(scale: ValueScale, value: number): string {
  const v = clamp(value, scale.min, scale.max);
  const stops = scale.stops;
  if (v <= stops[0].at) return stops[0].color;
  for (let i = 1; i < stops.length; i++) {
    if (v <= stops[i].at) {
      const a = stops[i - 1];
      const b = stops[i];
      const t = (v - a.at) / (b.at - a.at || 1);
      return lerpColor(a.color, b.color, t);
    }
  }
  return stops[stops.length - 1].color;
}

/** Band label for the value (nearest lower stop). */
export function bandAt(scale: ValueScale, value: number): ScaleStop {
  const v = clamp(value, scale.min, scale.max);
  let current = scale.stops[0];
  for (const s of scale.stops) {
    if (v >= s.at) current = s;
  }
  return current;
}

export function positionOnScale(scale: ValueScale, value: number): number {
  return (clamp(value, scale.min, scale.max) - scale.min) / (scale.max - scale.min || 1);
}

/** CSS linear-gradient for the scale strip (left = min, right = max). */
export function scaleGradient(scale: ValueScale): string {
  const span = scale.max - scale.min || 1;
  const parts = scale.stops.map((s) => {
    const pct = ((s.at - scale.min) / span) * 100;
    return `${s.color} ${pct.toFixed(1)}%`;
  });
  return `linear-gradient(90deg, ${parts.join(", ")})`;
}

export function formatScaleTick(n: number, scale: ValueScale): string {
  if (scale.id === "hdi") return n.toFixed(2);
  if (Number.isInteger(n)) return String(n);
  return n.toFixed(1);
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}
