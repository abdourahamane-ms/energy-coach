import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildAnalysis } from "@/lib/analysis";
import { getEffectiveRecommendations } from "@/lib/recostore";
import { eur, kwh, round2 } from "@/lib/energy";
import PageHeader from "@/components/PageHeader";
import ScoreGauge from "@/components/ScoreGauge";
import { BeforeAfterBar } from "@/components/Charts";
import AnalyseButton from "@/components/AnalyseButton";
import EstimateNote from "@/components/EstimateNote";
import NeedProfile from "@/components/NeedProfile";

export default async function DiagnosticPage() {
  const user = await requireUser();
  const analysis = await buildAnalysis(user.id);
  const ai = await prisma.aiAnalysis.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  if (!analysis.hasEnoughData) {
    return (
      <div>
        <PageHeader title="Diagnostic énergétique" />
        <NeedProfile />
      </div>
    );
  }

  const effective = await getEffectiveRecommendations(user.id, analysis);
  const priorities = effective.list.slice(0, 3);
  const totalMonthly = round2(
    effective.list.reduce((s, r) => s + r.monthlySaving, 0)
  );
  const totalYearly = round2(totalMonthly * 12);
  const billAfter = round2(Math.max(0, analysis.bill - totalMonthly));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Diagnostic énergétique"
        subtitle="Votre situation énergétique et vos priorités."
      />

      {/* Résumé / coaching */}
      <div className="ec-card">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <h2 className="font-semibold">Votre situation</h2>
          <AnalyseButton />
        </div>
        <p className="mt-3 whitespace-pre-line text-[var(--foreground)]">
          {ai?.explanation ?? analysis.summary}
        </p>
        {ai?.usedFallback && (
          <p className="mt-2 text-xs text-[var(--muted)]">
            L&apos;analyse personnalisée avancée n&apos;est pas disponible pour le
            moment. Vos recommandations principales restent accessibles.
          </p>
        )}
      </div>

      {/* KPIs + score */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="ec-card">
          <p className="text-sm text-[var(--muted)]">Facture mensuelle estimée</p>
          <p className="text-2xl font-bold mt-1">{eur(analysis.bill)}</p>
          <p className="text-sm text-[var(--muted)] mt-1">
            ≈ {kwh(analysis.consumptionKwh)} / mois
          </p>
        </div>
        <div className="ec-card">
          <p className="text-sm text-[var(--muted)]">Économie estimée</p>
          <p className="text-2xl font-bold mt-1 text-[var(--primary)]">
            {eur(totalMonthly)}/mois
          </p>
          <p className="text-sm text-[var(--muted)] mt-1">
            soit {eur(totalYearly)} par an
          </p>
        </div>
        <div className="ec-card">
          <ScoreGauge score={analysis.score} scoreAfter={analysis.scoreAfter} />
        </div>
      </div>

      {/* Priorités */}
      <div className="ec-card">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Vos 3 priorités</h2>
          <Link href="/recommandations" className="text-sm text-[var(--primary)] font-medium">
            Voir toutes les recommandations →
          </Link>
        </div>
        <div className="mt-4 space-y-3">
          {priorities.map((r, i) => (
            <div
              key={r.key}
              className="flex items-center justify-between gap-3 rounded-lg border border-[var(--border)] px-4 py-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-white text-sm font-bold">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <p className="font-medium truncate">{r.title}</p>
                  <p className="text-xs text-[var(--muted)] truncate">{r.reason}</p>
                </div>
              </div>
              <span className="text-[var(--primary)] font-semibold whitespace-nowrap">
                {eur(r.monthlySaving)}/mois
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Avant / après */}
      <div className="ec-card">
        <h2 className="font-semibold mb-2">Estimation avant / après</h2>
        <BeforeAfterBar before={analysis.bill} after={billAfter} />
        <p className="text-sm text-[var(--muted)] mt-2">
          En appliquant les actions recommandées, votre facture pourrait passer
          d&apos;environ {eur(analysis.bill)} à {eur(billAfter)} par mois.
        </p>
        <div className="mt-4">
          <EstimateNote />
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href="/recommandations" className="ec-btn ec-btn-primary">
          Voir mes recommandations
        </Link>
        <Link href="/graphiques" className="ec-btn ec-btn-ghost">
          Voir les graphiques
        </Link>
        <Link href="/plan-action" className="ec-btn ec-btn-ghost">
          Mon plan d&apos;action
        </Link>
      </div>
    </div>
  );
}
