"use client";

import { useActionState } from "react";
import { loginAction, type AuthState } from "@/app/actions/auth";

const initial: AuthState = {};

export default function LoginForm({ suite }: { suite?: string }) {
  const [state, formAction, pending] = useActionState(loginAction, initial);

  return (
    <form action={formAction} className="space-y-4">
      {suite && <input type="hidden" name="suite" value={suite} />}
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
      {state.error && (
        <p className="text-sm text-[var(--danger)] bg-red-50 border border-red-100 rounded-md px-3 py-2">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="ec-btn ec-btn-primary w-full"
      >
        {pending ? "Connexion…" : "Se connecter"}
      </button>
    </form>
  );
}
