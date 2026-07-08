"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const payload = {
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
    };
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Email ou mot de passe incorrect.");
        setLoading(false);
        return;
      }
      const suite = params.get("suite");
      const dest =
        data.role === "ADMIN" ? "/admin" : suite || "/tableau-de-bord";
      router.push(dest);
      router.refresh();
    } catch {
      setError("Une erreur est survenue. Veuillez réessayer.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
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
          autoComplete="current-password"
          required
        />
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
        {loading ? "Connexion…" : "Se connecter"}
      </button>
    </form>
  );
}
