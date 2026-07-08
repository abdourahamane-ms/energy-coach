"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AnalyseButton({
  label = "Actualiser mon analyse",
}: {
  label?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setNote(null);
    try {
      const res = await fetch("/api/analyse", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setNote(data.error ?? "Une erreur est survenue.");
        setLoading(false);
        return;
      }
      router.refresh();
      setTimeout(() => setLoading(false), 400);
    } catch {
      setNote("Une erreur est survenue. Veuillez réessayer.");
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button onClick={run} disabled={loading} className="ec-btn ec-btn-primary">
        {loading ? "Analyse en cours…" : label}
      </button>
      {note && <span className="text-sm text-[var(--danger)]">{note}</span>}
    </div>
  );
}
