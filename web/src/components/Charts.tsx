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

const tooltipStyle = {
  background: "#111",
  border: "1px solid #333",
  borderRadius: 4,
  fontSize: 12,
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
    <div className="panel h-72 rounded-sm p-3">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid stroke="#222" vertical={false} />
          <XAxis dataKey={xKey} stroke="#666" tick={{ fontSize: 11 }} />
          <YAxis stroke="#666" tick={{ fontSize: 11 }} />
          <Tooltip contentStyle={tooltipStyle} />
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
}: {
  data: Record<string, string | number>[];
  xKey: string;
  yKey: string;
  color?: string;
}) {
  return (
    <div className="panel h-72 rounded-sm p-3">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="fillA" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.45} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#222" vertical={false} />
          <XAxis dataKey={xKey} stroke="#666" tick={{ fontSize: 11 }} />
          <YAxis stroke="#666" tick={{ fontSize: 11 }} />
          <Tooltip contentStyle={tooltipStyle} />
          <Area
            type="monotone"
            dataKey={yKey}
            stroke={color}
            fill="url(#fillA)"
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
    <div className="panel h-96 rounded-sm p-3">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={shaped} layout="vertical" stackOffset="sign">
          <CartesianGrid stroke="#222" horizontal={false} />
          <XAxis type="number" stroke="#666" tick={{ fontSize: 11 }} />
          <YAxis
            type="category"
            dataKey="band"
            stroke="#666"
            tick={{ fontSize: 11 }}
            width={48}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(v) => Math.abs(Number(v)).toFixed(2) + "m"}
          />
          <Bar dataKey="male" fill="#4cc9f0" stackId="a" name="Male" />
          <Bar dataKey="female" fill="#f72585" stackId="a" name="Female" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
