"use client";

import { useActionState } from "react";
import { registerAction, type AuthState } from "@/app/actions/auth";

const initial: AuthState = {};

export default function RegisterForm() {
  const [state, formAction, pending] = useActionState(registerAction, initial);

  return (
    <form action={formAction} className="space-y-4">
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
        <p className="mt-1 text-xs text-[var(--muted)]">Au moins 8 caractères.</p>
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
        {pending ? "Création…" : "Créer mon compte"}
      </button>
    </form>
  );
}
