"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Housing = {
  housingType?: string | null;
  surfaceM2?: number | null;
  occupants?: number | null;
  country?: string | null;
  city?: string | null;
  mainEnergy?: string | null;
  hasElectricHeating?: boolean;
  hasGasHeating?: boolean;
  hasAirConditioning?: boolean;
  hasElectricWaterHeater?: boolean;
  monthlyBillEuro?: number | null;
  monthlyConsumptionKwh?: number | null;
  knownKwhPrice?: number | null;
};

export default function ProfileForm({ initial }: { initial: Housing }) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle"
  );
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("saving");
    setError(null);
    const f = new FormData(e.currentTarget);
    const num = (k: string) => {
      const v = f.get(k);
      return v === null || v === "" ? undefined : Number(v);
    };
    const payload = {
      housingType: (f.get("housingType") as string) || undefined,
      surfaceM2: num("surfaceM2"),
      occupants: num("occupants"),
      country: (f.get("country") as string) || undefined,
      city: (f.get("city") as string) || undefined,
      mainEnergy: (f.get("mainEnergy") as string) || undefined,
      hasElectricHeating: f.get("hasElectricHeating") === "on",
      hasGasHeating: f.get("hasGasHeating") === "on",
      hasAirConditioning: f.get("hasAirConditioning") === "on",
      hasElectricWaterHeater: f.get("hasElectricWaterHeater") === "on",
      monthlyBillEuro: num("monthlyBillEuro"),
      monthlyConsumptionKwh: num("monthlyConsumptionKwh"),
      knownKwhPrice: num("knownKwhPrice"),
    };

    try {
      const res = await fetch("/api/profil-logement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="ec-label" htmlFor="housingType">
            Type de logement
          </label>
          <select
            id="housingType"
            name="housingType"
            className="ec-select"
            defaultValue={initial.housingType ?? ""}
          >
            <option value="">— Sélectionner —</option>
            <option value="appartement">Appartement</option>
            <option value="maison">Maison</option>
            <option value="studio">Studio</option>
            <option value="autre">Autre</option>
          </select>
        </div>
        <div>
          <label className="ec-label" htmlFor="mainEnergy">
            Énergie principale
          </label>
          <select
            id="mainEnergy"
            name="mainEnergy"
            className="ec-select"
            defaultValue={initial.mainEnergy ?? ""}
          >
            <option value="">— Sélectionner —</option>
            <option value="electricite">Électricité</option>
            <option value="gaz">Gaz</option>
            <option value="mixte">Mixte</option>
          </select>
        </div>
        <div>
          <label className="ec-label" htmlFor="surfaceM2">
            Surface (m²)
          </label>
          <input
            id="surfaceM2"
            name="surfaceM2"
            type="number"
            min="1"
            step="1"
            className="ec-input"
            defaultValue={initial.surfaceM2 ?? ""}
          />
        </div>
        <div>
          <label className="ec-label" htmlFor="occupants">
            Nombre d&apos;habitants
          </label>
          <input
            id="occupants"
            name="occupants"
            type="number"
            min="1"
            step="1"
            className="ec-input"
            defaultValue={initial.occupants ?? ""}
          />
        </div>
        <div>
          <label className="ec-label" htmlFor="city">
            Ville
          </label>
          <input
            id="city"
            name="city"
            className="ec-input"
            defaultValue={initial.city ?? ""}
          />
        </div>
        <div>
          <label className="ec-label" htmlFor="country">
            Pays
          </label>
          <input
            id="country"
            name="country"
            className="ec-input"
            defaultValue={initial.country ?? "France"}
          />
        </div>
      </div>

      <fieldset className="grid gap-2 sm:grid-cols-2">
        <legend className="ec-label mb-1">Équipements</legend>
        {[
          ["hasElectricHeating", "Chauffage électrique", initial.hasElectricHeating],
          ["hasGasHeating", "Chauffage au gaz", initial.hasGasHeating],
          ["hasAirConditioning", "Climatisation", initial.hasAirConditioning],
          ["hasElectricWaterHeater", "Chauffe-eau électrique", initial.hasElectricWaterHeater],
        ].map(([name, label, checked]) => (
          <label
            key={name as string}
            className="flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 cursor-pointer"
          >
            <input
              type="checkbox"
              name={name as string}
              defaultChecked={Boolean(checked)}
              className="h-4 w-4 accent-[var(--primary)]"
            />
            <span className="text-sm">{label as string}</span>
          </label>
        ))}
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="ec-label" htmlFor="monthlyBillEuro">
            Facture mensuelle (€)
          </label>
          <input
            id="monthlyBillEuro"
            name="monthlyBillEuro"
            type="number"
            min="0"
            step="0.01"
            className="ec-input"
            defaultValue={initial.monthlyBillEuro ?? ""}
          />
        </div>
        <div>
          <label className="ec-label" htmlFor="monthlyConsumptionKwh">
            Consommation (kWh/mois)
          </label>
          <input
            id="monthlyConsumptionKwh"
            name="monthlyConsumptionKwh"
            type="number"
            min="0"
            step="1"
            className="ec-input"
            defaultValue={initial.monthlyConsumptionKwh ?? ""}
          />
          <p className="mt-1 text-xs text-[var(--muted)]">Si vous la connaissez.</p>
        </div>
        <div>
          <label className="ec-label" htmlFor="knownKwhPrice">
            Prix du kWh (€)
          </label>
          <input
            id="knownKwhPrice"
            name="knownKwhPrice"
            type="number"
            min="0"
            step="0.001"
            className="ec-input"
            defaultValue={initial.knownKwhPrice ?? ""}
          />
          <p className="mt-1 text-xs text-[var(--muted)]">Optionnel.</p>
        </div>
      </div>

      {error && (
        <p className="text-sm text-[var(--danger)] bg-red-50 border border-red-100 rounded-md px-3 py-2">
          {error}
        </p>
      )}
      {status === "saved" && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-[var(--primary-soft)] px-4 py-3">
          <p className="text-sm font-medium text-[var(--primary-hover)]">
            Votre profil a été enregistré.
          </p>
          <button
            type="button"
            onClick={() => router.push("/compteur")}
            className="ec-btn ec-btn-primary"
          >
            Étape suivante : mon compteur
          </button>
        </div>
      )}

      <button
        type="submit"
        disabled={status === "saving"}
        className="ec-btn ec-btn-primary"
      >
        {status === "saving" ? "Enregistrement…" : "Enregistrer mon profil"}
      </button>
    </form>
  );
}
