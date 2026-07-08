"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type Device = {
  id: string;
  name: string;
  category: string;
  powerWatts: number | null;
  defaultDailyHours: number | null;
  impactLevel: string | null;
  advice: string | null;
};

type Selected = {
  deviceId: string;
  quantity: number;
  usageHoursPerDay?: number;
  usageDaysPerMonth?: number;
};

const CATEGORY_LABELS: Record<string, string> = {
  chauffage: "Chauffage",
  climatisation: "Climatisation",
  electromenager: "Électroménager",
  multimedia: "Multimédia",
  eclairage: "Éclairage",
  eau_chaude: "Eau chaude",
  veille: "Petits appareils",
};

const IMPACT_STYLE: Record<string, string> = {
  eleve: "bg-red-100 text-red-700",
  moyen: "bg-amber-100 text-amber-700",
  faible: "bg-green-100 text-green-700",
};

export default function DeviceLibrary({
  library,
  initialSelected,
}: {
  library: Device[];
  initialSelected: Selected[];
}) {
  const router = useRouter();
  const [state, setState] = useState<Record<string, Selected>>(() => {
    const map: Record<string, Selected> = {};
    for (const s of initialSelected) map[s.deviceId] = s;
    return map;
  });
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle"
  );
  const [error, setError] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const g: Record<string, Device[]> = {};
    for (const d of library) {
      (g[d.category] ??= []).push(d);
    }
    return g;
  }, [library]);

  function toggle(d: Device) {
    setState((prev) => {
      const next = { ...prev };
      if (next[d.id]) {
        delete next[d.id];
      } else {
        next[d.id] = {
          deviceId: d.id,
          quantity: 1,
          usageHoursPerDay: d.defaultDailyHours ?? undefined,
          usageDaysPerMonth: 30,
        };
      }
      return next;
    });
    setStatus("idle");
  }

  function update(id: string, patch: Partial<Selected>) {
    setState((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
    setStatus("idle");
  }

  async function save() {
    setStatus("saving");
    setError(null);
    try {
      const res = await fetch("/api/appareils", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ devices: Object.values(state) }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Une erreur est survenue.");
        setStatus("error");
        return;
      }
      setStatus("saved");
      router.refresh();
    } catch {
      setError("Une erreur est survenue. Veuillez réessayer.");
      setStatus("error");
    }
  }

  const count = Object.keys(state).length;

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([cat, devices]) => (
        <div key={cat} className="ec-card">
          <h3 className="font-semibold mb-3">
            {CATEGORY_LABELS[cat] ?? cat}
          </h3>
          <div className="space-y-2">
            {devices.map((d) => {
              const sel = state[d.id];
              return (
                <div
                  key={d.id}
                  className={`rounded-lg border px-3 py-2.5 transition ${
                    sel
                      ? "border-[var(--primary)] bg-[var(--primary-soft)]/40"
                      : "border-[var(--border)]"
                  }`}
                >
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(sel)}
                      onChange={() => toggle(d)}
                      className="h-4 w-4 accent-[var(--primary)]"
                    />
                    <span className="font-medium flex-1">{d.name}</span>
                    {d.impactLevel && (
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                          IMPACT_STYLE[d.impactLevel] ?? ""
                        }`}
                      >
                        {d.impactLevel === "eleve"
                          ? "Impact élevé"
                          : d.impactLevel === "moyen"
                            ? "Impact moyen"
                            : "Impact faible"}
                      </span>
                    )}
                  </label>

                  {sel && (
                    <div className="mt-3 grid gap-2 sm:grid-cols-3 pl-7">
                      <label className="text-xs">
                        Quantité
                        <input
                          type="number"
                          min="1"
                          className="ec-input mt-1"
                          value={sel.quantity}
                          onChange={(e) =>
                            update(d.id, {
                              quantity: Number(e.target.value) || 1,
                            })
                          }
                        />
                      </label>
                      <label className="text-xs">
                        Heures / jour
                        <input
                          type="number"
                          min="0"
                          max="24"
                          step="0.5"
                          className="ec-input mt-1"
                          value={sel.usageHoursPerDay ?? ""}
                          onChange={(e) =>
                            update(d.id, {
                              usageHoursPerDay:
                                e.target.value === ""
                                  ? undefined
                                  : Number(e.target.value),
                            })
                          }
                        />
                      </label>
                      <label className="text-xs">
                        Jours / mois
                        <input
                          type="number"
                          min="0"
                          max="31"
                          className="ec-input mt-1"
                          value={sel.usageDaysPerMonth ?? ""}
                          onChange={(e) =>
                            update(d.id, {
                              usageDaysPerMonth:
                                e.target.value === ""
                                  ? undefined
                                  : Number(e.target.value),
                            })
                          }
                        />
                      </label>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Barre d'enregistrement collante */}
      <div className="sticky bottom-16 md:bottom-4 z-10">
        <div className="ec-card flex flex-wrap items-center justify-between gap-3 shadow-md">
          <span className="text-sm text-[var(--muted)]">
            {count} appareil{count > 1 ? "s" : ""} sélectionné
            {count > 1 ? "s" : ""}
          </span>
          <div className="flex items-center gap-3">
            {error && <span className="text-sm text-[var(--danger)]">{error}</span>}
            {status === "saved" && (
              <button
                onClick={() => router.push("/habitudes")}
                className="ec-btn ec-btn-ghost"
              >
                Étape suivante : mes habitudes →
              </button>
            )}
            <button
              onClick={save}
              disabled={status === "saving"}
              className="ec-btn ec-btn-primary"
            >
              {status === "saving"
                ? "Enregistrement…"
                : status === "saved"
                  ? "Enregistré ✓"
                  : "Enregistrer mes appareils"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
