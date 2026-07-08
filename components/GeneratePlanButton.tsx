"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function GeneratePlanButton({
  label = "Générer mon plan d'action",
}: {
  label?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/plan-action/generer", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Une erreur est survenue.");
        setLoading(false);
        return;
      }
      router.refresh();
      setTimeout(() => setLoading(false), 400);
    } catch {
      setError("Une erreur est survenue. Veuillez réessayer.");
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button onClick={run} disabled={loading} className="ec-btn ec-btn-primary">
        {loading ? "Génération…" : label}
      </button>
      {error && <span className="text-sm text-[var(--danger)]">{error}</span>}
    </div>
  );
}
