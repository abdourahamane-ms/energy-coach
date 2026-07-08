"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ActionItemToggle({
  id,
  title,
  description,
  savingLabel,
  recoKey,
  initialCompleted,
}: {
  id: string;
  title: string;
  description: string | null;
  savingLabel: string | null;
  recoKey: string | null;
  initialCompleted: boolean;
}) {
  const router = useRouter();
  const [completed, setCompleted] = useState(initialCompleted);
  const [saving, setSaving] = useState(false);

  async function toggle() {
    const next = !completed;
    setCompleted(next); // optimiste
    setSaving(true);
    try {
      const res = await fetch("/api/plan-action/item", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: id, isCompleted: next }),
      });
      if (!res.ok) {
        setCompleted(!next); // rollback
      } else {
        router.refresh();
      }
    } catch {
      setCompleted(!next);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className={`flex items-start gap-3 rounded-lg border px-4 py-3 transition ${
        completed
          ? "border-[var(--primary)] bg-[var(--primary-soft)]/40"
          : "border-[var(--border)]"
      }`}
    >
      <button
        onClick={toggle}
        disabled={saving}
        aria-label={completed ? "Marquer comme non fait" : "Marquer comme fait"}
        className={`mt-0.5 h-6 w-6 shrink-0 rounded-md border flex items-center justify-center text-sm ${
          completed
            ? "bg-[var(--primary)] border-[var(--primary)] text-white"
            : "border-[var(--muted)] text-transparent"
        }`}
      >
        ✓
      </button>
      <div className="min-w-0 flex-1">
        <p className={`font-medium ${completed ? "line-through text-[var(--muted)]" : ""}`}>
          {title}
        </p>
        {description && (
          <p className="text-sm text-[var(--muted)] mt-0.5">{description}</p>
        )}
        <div className="mt-1 flex items-center gap-3 text-xs">
          {savingLabel && (
            <span className="text-[var(--primary)] font-semibold">
              {savingLabel}
            </span>
          )}
          {recoKey && (
            <Link
              href={`/recommandations/${recoKey}/calcul`}
              className="text-[var(--muted)] underline"
            >
              Voir le calcul
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
