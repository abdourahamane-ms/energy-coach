"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RegisterForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const payload = {
      firstName: String(form.get("firstName") ?? ""),
      lastName: String(form.get("lastName") ?? ""),
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
    };
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Une erreur est survenue.");
        setLoading(false);
        return;
      }
      router.push("/tableau-de-bord");
      router.refresh();
    } catch {
      setError("Une erreur est survenue. Veuillez réessayer.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="ec-label" htmlFor="firstName">
            Prénom
          </label>
          <input id="firstName" name="firstName" className="ec-input" required />
        </div>
        <div>
          <label className="ec-label" htmlFor="lastName">
            Nom
          </label>
          <input id="lastName" name="lastName" className="ec-input" required />
        </div>
      </div>
      <div>
        <label className="ec-label" htmlFor="email">
          Adresse email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          className="ec-input"
          autoComplete="email"
          required
        />
      </div>
      <div>
        <label className="ec-label" htmlFor="password">
          Mot de passe
        </label>
        <input
          id="password"
          name="password"
          type="password"
          className="ec-input"
          autoComplete="new-password"
          minLength={8}
          required
        />
        <p className="mt-1 text-xs text-[var(--muted)]">
          Au moins 8 caractères.
        </p>
      </div>
      {error && (
        <p className="text-sm text-[var(--danger)] bg-red-50 border border-red-100 rounded-md px-3 py-2">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="ec-btn ec-btn-primary w-full"
      >
        {loading ? "Création…" : "Créer mon compte"}
      </button>
    </form>
  );
}
