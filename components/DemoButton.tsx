"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DemoButton({
  className = "ec-btn ec-btn-ghost",
  label = "Tester le mode démo",
}: {
  className?: string;
  label?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startDemo() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/demo", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Impossible de démarrer le mode démo.");
        setLoading(false);
        return;
      }
      router.push("/tableau-de-bord");
      router.refresh();
    } catch {
      setError("Impossible de démarrer le mode démo. Veuillez réessayer.");
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button onClick={startDemo} disabled={loading} className={className}>
        {loading ? "Préparation…" : label}
      </button>
      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
    </div>
  );
}
