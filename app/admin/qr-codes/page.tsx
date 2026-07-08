import Image from "next/image";
import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/PageHeader";

export default async function AdminQrCodesPage() {
  const profiles = await prisma.demoProfile.findMany({
    where: { qrCodePath: { not: null } },
    orderBy: { name: "asc" },
  });

  const items = profiles.map((p) => {
    let type = "—";
    let meterId = "—";
    try {
      const u = new URL(p.qrPayload ?? "");
      type = u.searchParams.get("type") ?? "—";
      meterId = u.searchParams.get("meterId") ?? "—";
    } catch {}
    return { ...p, type, meterId };
  });

  return (
    <div>
      <PageHeader
        title="QR codes démo"
        subtitle="Les QR codes de démonstration sont des fichiers fixes du projet. Ils ne sont pas générés dynamiquement."
      />

      <div className="ec-card mb-5 bg-[var(--primary-soft)]/40 text-sm">
        Ces QR codes sont stockés dans <code>/public/qrcodes/</code> et liés aux
        profils démo. L&apos;administration permet uniquement de les consulter,
        pas d&apos;en générer.
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((q) => (
          <div key={q.id} className="ec-card">
            <div className="rounded-lg border border-[var(--border)] bg-white p-3">
              <Image
                src={q.qrCodePath!}
                alt={q.name}
                width={200}
                height={200}
                className="mx-auto h-auto w-full max-w-[200px]"
              />
            </div>
            <h3 className="mt-3 font-semibold">{q.name}</h3>
            <dl className="mt-2 text-sm space-y-1">
              <div className="flex justify-between">
                <dt className="text-[var(--muted)]">Type de compteur</dt>
                <dd className="font-medium">{q.type}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[var(--muted)]">Identifiant</dt>
                <dd className="font-medium">{q.meterId}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[var(--muted)]">Fichier</dt>
                <dd className="font-medium truncate max-w-[10rem]" title={q.qrCodePath ?? ""}>
                  {q.qrCodePath}
                </dd>
              </div>
            </dl>
            <p className="mt-2 text-xs font-mono break-all bg-[var(--background)] rounded p-2">
              {q.qrPayload}
            </p>
            <div className="mt-3 flex gap-2">
              <a
                href={q.qrCodePath!}
                target="_blank"
                rel="noreferrer"
                className="ec-btn ec-btn-ghost text-sm"
              >
                Afficher
              </a>
              <a
                href={q.qrCodePath!}
                download
                className="ec-btn ec-btn-ghost text-sm"
              >
                Télécharger
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
