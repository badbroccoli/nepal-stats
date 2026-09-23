"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Area,
  AreaChart,
  RadialBar,
  RadialBarChart,
} from "recharts";

const tooltipStyle = {
  background: "#0c0c0c",
  border: "1px solid #2a2a2a",
  borderRadius: 6,
  fontSize: 12,
  boxShadow: "0 8px 24px #0008",
};

export function SimpleBars({
  data,
  xKey,
  yKey,
  color = "#3ddc97",
}: {
  data: Record<string, string | number>[];
  xKey: string;
  yKey: string;
  color?: string;
}) {
  return (
    <div className="panel chart-shell h-72 rounded-sm p-3">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barCategoryGap="28%">
          <defs>
            <linearGradient id="barFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.95} />
              <stop offset="100%" stopColor={color} stopOpacity={0.35} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#1f1f1f" vertical={false} strokeDasharray="3 6" />
          <XAxis
            dataKey={xKey}
            stroke="#555"
            tick={{ fontSize: 11, fill: "#9a9a92" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            stroke="#555"
            tick={{ fontSize: 11, fill: "#9a9a92" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            cursor={{ fill: "#ffffff08" }}
          />
          <Bar dataKey={yKey} fill="url(#barFill)" radius={[4, 4, 0, 0]} />
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
}: {
  data: Record<string, string | number>[];
  xKey: string;
  yKey: string;
  color?: string;
}) {
  return (
    <div className="panel chart-shell h-72 rounded-sm p-3">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="fillA" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.5} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#1f1f1f" vertical={false} strokeDasharray="3 6" />
          <XAxis
            dataKey={xKey}
            stroke="#555"
            tick={{ fontSize: 11, fill: "#9a9a92" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            stroke="#555"
            tick={{ fontSize: 11, fill: "#9a9a92" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip contentStyle={tooltipStyle} />
          <Area
            type="monotone"
            dataKey={yKey}
            stroke={color}
            strokeWidth={2}
            fill="url(#fillA)"
            activeDot={{ r: 5, strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function AgePyramidChart({
  data,
}: {
  data: { band: string; male: number; female: number }[];
}) {
  const shaped = data.map((d) => ({
    band: d.band,
    male: -d.male,
    female: d.female,
  }));
  return (
    <div className="panel chart-shell h-96 rounded-sm p-3">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={shaped} layout="vertical" stackOffset="sign">
          <CartesianGrid stroke="#1f1f1f" horizontal={false} strokeDasharray="3 6" />
          <XAxis
            type="number"
            stroke="#555"
            tick={{ fontSize: 11, fill: "#9a9a92" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="band"
            stroke="#555"
            tick={{ fontSize: 11, fill: "#9a9a92" }}
            width={48}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(v) => Math.abs(Number(v)).toFixed(2) + "m"}
          />
          <Bar dataKey="male" fill="#4cc9f0" stackId="a" name="Male" radius={[0, 2, 2, 0]} />
          <Bar dataKey="female" fill="#f72585" stackId="a" name="Female" radius={[2, 0, 0, 2]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DonutMix({
  data,
  centerLabel,
  centerValue,
}: {
  data: { name: string; value: number; color: string }[];
  centerLabel?: string;
  centerValue?: string;
}) {
  return (
    <div className="panel chart-shell relative h-72 rounded-sm p-3">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius="58%"
            outerRadius="82%"
            paddingAngle={2}
            stroke="none"
          >
            {data.map((d) => (
              <Cell key={d.name} fill={d.color} />
            ))}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} />
        </PieChart>
      </ResponsiveContainer>
      {(centerLabel || centerValue) && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          {centerValue && (
            <div className="display text-2xl tabular-nums">{centerValue}</div>
          )}
          {centerLabel && (
            <div className="text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">
              {centerLabel}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function RadialScore({
  value,
  max = 100,
  label,
  color = "#3ddc97",
}: {
  value: number;
  max?: number;
  label: string;
  color?: string;
}) {
  const data = [{ name: label, value, fill: color }];
  return (
    <div className="panel chart-shell relative h-56 rounded-sm p-3">
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          innerRadius="68%"
          outerRadius="100%"
          data={data}
          startAngle={220}
          endAngle={-40}
        >
          <RadialBar
            background={{ fill: "#ffffff10" }}
            dataKey="value"
            cornerRadius={6}
            max={max}
          />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pt-2">
        <div className="display text-3xl tabular-nums">
          {value}
          <span className="text-base text-[var(--muted)]">/{max}</span>
        </div>
        <div className="mt-1 text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">
          {label}
        </div>
      </div>
    </div>
  );
}
