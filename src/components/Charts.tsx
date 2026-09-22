"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Area,
  AreaChart,
} from "recharts";
import { formatCompact, formatNumber } from "@/lib/format";

const tooltipStyle = {
  background: "#111",
  border: "1px solid #333",
  borderRadius: 4,
  fontSize: 12,
};

function formatAxis(v: number, format?: "number" | "compact" | "percent") {
  if (format === "percent") return `${formatNumber(v, 1)}%`;
  if (format === "compact") return formatCompact(v);
  return formatNumber(v, v >= 100 ? 0 : 1);
}

export function SimpleBars({
  data,
  xKey,
  yKey,
  color = "#3ddc97",
  format,
}: {
  data: Record<string, string | number>[];
  xKey: string;
  yKey: string;
  color?: string;
  format?: "number" | "compact" | "percent";
}) {
  return (
    <div className="panel h-72 rounded-sm p-3">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid stroke="#222" vertical={false} />
          <XAxis dataKey={xKey} stroke="#666" tick={{ fontSize: 11 }} />
          <YAxis
            stroke="#666"
            tick={{ fontSize: 11 }}
            tickFormatter={(v) => formatAxis(Number(v), format)}
            width={56}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(v) => formatAxis(Number(v), format)}
          />
          <Bar dataKey={yKey} fill={color} radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SimpleArea({
  data,
  xKey,
  yKey,
  color = "#f4d35e",
  gradientId = "fillA",
  format,
}: {
  data: Record<string, string | number>[];
  xKey: string;
  yKey: string;
  color?: string;
  gradientId?: string;
  format?: "number" | "compact" | "percent";
}) {
  return (
    <div className="panel h-72 rounded-sm p-3">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.45} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#222" vertical={false} />
          <XAxis dataKey={xKey} stroke="#666" tick={{ fontSize: 11 }} />
          <YAxis
            stroke="#666"
            tick={{ fontSize: 11 }}
            tickFormatter={(v) => formatAxis(Number(v), format)}
            width={56}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(v) => formatAxis(Number(v), format)}
          />
          <Area
            type="monotone"
            dataKey={yKey}
            stroke={color}
            fill={`url(#${gradientId})`}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function TrendChart({
  title,
  data,
  color,
  kind = "area",
  format,
  gradientId,
}: {
  title: string;
  data: { year: string; value: number }[];
  color: string;
  kind?: "area" | "bars";
  format?: "number" | "compact" | "percent";
  gradientId: string;
}) {
  if (data.length < 2) return null;
  return (
    <div>
      <h3 className="mb-2 text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
        {title}
      </h3>
      {kind === "bars" ? (
        <SimpleBars
          data={data}
          xKey="year"
          yKey="value"
          color={color}
          format={format}
        />
      ) : (
        <SimpleArea
          data={data}
          xKey="year"
          yKey="value"
          color={color}
          gradientId={gradientId}
          format={format}
        />
      )}
    </div>
  );
}
