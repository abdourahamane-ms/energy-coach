"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Rule = {
  id: string;
  key: string;
  title: string;
  description: string | null;
  coefficient: number | null;
  targetCategory: string | null;
  sourceName: string | null;
  isActive: boolean;
};

export default function RuleManager({ rules }: { rules: Rule[] }) {
  const router = useRouter();
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      {rules.map((r) => (
        <RuleRow
          key={r.id}
          rule={r}
          open={openId === r.id}
          onToggle={() => setOpenId(openId === r.id ? null : r.id)}
          onSaved={() => {
            setOpenId(null);
            router.refresh();
          }}
        />
      ))}
    </div>
  );
}

function RuleRow({
  rule,
  open,
  onToggle,
  onSaved,
}: {
  rule: Rule;
  open: boolean;
  onToggle: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(rule.title);
  const [description, setDescription] = useState(rule.description ?? "");
  const [coefPct, setCoefPct] = useState(
    rule.coefficient != null ? Math.round(rule.coefficient * 100).toString() : ""
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/rules", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: rule.id,
          title,
          description: description || undefined,
          coefficient: coefPct === "" ? undefined : Number(coefPct) / 100,
        }),
      });
      const json = await res.json();
      if (!res.ok) setError(json.error ?? "Erreur.");
      else onSaved();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="ec-card">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold truncate">{rule.title}</h3>
          <p className="text-xs text-[var(--muted)]">
            {rule.targetCategory ?? "—"} · coefficient{" "}
            {rule.coefficient != null ? `${Math.round(rule.coefficient * 100)} %` : "—"}
            {rule.sourceName ? ` · Source : ${rule.sourceName}` : ""}
          </p>
        </div>
        <button onClick={onToggle} className="ec-btn ec-btn-ghost text-sm shrink-0">
          {open ? "Fermer" : "Modifier"}
        </button>
      </div>

      {open && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="ec-label">Titre</span>
            <input className="ec-input" value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <label className="block sm:col-span-2">
            <span className="ec-label">Description</span>
            <input className="ec-input" value={description}
              onChange={(e) => setDescription(e.target.value)} />
          </label>
          <label className="block">
            <span className="ec-label">Coefficient d&apos;économie (%)</span>
            <input type="number" min="0" max="100" className="ec-input" value={coefPct}
              onChange={(e) => setCoefPct(e.target.value)} />
          </label>
          {error && <p className="text-sm text-[var(--danger)] sm:col-span-2">{error}</p>}
          <div className="sm:col-span-2">
            <button onClick={save} disabled={busy} className="ec-btn ec-btn-primary">
              {busy ? "…" : "Enregistrer"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
