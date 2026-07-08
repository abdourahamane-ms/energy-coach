"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DisconnectMeterButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function run() {
    setLoading(true);
    try {
      const res = await fetch("/api/compteur/deconnecter", { method: "POST" });
      if (res.ok) {
        setDone(true);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <p className="text-sm text-[var(--primary-hover)]">
        La simulation de compteur a été déconnectée.
      </p>
    );
  }

  return (
    <button onClick={run} disabled={loading} className="ec-btn ec-btn-ghost">
      {loading ? "…" : "Déconnecter la simulation de compteur"}
    </button>
  );
}
