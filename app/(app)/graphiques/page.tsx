import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildAnalysis } from "@/lib/analysis";
import { getEffectiveRecommendations } from "@/lib/recostore";
import { eur, round2 } from "@/lib/energy";
import PageHeader from "@/components/PageHeader";
import {
  BreakdownPie,
  BreakdownLegend,
  BeforeAfterBar,
  SavingsBar,
} from "@/components/Charts";
import EstimateNote from "@/components/EstimateNote";
import NeedProfile from "@/components/NeedProfile";

export default async function GraphiquesPage() {
  const user = await requireUser();
  const analysis = await buildAnalysis(user.id);

  if (!analysis.hasEnoughData) {
    return (
      <div>
        <PageHeader title="Graphiques" />
        <NeedProfile />
      </div>
    );
  }

  const effective = await getEffectiveRecommendations(user.id, analysis);
  const totalMonthly = round2(
    effective.list.reduce((s, r) => s + r.monthlySaving, 0)
  );
  const billAfter = round2(Math.max(0, analysis.bill - totalMonthly));

  const plan = await prisma.actionPlan.findFirst({
    where: { userId: user.id },
    include: { items: true },
  });
  const totalItems = plan?.items.length ?? 0;
  const doneItems = plan?.items.filter((i) => i.isCompleted).length ?? 0;
  const planPercent = totalItems ? Math.round((doneItems / totalItems) * 100) : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Graphiques"
        subtitle="Vos données en un coup d'œil."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Répartition */}
        <div className="ec-card">
          <h2 className="font-semibold">Répartition estimée de votre consommation</h2>
          <p className="text-sm text-[var(--muted)] mt-1 mb-3">
            Où part probablement votre énergie, par poste.
          </p>
          <div className="grid sm:grid-cols-2 gap-4 items-center">
            <BreakdownPie data={analysis.breakdown} />
            <BreakdownLegend data={analysis.breakdown} />
          </div>
        </div>

        {/* Avant / après */}
        <div className="ec-card">
          <h2 className="font-semibold">Facture actuelle vs après actions</h2>
          <p className="text-sm text-[var(--muted)] mt-1 mb-3">
            L&apos;effet estimé de vos recommandations sur la facture mensuelle.
          </p>
          <BeforeAfterBar before={analysis.bill} after={billAfter} />
        </div>

        {/* Économies par action */}
        <div className="ec-card">
          <h2 className="font-semibold">Économies mensuelles estimées</h2>
          <p className="text-sm text-[var(--muted)] mt-1 mb-3">
            Le gain estimé de chaque action, du plus élevé au plus faible.
          </p>
          {effective.list.length > 0 ? (
            <SavingsBar
              data={effective.list.map((r) => ({
                title: r.title,
                saving: r.monthlySaving,
              }))}
            />
          ) : (
            <p className="text-sm text-[var(--muted)]">
              Aucune action estimée pour le moment.
            </p>
          )}
        </div>

        {/* Progression plan */}
        <div className="ec-card">
          <h2 className="font-semibold">Progression de votre plan d&apos;action</h2>
          <p className="text-sm text-[var(--muted)] mt-1 mb-3">
            Votre avancement sur les 30 jours.
          </p>
          {totalItems > 0 ? (
            <>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm">
                  {doneItems} / {totalItems} actions réalisées
                </span>
                <span className="font-semibold text-[var(--primary)]">
                  {planPercent}%
                </span>
              </div>
              <div className="h-3 w-full rounded-full bg-[var(--primary-soft)] overflow-hidden">
                <div
                  className="h-full bg-[var(--primary)]"
                  style={{ width: `${planPercent}%` }}
                />
              </div>
              <p className="text-sm text-[var(--muted)] mt-3">
                Économie estimée du plan : {eur(totalMonthly)}/mois.
              </p>
            </>
          ) : (
            <p className="text-sm text-[var(--muted)]">
              Générez votre plan d&apos;action pour suivre votre progression.
            </p>
          )}
        </div>
      </div>

      <div className="ec-card">
        <EstimateNote />
      </div>
    </div>
  );
}
