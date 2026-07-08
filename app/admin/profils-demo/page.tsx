import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/PageHeader";
import DemoResetButton from "@/components/admin/DemoResetButton";

export default async function AdminDemoProfilesPage() {
  const profiles = await prisma.demoProfile.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="space-y-5">
      <PageHeader
        title="Profils démo"
        subtitle="Les profils fictifs utilisés pour la démonstration et les QR codes."
      />

      <div className="ec-card flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-semibold">Compte de démonstration</p>
          <p className="text-sm text-[var(--muted)]">
            Réinitialise les données du compte démo à partir du profil principal.
          </p>
        </div>
        <DemoResetButton />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {profiles.map((p) => {
          const housing = safe(p.housingDataJson);
          const meter = safe(p.meterDataJson);
          return (
            <div key={p.id} className="ec-card">
              <h3 className="font-semibold">{p.name}</h3>
              <p className="text-sm text-[var(--muted)] mt-1">{p.description}</p>
              <dl className="mt-3 text-sm space-y-1">
                <Line k="Logement" v={housing?.housingType} />
                <Line k="Surface" v={housing?.surfaceM2 ? `${housing.surfaceM2} m²` : undefined} />
                <Line k="Occupants" v={housing?.occupants} />
                <Line k="Facture" v={housing?.monthlyBillEuro ? `${housing.monthlyBillEuro} €` : undefined} />
                <Line k="Compteur" v={meter?.label} />
                <Line k="Identifiant" v={meter?.demoMeterIdentifier} />
              </dl>
            </div>
          );
        })}
      </div>
    </div>
  );
}

type DemoData = Record<string, string | number | boolean | null | undefined>;

function safe(json: string | null): DemoData | null {
  if (!json) return null;
  try {
    return JSON.parse(json) as DemoData;
  } catch {
    return null;
  }
}

function Line({ k, v }: { k: string; v?: string | number | boolean | null }) {
  if (v === undefined || v === null || v === "") return null;
  return (
    <div className="flex justify-between">
      <dt className="text-[var(--muted)]">{k}</dt>
      <dd className="font-medium">{String(v)}</dd>
    </div>
  );
}
