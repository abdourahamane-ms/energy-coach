"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Source = {
  id: string;
  name: string;
  organization: string | null;
  url: string | null;
  description: string | null;
  isActive: boolean;
};

const empty = {
  id: undefined as string | undefined,
  name: "",
  organization: "",
  url: "",
  description: "",
  isActive: true,
};

export default function SourceManager({ sources }: { sources: Source[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<typeof empty | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (!editing) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editing.id,
          name: editing.name,
          organization: editing.organization || undefined,
          url: editing.url || undefined,
          description: editing.description || undefined,
          isActive: editing.isActive,
        }),
      });
      const json = await res.json();
      if (!res.ok) setError(json.error ?? "Erreur.");
      else {
        setEditing(null);
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setEditing({ ...empty })} className="ec-btn ec-btn-primary">
          + Nouvelle source
        </button>
      </div>

      {editing && (
        <div className="ec-card border-[var(--primary)] space-y-3">
          <h3 className="font-semibold">
            {editing.id ? "Modifier la source" : "Nouvelle source"}
          </h3>
          <label className="block">
            <span className="ec-label">Nom</span>
            <input className="ec-input" value={editing.name}
              onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
          </label>
          <label className="block">
            <span className="ec-label">Organisme</span>
            <input className="ec-input" value={editing.organization}
              onChange={(e) => setEditing({ ...editing, organization: e.target.value })} />
          </label>
          <label className="block">
            <span className="ec-label">URL</span>
            <input className="ec-input" value={editing.url}
              onChange={(e) => setEditing({ ...editing, url: e.target.value })} />
          </label>
          <label className="block">
            <span className="ec-label">Description</span>
            <input className="ec-input" value={editing.description}
              onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
          </label>
          {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
          <div className="flex gap-2">
            <button onClick={save} disabled={busy} className="ec-btn ec-btn-primary">
              {busy ? "…" : "Enregistrer"}
            </button>
            <button onClick={() => setEditing(null)} className="ec-btn ec-btn-ghost">
              Annuler
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {sources.map((s) => (
          <div key={s.id} className="ec-card">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold">{s.name}</h3>
                {s.organization && (
                  <p className="text-sm text-[var(--muted)]">{s.organization}</p>
                )}
              </div>
              <button
                onClick={() =>
                  setEditing({
                    id: s.id,
                    name: s.name,
                    organization: s.organization ?? "",
                    url: s.url ?? "",
                    description: s.description ?? "",
                    isActive: s.isActive,
                  })
                }
                className="text-[var(--primary)] text-sm font-medium"
              >
                Modifier
              </button>
            </div>
            {s.url && (
              <p className="text-xs text-[var(--muted)] mt-1 truncate">{s.url}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
