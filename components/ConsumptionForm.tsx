"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ConsumptionForm({
  initialBill,
  initialKwh,
  initialPrice,
}: {
  initialBill?: number | null;
  initialKwh?: number | null;
  initialPrice?: number | null;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle"
  );
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    consumptionKwh?: number;
    costEuro?: number;
    priceUsed?: number;
  } | null>(null);

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
      monthlyBillEuro: num("monthlyBillEuro"),
      monthlyKwh: num("monthlyKwh"),
      kwhPrice: num("kwhPrice"),
      periodStart: (f.get("periodStart") as string) || undefined,
      periodEnd: (f.get("periodEnd") as string) || undefined,
    };
    try {
      const res = await fetch("/api/consommation", {
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
      setResult(data);
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
            defaultValue={initialBill ?? ""}
          />
        </div>
        <div>
          <label className="ec-label" htmlFor="monthlyKwh">
            Consommation (kWh/mois)
          </label>
          <input
            id="monthlyKwh"
            name="monthlyKwh"
            type="number"
            min="0"
            step="1"
            className="ec-input"
            defaultValue={initialKwh ?? ""}
          />
          <p className="mt-1 text-xs text-[var(--muted)]">
            Si vous ne la connaissez pas, laissez vide : nous l&apos;estimons à
            partir de votre facture.
          </p>
        </div>
        <div>
          <label className="ec-label" htmlFor="kwhPrice">
            Prix du kWh (€)
          </label>
          <input
            id="kwhPrice"
            name="kwhPrice"
            type="number"
            min="0"
            step="0.001"
            className="ec-input"
            defaultValue={initialPrice ?? ""}
          />
          <p className="mt-1 text-xs text-[var(--muted)]">
            Optionnel — un prix de référence est utilisé sinon.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="ec-label" htmlFor="periodStart">
              Période — début
            </label>
            <input id="periodStart" name="periodStart" type="date" className="ec-input" />
          </div>
          <div>
            <label className="ec-label" htmlFor="periodEnd">
              Période — fin
            </label>
            <input id="periodEnd" name="periodEnd" type="date" className="ec-input" />
          </div>
        </div>
      </div>

      {error && (
        <p className="text-sm text-[var(--danger)] bg-red-50 border border-red-100 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      {status === "saved" && result && (
        <div className="rounded-lg bg-[var(--primary-soft)] px-4 py-3 space-y-2">
          <p className="text-sm font-medium text-[var(--primary-hover)]">
            Votre consommation a été enregistrée.
          </p>
          {result.consumptionKwh != null && (
            <p className="text-sm">
              Consommation retenue : <b>{Math.round(result.consumptionKwh)} kWh/mois</b>
              {result.priceUsed
                ? ` (prix du kWh utilisé : ${result.priceUsed.toFixed(3)} €)`
                : ""}
              .
            </p>
          )}
          <button
            type="button"
            onClick={() => router.push("/appareils")}
            className="ec-btn ec-btn-primary"
          >
            Étape suivante : mes appareils
          </button>
        </div>
      )}

      <button
        type="submit"
        disabled={status === "saving"}
        className="ec-btn ec-btn-primary"
      >
        {status === "saving" ? "Enregistrement…" : "Enregistrer"}
      </button>
    </form>
  );
}
