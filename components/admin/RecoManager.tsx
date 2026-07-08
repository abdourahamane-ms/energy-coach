"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Reco = {
  id: string;
  title: string;
  category: string | null;
  shortDescription: string | null;
  detailedExplanation: string | null;
  effortLevel: string | null;
  impactLevel: string | null;
  ruleTitle: string | null;
  sourceName: string | null;
  isActive: boolean;
};

export default function RecoManager({ recos }: { recos: Reco[] }) {
  const router = useRouter();
  const [openId, setOpenId] = useState<string | null>(null);
  return (
    <div className="space-y-3">
      {recos.map((r) => (
        <RecoRow
          key={r.id}
          reco={r}
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

function RecoRow({
  reco,
  open,
  onToggle,
  onSaved,
}: {
  reco: Reco;
  open: boolean;
  onToggle: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(reco.title);
  const [shortDescription, setShort] = useState(reco.shortDescription ?? "");
  const [detailedExplanation, setDetail] = useState(reco.detailedExplanation ?? "");
  const [effortLevel, setEffort] = useState(reco.effortLevel ?? "moyen");
  const [impactLevel, setImpact] = useState(reco.impactLevel ?? "moyen");
  const [isActive, setActive] = useState(reco.isActive);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/recommendations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: reco.id,
          title,
          shortDescription: shortDescription || undefined,
          detailedExplanation: detailedExplanation || undefined,
          effortLevel,
          impactLevel,
          isActive,
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
          <h3 className="font-semibold truncate">
            {reco.title}
            {!reco.isActive && (
              <span className="ml-2 text-xs text-[var(--muted)]">(inactive)</span>
            )}
          </h3>
          <p className="text-xs text-[var(--muted)]">
            {reco.category ?? "—"} · effort {reco.effortLevel ?? "—"} · impact{" "}
            {reco.impactLevel ?? "—"}
            {reco.sourceName ? ` · Source : ${reco.sourceName}` : ""}
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
            <span className="ec-label">Résumé</span>
            <input className="ec-input" value={shortDescription}
              onChange={(e) => setShort(e.target.value)} />
          </label>
          <label className="block sm:col-span-2">
            <span className="ec-label">Explication détaillée</span>
            <textarea className="ec-input" rows={3} value={detailedExplanation}
              onChange={(e) => setDetail(e.target.value)} />
          </label>
          <label className="block">
            <span className="ec-label">Effort</span>
            <select className="ec-select" value={effortLevel} onChange={(e) => setEffort(e.target.value)}>
              <option value="faible">Faible</option>
              <option value="moyen">Moyen</option>
              <option value="eleve">Élevé</option>
            </select>
          </label>
          <label className="block">
            <span className="ec-label">Impact</span>
            <select className="ec-select" value={impactLevel} onChange={(e) => setImpact(e.target.value)}>
              <option value="faible">Faible</option>
              <option value="moyen">Moyen</option>
              <option value="eleve">Élevé</option>
            </select>
          </label>
          <label className="flex items-center gap-2 sm:col-span-2">
            <input type="checkbox" checked={isActive} className="h-4 w-4 accent-[var(--primary)]"
              onChange={(e) => setActive(e.target.checked)} />
            <span className="text-sm">Recommandation active</span>
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
