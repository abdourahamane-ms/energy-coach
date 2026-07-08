"use client";

import { useState } from "react";

export default function AddToPlanButton({
  recommendationId,
}: {
  recommendationId: string;
}) {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">(
    "idle"
  );

  async function add() {
    setState("loading");
    try {
      const res = await fetch("/api/plan-action/ajouter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recommendationId }),
      });
      if (!res.ok) {
        setState("error");
        return;
      }
      setState("done");
    } catch {
      setState("error");
    }
  }

  return (
    <button
      onClick={add}
      disabled={state === "loading" || state === "done"}
      className="ec-btn ec-btn-ghost text-sm"
    >
      {state === "done"
        ? "Ajouté au plan ✓"
        : state === "loading"
          ? "Ajout…"
          : state === "error"
            ? "Réessayer"
            : "Ajouter au plan d'action"}
    </button>
  );
}
