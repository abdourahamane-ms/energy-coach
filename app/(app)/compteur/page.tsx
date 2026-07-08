import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/PageHeader";
import MeterChooser from "@/components/MeterChooser";

export default async function CompteurPage() {
  const user = await requireUser();
  const [meterTypes, current] = await Promise.all([
    prisma.meterType.findMany({ orderBy: { name: "asc" } }),
    prisma.userMeterProfile.findFirst({
      where: { userId: user.id },
      include: { meterType: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div>
      <PageHeader
        title="Mon compteur"
        subtitle="Choisissez votre type de compteur. Nous n'accédons jamais à un vrai compteur sans votre consentement explicite."
      />
      {current && (
        <div className="ec-card mb-5 flex items-center gap-3">
          <span className="ec-badge">Compteur actuel</span>
          <span className="font-medium">{current.label ?? current.meterType.name}</span>
          {current.isConnectedDemo && (
            <span className="text-xs text-[var(--muted)]">
              (simulation active)
            </span>
          )}
        </div>
      )}
      <MeterChooser
        meterTypes={meterTypes}
        currentSlug={current?.meterType.slug ?? null}
      />
    </div>
  );
}
