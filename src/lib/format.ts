export function formatCompact(n: number): string {
  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(n);
}

export function formatNumber(n: number, digits = 0): string {
  return new Intl.NumberFormat("en", {
    maximumFractionDigits: digits,
  }).format(n);
}

export function formatPercent(n: number, digits = 1): string {
  return `${n.toFixed(digits)}%`;
}

export function formatMetricValue(
  value: number | string,
  format: "number" | "compact" | "percent" | "currency" | "raw" = "number",
  unit?: string,
): string {
  if (typeof value === "string") return value;
  let core: string;
  switch (format) {
    case "compact":
      core = formatCompact(value);
      break;
    case "percent":
      core = formatPercent(value);
      break;
    case "currency":
      core = unit
        ? `${unit} ${formatNumber(value, 2)}`
        : formatNumber(value, 2);
      break;
    case "raw":
      core = String(value);
      break;
    default:
      core = formatNumber(value);
  }
  return unit && format !== "percent" && format !== "currency"
    ? `${core} ${unit}`
    : core;
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
