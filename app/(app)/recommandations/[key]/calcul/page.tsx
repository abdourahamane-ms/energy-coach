import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { buildAnalysis, CATEGORY_LABELS } from "@/lib/analysis";
import { getEffectiveRecommendations } from "@/lib/recostore";
import { eur } from "@/lib/energy";
import PageHeader from "@/components/PageHeader";
import EstimateNote from "@/components/EstimateNote";

export default async function CalculPage({
  params,
}: {
  params: Promise<{ key: string }>;
}) {
  const { key } = await params;
  const user = await requireUser();
  const analysis = await buildAnalysis(user.id);
  const effective = await getEffectiveRecommendations(user.id, analysis);
  const reco =
    effective.list.find((r) => r.key === key) ??
    analysis.allComputed.find((r) => r.key === key);

  if (!reco) notFound();

  const d = reco.details;
  const isBillFormula = d.formulaType === "percentageOfBill";

  const rows: { label: string; value: string }[] = [
    { label: "Votre facture mensuelle estimée", value: eur(d.bill) },
  ];
  if (!isBillFormula) {
    rows.push({
      label: `Poste concerné`,
      value: CATEGORY_LABELS[d.category] ?? d.category,
    });
    if (d.categoryShareUsed != null) {
      rows.push({
        label: "Part estimée de ce poste",
        value: `${Math.round(d.categoryShareUsed * 100)} %`,
      });
    }
    rows.push({
      label: "Montant estimé de ce poste",
      value: `${eur(d.categoryCost)} / mois`,
    });
  }
  rows.push({
    label: "Coefficient d'économie appliqué",
    value: `${Math.round(d.coefficient * 100)} %`,
  });
  rows.push({
    label: "Économie estimée",
    value: `${eur(reco.monthlySaving)} / mois`,
  });

  return (
    <div className="space-y-5">
      <PageHeader
        title={reco.title}
        subtitle="Le détail du calcul de l'économie estimée."
      />

      <div className="ec-card">
        <p className="text-[var(--foreground)]">{reco.detailedExplanation}</p>
      </div>

      <div className="ec-card">
        <h2 className="font-semibold mb-3">Comment nous estimons cette économie</h2>
        <div className="rounded-lg bg-[var(--primary-soft)]/50 px-4 py-3 text-sm font-mono">
          {isBillFormula
            ? "économie = facture × coefficient"
            : "économie = montant du poste × coefficient"}
        </div>
        <dl className="mt-4 divide-y divide-[var(--border)]">
          {rows.map((r) => (
            <div key={r.label} className="flex justify-between py-2.5 gap-4">
              <dt className="text-[var(--muted)]">{r.label}</dt>
              <dd className="font-semibold text-right">{r.value}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-sm text-[var(--muted)]">
            Source : {reco.sourceLabel}
          </span>
          <span className="text-sm text-[var(--muted)]">
            ≈ {reco.monthlyKwhSaving} kWh/mois économisés
          </span>
        </div>
        <div className="mt-4">
          <EstimateNote />
        </div>
      </div>

      <Link href="/recommandations" className="ec-btn ec-btn-ghost">
        ← Retour aux recommandations
      </Link>
    </div>
  );
}
