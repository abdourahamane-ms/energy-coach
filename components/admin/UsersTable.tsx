"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Row = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  profileComplete: boolean;
  meter: string | null;
  isActive: boolean;
};

export default function UsersTable({ rows }: { rows: Row[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function patch(id: string, data: Record<string, unknown>) {
    setBusy(id);
    setError(null);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...data }),
      });
      const json = await res.json();
      if (!res.ok) setError(json.error ?? "Erreur.");
      else router.refresh();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="ec-card overflow-x-auto">
      {error && <p className="text-sm text-[var(--danger)] mb-3">{error}</p>}
      <table className="w-full text-sm min-w-[720px]">
        <thead>
          <tr className="text-left text-[var(--muted)] border-b border-[var(--border)]">
            <th className="py-2 pr-3">Nom</th>
            <th className="py-2 pr-3">Email</th>
            <th className="py-2 pr-3">Rôle</th>
            <th className="py-2 pr-3">Profil</th>
            <th className="py-2 pr-3">Compteur</th>
            <th className="py-2 pr-3">Statut</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((u) => (
            <tr key={u.id} className="border-b border-[var(--border)] last:border-0">
              <td className="py-2 pr-3 font-medium">{u.name}</td>
              <td className="py-2 pr-3 text-[var(--muted)]">{u.email}</td>
              <td className="py-2 pr-3">
                <select
                  className="ec-select !py-1 !text-xs"
                  value={u.role}
                  disabled={busy === u.id}
                  onChange={(e) => patch(u.id, { role: e.target.value })}
                >
                  <option value="USER">Utilisateur</option>
                  <option value="ADMIN">Administrateur</option>
                  <option value="DEMO_USER">Démo</option>
                </select>
              </td>
              <td className="py-2 pr-3">
                {u.profileComplete ? (
                  <span className="text-[var(--primary)]">Complété</span>
                ) : (
                  <span className="text-[var(--muted)]">Incomplet</span>
                )}
              </td>
              <td className="py-2 pr-3 text-[var(--muted)]">{u.meter ?? "—"}</td>
              <td className="py-2 pr-3">
                <button
                  onClick={() => patch(u.id, { isActive: !u.isActive })}
                  disabled={busy === u.id}
                  className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    u.isActive
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {u.isActive ? "Actif" : "Désactivé"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
