import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { buildAnalysis } from "@/lib/analysis";
import { getEffectiveRecommendations } from "@/lib/recostore";
import { eur } from "@/lib/energy";
import PageHeader from "@/components/PageHeader";
import AddToPlanButton from "@/components/AddToPlanButton";
import AnalyseButton from "@/components/AnalyseButton";
import EstimateNote from "@/components/EstimateNote";
import NeedProfile from "@/components/NeedProfile";

const EFFORT: Record<string, string> = {
  faible: "Effort faible",
  moyen: "Effort modéré",
  eleve: "Effort important",
};
const IMPACT: Record<string, string> = {
  faible: "Impact faible",
  moyen: "Impact moyen",
  eleve: "Impact élevé",
};
const IMPACT_STYLE: Record<string, string> = {
  eleve: "bg-red-100 text-red-700",
  moyen: "bg-amber-100 text-amber-700",
  faible: "bg-green-100 text-green-700",
};

export default async function RecommandationsPage() {
  const user = await requireUser();
  const analysis = await buildAnalysis(user.id);

  if (!analysis.hasEnoughData) {
    return (
      <div>
        <PageHeader title="Recommandations" />
        <NeedProfile />
      </div>
    );
  }

  const effective = await getEffectiveRecommendations(user.id, analysis);
  const recos = effective.list.slice(0, 5);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Vos recommandations"
        subtitle={`${recos.length} actions personnalisées, classées par priorité.`}
      />

      <div className="ec-card flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[var(--muted)]">
          {effective.usedAi
            ? "Sélection personnalisée par l'assistant IA local, à partir de calculs vérifiés."
            : "Sélectionnées par le moteur d'analyse. Lancez l'analyse IA pour une personnalisation avancée."}
        </p>
        <AnalyseButton label="Actualiser avec l'IA" />
      </div>

      {recos.length === 0 && (
        <div className="ec-card text-[var(--muted)]">
          Aucune recommandation prioritaire pour le moment. Complétez vos
          appareils et habitudes pour affiner l&apos;analyse.
        </div>
      )}

      {recos.map((r, i) => (
        <div key={r.key} className="ec-card">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-start gap-3 min-w-0">
              <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-white text-sm font-bold">
                {i + 1}
              </span>
              <div className="min-w-0">
                <h3 className="font-semibold">{r.title}</h3>
                <p className="text-sm text-[var(--muted)] mt-0.5">
                  {r.shortDescription}
                </p>
                <p className="text-xs text-[var(--muted)] mt-1">
                  Pourquoi : {r.reason}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-[var(--primary)]">
                {eur(r.monthlySaving)}/mois
              </p>
              <p className="text-xs text-[var(--muted)]">
                soit {eur(r.yearlySaving)}/an
              </p>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {r.effortLevel && (
              <span className="ec-badge !bg-[var(--border)] !text-[var(--muted)]">
                {EFFORT[r.effortLevel]}
              </span>
            )}
            {r.impactLevel && (
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                  IMPACT_STYLE[r.impactLevel] ?? ""
                }`}
              >
                {IMPACT[r.impactLevel]}
              </span>
            )}
            <span className="text-xs text-[var(--muted)] ml-auto">
              Source : {r.sourceLabel}
            </span>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href={`/recommandations/${r.key}/calcul`}
              className="ec-btn ec-btn-ghost text-sm"
            >
              Voir le calcul
            </Link>
            <AddToPlanButton recommendationId={r.id} />
          </div>
        </div>
      ))}

      <div className="ec-card">
        <EstimateNote />
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href="/plan-action" className="ec-btn ec-btn-primary">
          Générer mon plan d&apos;action
        </Link>
        <Link href="/graphiques" className="ec-btn ec-btn-ghost">
          Voir les graphiques
        </Link>
      </div>
    </div>
  );
}
