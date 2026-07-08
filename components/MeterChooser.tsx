"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

type MeterType = {
  id: string;
  slug: string;
  name: string;
  energyType: string;
  description: string | null;
  supportsQrDemo: boolean;
  supportsRealConnectionLater: boolean;
};

const ICONS: Record<string, string> = {
  linky: "🔌",
  "electrique-classique": "⚡",
  gazpar: "🔥",
  "gaz-classique": "🔥",
  prepaye: "💳",
  manuel: "🧾",
  inconnu: "❓",
  demo: "🎬",
};

export default function MeterChooser({
  meterTypes,
  currentSlug,
}: {
  meterTypes: MeterType[];
  currentSlug: string | null;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(currentSlug);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle"
  );
  const [error, setError] = useState<string | null>(null);

  const current = meterTypes.find((m) => m.slug === selected) ?? null;

  async function save(extra: Record<string, unknown> = {}) {
    if (!selected) return;
    setStatus("saving");
    setError(null);
    try {
      const res = await fetch("/api/compteur", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meterSlug: selected, ...extra }),
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

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {meterTypes.map((m) => (
          <button
            key={m.slug}
            onClick={() => {
              setSelected(m.slug);
              setStatus("idle");
            }}
            className={`text-left ec-card !p-4 transition ${
              selected === m.slug
                ? "ring-2 ring-[var(--primary)]"
                : "hover:shadow-md"
            }`}
          >
            <div className="text-2xl">{ICONS[m.slug] ?? "🔌"}</div>
            <div className="mt-1 font-semibold">{m.name}</div>
            {m.description && (
              <p className="text-xs text-[var(--muted)] mt-1">{m.description}</p>
            )}
          </button>
        ))}
      </div>

      {current && (
        <div className="ec-card space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <span>{ICONS[current.slug]}</span> {current.name}
          </h3>

          {/* Linky / Gazpar : honnêteté sur la connexion réelle */}
          {(current.slug === "linky" || current.slug === "gazpar") && (
            <MeterPanelSmart
              current={current}
              onChoose={() => save()}
              status={status}
            />
          )}

          {/* Compteurs classiques : facture ou kWh */}
          {(current.slug === "electrique-classique" ||
            current.slug === "gaz-classique" ||
            current.slug === "manuel") && (
            <ClassicPanel onSave={save} status={status} />
          )}

          {/* Prépayé */}
          {current.slug === "prepaye" && (
            <PrepaidPanel onSave={save} status={status} />
          )}

          {/* Je ne sais pas */}
          {current.slug === "inconnu" && <UnknownPanel />}

          {/* Démo */}
          {current.slug === "demo" && (
            <p className="text-sm text-[var(--muted)]">
              Le mode démo se lance depuis la page d&apos;accueil ou le bouton
              « Tester le mode démo ». Vous pouvez aussi simuler un compteur via
              un{" "}
              <Link href="/scan-qr" className="text-[var(--primary)] font-medium">
                QR code de démonstration
              </Link>
              .
            </p>
          )}

          {error && (
            <p className="text-sm text-[var(--danger)]">{error}</p>
          )}

          {status === "saved" && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-[var(--primary-soft)] px-4 py-3">
              <p className="text-sm font-medium text-[var(--primary-hover)]">
                Votre compteur a été enregistré.
              </p>
              <button
                onClick={() => router.push("/appareils")}
                className="ec-btn ec-btn-primary"
              >
                Étape suivante : mes appareils
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MeterPanelSmart({
  current,
  onChoose,
  status,
}: {
  current: MeterType;
  onChoose: () => void;
  status: string;
}) {
  return (
    <div className="space-y-3">
      <div className="rounded-lg bg-[var(--primary-soft)]/60 px-4 py-3 text-sm">
        Pour cette version, vous pouvez utiliser la saisie manuelle ou tester une
        simulation compteur. La connexion automatique réelle (avec votre
        consentement) pourra être ajoutée dans une version future.
      </div>
      <div className="flex flex-wrap gap-3">
        <button
          onClick={onChoose}
          disabled={status === "saving"}
          className="ec-btn ec-btn-primary"
        >
          Choisir ce compteur
        </button>
        <Link href="/consommation" className="ec-btn ec-btn-ghost">
          Saisie manuelle
        </Link>
        {current.supportsQrDemo && (
          <Link href="/scan-qr" className="ec-btn ec-btn-ghost">
            Tester avec un QR code démo
          </Link>
        )}
      </div>
    </div>
  );
}

function ClassicPanel({
  onSave,
  status,
}: {
  onSave: (extra: Record<string, unknown>) => void;
  status: string;
}) {
  const [bill, setBill] = useState("");
  const [kwh, setKwh] = useState("");
  return (
    <div className="space-y-3">
      <p className="text-sm text-[var(--muted)]">
        Renseignez votre facture mensuelle moyenne ou votre consommation si vous
        la connaissez.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="ec-label">Facture mensuelle (€)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            className="ec-input"
            value={bill}
            onChange={(e) => setBill(e.target.value)}
          />
        </div>
        <div>
          <label className="ec-label">Consommation (kWh/mois)</label>
          <input
            type="number"
            min="0"
            step="1"
            className="ec-input"
            value={kwh}
            onChange={(e) => setKwh(e.target.value)}
          />
        </div>
      </div>
      <button
        onClick={() =>
          onSave({
            manualMonthlyBillEuro: bill ? Number(bill) : undefined,
            manualMonthlyKwh: kwh ? Number(kwh) : undefined,
          })
        }
        disabled={status === "saving"}
        className="ec-btn ec-btn-primary"
      >
        {status === "saving" ? "Enregistrement…" : "Enregistrer ce compteur"}
      </button>
    </div>
  );
}

function PrepaidPanel({
  onSave,
  status,
}: {
  onSave: (extra: Record<string, unknown>) => void;
  status: string;
}) {
  const [budget, setBudget] = useState("");
  const [recharge, setRecharge] = useState("");
  const [freq, setFreq] = useState("");
  return (
    <div className="space-y-3">
      <p className="text-sm text-[var(--muted)]">
        Le compteur prépayé nous aide à comprendre où part votre budget énergie.
      </p>
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="ec-label">Budget mensuel (€)</label>
          <input
            type="number"
            min="0"
            step="1"
            className="ec-input"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
          />
        </div>
        <div>
          <label className="ec-label">Montant d&apos;une recharge (€)</label>
          <input
            type="number"
            min="0"
            step="1"
            className="ec-input"
            value={recharge}
            onChange={(e) => setRecharge(e.target.value)}
          />
        </div>
        <div>
          <label className="ec-label">Fréquence des recharges</label>
          <select
            className="ec-select"
            value={freq}
            onChange={(e) => setFreq(e.target.value)}
          >
            <option value="">—</option>
            <option value="hebdomadaire">Hebdomadaire</option>
            <option value="bimensuelle">Toutes les 2 semaines</option>
            <option value="mensuelle">Mensuelle</option>
          </select>
        </div>
      </div>
      <button
        onClick={() =>
          onSave({
            prepaidMonthlyBudget: budget ? Number(budget) : undefined,
            prepaidRechargeAmount: recharge ? Number(recharge) : undefined,
            prepaidRechargeFrequency: freq || undefined,
          })
        }
        disabled={status === "saving"}
        className="ec-btn ec-btn-primary"
      >
        {status === "saving" ? "Enregistrement…" : "Enregistrer ce compteur"}
      </button>
    </div>
  );
}

function UnknownPanel() {
  return (
    <div className="space-y-3 text-sm">
      <p className="text-[var(--muted)]">
        Quelques repères pour vous orienter :
      </p>
      <ul className="list-disc pl-5 space-y-1 text-[var(--muted)]">
        <li>
          Vous payez une facture mensuelle ou tous les deux mois ? Choisissez{" "}
          <b>Saisie manuelle (facture)</b>.
        </li>
        <li>
          Vous rechargez votre compteur à l&apos;avance ? Choisissez{" "}
          <b>Compteur prépayé</b>.
        </li>
        <li>
          Vous vous chauffez au gaz ? Choisissez un <b>compteur gaz</b>.
        </li>
        <li>Sinon, un compteur électrique convient dans la plupart des cas.</li>
      </ul>
    </div>
  );
}
