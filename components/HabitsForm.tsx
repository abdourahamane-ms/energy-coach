"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Habit = { id: string; question: string };

const OPTIONS = [
  { value: "jamais", label: "Jamais" },
  { value: "rarement", label: "Rarement" },
  { value: "parfois", label: "Parfois" },
  { value: "souvent", label: "Souvent" },
  { value: "tres_souvent", label: "Très souvent" },
];

export default function HabitsForm({
  habits,
  initialAnswers,
}: {
  habits: Habit[];
  initialAnswers: Record<string, string>;
}) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, string>>(initialAnswers);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle"
  );
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setStatus("saving");
    setError(null);
    const payload = {
      answers: Object.entries(answers).map(([habitId, answerValue]) => ({
        habitId,
        answerValue,
      })),
    };
    try {
      const res = await fetch("/api/habitudes", {
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
    <div className="space-y-4">
      {habits.map((h, i) => (
        <div key={h.id} className="ec-card">
          <p className="font-medium mb-3">
            <span className="text-[var(--muted)] mr-2">{i + 1}.</span>
            {h.question}
          </p>
          <div className="flex flex-wrap gap-2">
            {OPTIONS.map((o) => {
              const active = answers[h.id] === o.value;
              return (
                <button
                  key={o.value}
                  onClick={() => {
                    setAnswers((prev) => ({ ...prev, [h.id]: o.value }));
                    setStatus("idle");
                  }}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition ${
                    active
                      ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                      : "border-[var(--border)] text-[var(--muted)] hover:bg-[var(--primary-soft)]"
                  }`}
                >
                  {o.label}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <div className="sticky bottom-16 md:bottom-4 z-10">
        <div className="ec-card flex flex-wrap items-center justify-between gap-3 shadow-md">
          <span className="text-sm text-[var(--muted)]">
            {Object.keys(answers).length} / {habits.length} réponses
          </span>
          <div className="flex items-center gap-3">
            {error && <span className="text-sm text-[var(--danger)]">{error}</span>}
            {status === "saved" && (
              <button
                onClick={() => router.push("/diagnostic")}
                className="ec-btn ec-btn-ghost"
              >
                Voir mon diagnostic →
              </button>
            )}
            <button
              onClick={save}
              disabled={status === "saving"}
              className="ec-btn ec-btn-primary"
            >
              {status === "saving"
                ? "Enregistrement…"
                : status === "saved"
                  ? "Enregistré ✓"
                  : "Enregistrer mes réponses"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
