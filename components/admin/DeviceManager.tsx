"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Device = {
  id: string;
  name: string;
  category: string;
  powerWatts: number | null;
  averageMonthlyKwh: number | null;
  impactLevel: string | null;
  advice: string | null;
  sourceId: string | null;
  isActive: boolean;
};
type Source = { id: string; name: string };

const CATEGORIES = [
  "chauffage",
  "climatisation",
  "electromenager",
  "multimedia",
  "eclairage",
  "eau_chaude",
  "veille",
];

const empty = {
  id: undefined as string | undefined,
  name: "",
  category: "electromenager",
  powerWatts: "",
  averageMonthlyKwh: "",
  impactLevel: "moyen",
  advice: "",
  sourceId: "",
  isActive: true,
};

export default function DeviceManager({
  devices,
  sources,
}: {
  devices: Device[];
  sources: Source[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<typeof empty | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (!editing) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/devices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editing.id,
          name: editing.name,
          category: editing.category,
          powerWatts: editing.powerWatts === "" ? undefined : Number(editing.powerWatts),
          averageMonthlyKwh:
            editing.averageMonthlyKwh === "" ? undefined : Number(editing.averageMonthlyKwh),
          impactLevel: editing.impactLevel,
          advice: editing.advice || undefined,
          sourceId: editing.sourceId || undefined,
          isActive: editing.isActive,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Erreur.");
      } else {
        setEditing(null);
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  async function toggleActive(d: Device) {
    setBusy(true);
    await fetch("/api/admin/devices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...d, isActive: !d.isActive, sourceId: d.sourceId ?? undefined,
        powerWatts: d.powerWatts ?? undefined, averageMonthlyKwh: d.averageMonthlyKwh ?? undefined,
        impactLevel: d.impactLevel ?? undefined, advice: d.advice ?? undefined }),
    });
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => setEditing({ ...empty })}
          className="ec-btn ec-btn-primary"
        >
          + Nouvel appareil
        </button>
      </div>

      {editing && (
        <div className="ec-card border-[var(--primary)]">
          <h3 className="font-semibold mb-3">
            {editing.id ? "Modifier l'appareil" : "Nouvel appareil"}
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Nom">
              <input className="ec-input" value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
            </Field>
            <Field label="Catégorie">
              <select className="ec-select" value={editing.category}
                onChange={(e) => setEditing({ ...editing, category: e.target.value })}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Puissance (W)">
              <input type="number" className="ec-input" value={editing.powerWatts}
                onChange={(e) => setEditing({ ...editing, powerWatts: e.target.value })} />
            </Field>
            <Field label="Conso. moyenne (kWh/mois)">
              <input type="number" className="ec-input" value={editing.averageMonthlyKwh}
                onChange={(e) => setEditing({ ...editing, averageMonthlyKwh: e.target.value })} />
            </Field>
            <Field label="Impact">
              <select className="ec-select" value={editing.impactLevel}
                onChange={(e) => setEditing({ ...editing, impactLevel: e.target.value })}>
                <option value="faible">Faible</option>
                <option value="moyen">Moyen</option>
                <option value="eleve">Élevé</option>
              </select>
            </Field>
            <Field label="Source">
              <select className="ec-select" value={editing.sourceId}
                onChange={(e) => setEditing({ ...editing, sourceId: e.target.value })}>
                <option value="">—</option>
                {sources.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </Field>
            <div className="sm:col-span-2">
              <Field label="Conseil associé">
                <input className="ec-input" value={editing.advice}
                  onChange={(e) => setEditing({ ...editing, advice: e.target.value })} />
              </Field>
            </div>
          </div>
          {error && <p className="text-sm text-[var(--danger)] mt-2">{error}</p>}
          <div className="mt-4 flex gap-2">
            <button onClick={save} disabled={busy} className="ec-btn ec-btn-primary">
              {busy ? "Enregistrement…" : "Enregistrer"}
            </button>
            <button onClick={() => setEditing(null)} className="ec-btn ec-btn-ghost">
              Annuler
            </button>
          </div>
        </div>
      )}

      <div className="ec-card overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="text-left text-[var(--muted)] border-b border-[var(--border)]">
              <th className="py-2 pr-3">Nom</th>
              <th className="py-2 pr-3">Catégorie</th>
              <th className="py-2 pr-3">Puissance</th>
              <th className="py-2 pr-3">Impact</th>
              <th className="py-2 pr-3">Statut</th>
              <th className="py-2 pr-3"></th>
            </tr>
          </thead>
          <tbody>
            {devices.map((d) => (
              <tr key={d.id} className="border-b border-[var(--border)] last:border-0">
                <td className="py-2 pr-3 font-medium">{d.name}</td>
                <td className="py-2 pr-3 text-[var(--muted)]">{d.category}</td>
                <td className="py-2 pr-3">{d.powerWatts ? `${d.powerWatts} W` : "—"}</td>
                <td className="py-2 pr-3">{d.impactLevel ?? "—"}</td>
                <td className="py-2 pr-3">
                  <button onClick={() => toggleActive(d)} disabled={busy}
                    className={`text-xs font-semibold px-2 py-1 rounded-full ${
                      d.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    }`}>
                    {d.isActive ? "Actif" : "Désactivé"}
                  </button>
                </td>
                <td className="py-2 pr-3 text-right">
                  <button
                    onClick={() =>
                      setEditing({
                        id: d.id,
                        name: d.name,
                        category: d.category,
                        powerWatts: d.powerWatts?.toString() ?? "",
                        averageMonthlyKwh: d.averageMonthlyKwh?.toString() ?? "",
                        impactLevel: d.impactLevel ?? "moyen",
                        advice: d.advice ?? "",
                        sourceId: d.sourceId ?? "",
                        isActive: d.isActive,
                      })
                    }
                    className="text-[var(--primary)] font-medium"
                  >
                    Modifier
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="ec-label">{label}</span>
      {children}
    </label>
  );
}
