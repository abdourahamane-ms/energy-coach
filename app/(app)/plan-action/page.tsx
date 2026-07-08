import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { eur } from "@/lib/energy";
import PageHeader from "@/components/PageHeader";
import GeneratePlanButton from "@/components/GeneratePlanButton";
import ActionItemToggle from "@/components/ActionItemToggle";
import EstimateNote from "@/components/EstimateNote";

const WEEK_TITLES: Record<number, string> = {
  1: "Semaine 1 · Actions faciles",
  2: "Semaine 2 · Appareils",
  3: "Semaine 3 · Chauffage & climatisation",
  4: "Semaine 4 · Mesure et ajustement",
};

export default async function PlanActionPage() {
  const user = await requireUser();
  const plan = await prisma.actionPlan.findFirst({
    where: { userId: user.id },
    include: {
      items: {
        include: { recommendation: true },
        orderBy: [{ weekNumber: "asc" }, { estimatedMonthlySavingEuro: "desc" }],
      },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!plan || plan.items.length === 0) {
    return (
      <div>
        <PageHeader
          title="Plan d'action 30 jours"
          subtitle="Un plan concret, semaine par semaine, généré à partir de vos recommandations."
        />
        <div className="ec-card text-center py-10">
          <div className="text-4xl">🎯</div>
          <p className="mt-3 text-[var(--muted)] max-w-md mx-auto">
            Vous n&apos;avez pas encore de plan d&apos;action. Générez-le à partir
            de vos recommandations personnalisées.
          </p>
          <div className="mt-5 flex justify-center">
            <GeneratePlanButton />
          </div>
        </div>
      </div>
    );
  }

  const total = plan.items.length;
  const done = plan.items.filter((i) => i.isCompleted).length;
  const percent = Math.round((done / total) * 100);
  const estimatedSaving = plan.items.reduce(
    (s, i) => s + (i.estimatedMonthlySavingEuro ?? 0),
    0
  );

  const weeks = [1, 2, 3, 4];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Plan d'action 30 jours"
        subtitle="Cochez les actions au fur et à mesure. Votre progression est enregistrée."
      />

      {/* Progression */}
      <div className="ec-card">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="font-semibold">
              {done} / {total} actions réalisées
            </p>
            <p className="text-sm text-[var(--muted)]">
              Économie estimée du plan : {eur(estimatedSaving)}/mois
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-[var(--primary)]">
              {percent}%
            </span>
            <GeneratePlanButton label="Régénérer" />
          </div>
        </div>
        <div className="mt-3 h-3 w-full rounded-full bg-[var(--primary-soft)] overflow-hidden">
          <div
            className="h-full bg-[var(--primary)] transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* Semaines */}
      {weeks.map((w) => {
        const items = plan.items.filter((i) => i.weekNumber === w);
        if (items.length === 0) return null;
        return (
          <div key={w} className="ec-card">
            <h2 className="font-semibold mb-3">{WEEK_TITLES[w]}</h2>
            <div className="space-y-2">
              {items.map((it) => (
                <ActionItemToggle
                  key={it.id}
                  id={it.id}
                  title={it.title}
                  description={it.description}
                  savingLabel={
                    it.estimatedMonthlySavingEuro
                      ? `${eur(it.estimatedMonthlySavingEuro)}/mois`
                      : null
                  }
                  recoKey={it.recommendation?.key ?? null}
                  initialCompleted={it.isCompleted}
                />
              ))}
            </div>
          </div>
        );
      })}

      <div className="ec-card">
        <EstimateNote />
      </div>
    </div>
  );
}
