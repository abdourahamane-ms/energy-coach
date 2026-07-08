"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DemoResetButton() {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function run() {
    setState("loading");
    try {
      const res = await fetch("/api/admin/demo/reset", { method: "POST" });
      if (res.ok) {
        setState("done");
        router.refresh();
        setTimeout(() => setState("idle"), 2500);
      } else {
        setState("error");
      }
    } catch {
      setState("error");
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button onClick={run} disabled={state === "loading"} className="ec-btn ec-btn-primary">
        {state === "loading" ? "Réinitialisation…" : "Réinitialiser le compte démo"}
      </button>
      {state === "done" && (
        <span className="text-sm text-[var(--primary-hover)]">
          Compte démo réinitialisé.
        </span>
      )}
      {state === "error" && (
        <span className="text-sm text-[var(--danger)]">Une erreur est survenue.</span>
      )}
    </div>
  );
}
