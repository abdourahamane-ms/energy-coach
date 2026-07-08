"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LabelList,
} from "recharts";

const PALETTE = [
  "#0f8a5f",
  "#f59e0b",
  "#3b82f6",
  "#8b5cf6",
  "#ef4444",
  "#14b8a6",
  "#64748b",
];

const euro = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

export function BreakdownPie({
  data,
}: {
  data: { label: string; cost: number }[];
}) {
  const filtered = data.filter((d) => d.cost > 0);
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={filtered}
          dataKey="cost"
          nameKey="label"
          cx="50%"
          cy="50%"
          outerRadius={90}
          innerRadius={45}
          paddingAngle={2}
        >
          {filtered.map((_, i) => (
            <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(v) => euro(Number(v))} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function BreakdownLegend({
  data,
}: {
  data: { label: string; cost: number; share: number }[];
}) {
  const filtered = data.filter((d) => d.cost > 0);
  return (
    <ul className="space-y-1.5 text-sm">
      {filtered.map((d, i) => (
        <li key={d.label} className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <span
              className="inline-block h-3 w-3 rounded-sm"
              style={{ background: PALETTE[i % PALETTE.length] }}
            />
            {d.label}
          </span>
          <span className="text-[var(--muted)]">
            {euro(d.cost)} · {Math.round(d.share * 100)}%
          </span>
        </li>
      ))}
    </ul>
  );
}

export function BeforeAfterBar({
  before,
  after,
}: {
  before: number;
  after: number;
}) {
  const data = [
    { name: "Facture actuelle", value: before, fill: "#94a3b8" },
    { name: "Après actions", value: after, fill: "#0f8a5f" },
  ];
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip formatter={(v) => euro(Number(v))} />
        <Bar dataKey="value" radius={[6, 6, 0, 0]}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.fill} />
          ))}
          <LabelList dataKey="value" position="top" formatter={(v) => euro(Number(v))} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function SavingsBar({
  data,
}: {
  data: { title: string; saving: number }[];
}) {
  const rows = data.map((d) => ({
    name: d.title.length > 22 ? d.title.slice(0, 21) + "…" : d.title,
    saving: d.saving,
  }));
  return (
    <ResponsiveContainer width="100%" height={Math.max(180, rows.length * 42)}>
      <BarChart
        data={rows}
        layout="vertical"
        margin={{ top: 5, right: 40, left: 10, bottom: 5 }}
      >
        <XAxis type="number" tick={{ fontSize: 12 }} />
        <YAxis
          type="category"
          dataKey="name"
          width={140}
          tick={{ fontSize: 12 }}
        />
        <Tooltip formatter={(v) => `${euro(Number(v))}/mois`} />
        <Bar dataKey="saving" fill="#0f8a5f" radius={[0, 6, 6, 0]}>
          <LabelList dataKey="saving" position="right" formatter={(v) => euro(Number(v))} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
