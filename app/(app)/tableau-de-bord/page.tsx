import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserProgress } from "@/lib/progress";
import { buildAnalysis, CATEGORY_LABELS } from "@/lib/analysis";
import { getEffectiveRecommendations } from "@/lib/recostore";
import { eur, round2 } from "@/lib/energy";

const DONUT_COLORS = [
  "var(--g1)",
  "var(--g2)",
  "var(--g3)",
  "var(--g4)",
  "var(--g5)",
  "#6f8a7e",
  "#c2b79a",
];

export default async function DashboardPage() {
  const user = await requireUser();
  const [progress, analysis, meter, plan] = await Promise.all([
    getUserProgress(user.id),
    buildAnalysis(user.id),
    prisma.userMeterProfile.findFirst({
      where: { userId: user.id },
      include: { meterType: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.actionPlan.findFirst({
      where: { userId: user.id },
      include: { items: true },
    }),
  ]);
  const effective = await getEffectiveRecommendations(user.id, analysis);
  const totalMonthly = round2(
    effective.list.reduce((s, r) => s + r.monthlySaving, 0)
  );

  const scoreDeg = Math.round((analysis.score / 100) * 360);
  const planTotal = plan?.items.length ?? 0;
  const planDone = plan?.items.filter((i) => i.isCompleted).length ?? 0;

  // Donut de répartition (conic-gradient) à partir des postes principaux.
  const parts = analysis.breakdown.filter((b) => b.cost > 0);
  let acc = 0;
  const stops = parts
    .map((p, i) => {
      const start = acc * 100;
      acc += p.share;
      const end = acc * 100;
      return `${DONUT_COLORS[i % DONUT_COLORS.length]} ${start}% ${end}%`;
    })
    .join(", ");
  const donut = parts.length
    ? `conic-gradient(${stops})`
    : "conic-gradient(var(--border) 0 100%)";

  return (
    <div className="space-y-5">
      {/* Ligne 1 : hero + score */}
      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        {/* Hero dégradé */}
        <div
          className="rounded-[22px] p-7 text-white ec-fade"
          style={{
            background: "linear-gradient(135deg, var(--primary-2), var(--primary))",
          }}
        >
          <div className="text-sm font-semibold text-white/70">
            Bonjour {user.firstName}
          </div>
          <h1 className="text-[22px] font-extrabold tracking-tight mt-1">
            {progress.isComplete
              ? "Votre diagnostic est prêt"
              : "Complétez votre profil pour votre diagnostic"}
          </h1>
          <p className="text-white/75 text-sm mt-2 max-w-md">
            {progress.isComplete
              ? "Consultez vos recommandations et votre plan d'action pour réduire votre facture."
              : "Encore quelques informations pour obtenir un diagnostic énergétique personnalisé."}
          </p>

          <div className="mt-5">
            <div className="flex justify-between text-xs font-semibold text-white/80 mb-1.5">
              <span>Progression du profil</span>
              <span>{progress.percent} %</span>
            </div>
            <div className="h-2.5 rounded-full bg-white/15 overflow-hidden">
              <div
                className="h-full bg-[var(--accent-light)] transition-all"
                style={{ width: `${progress.percent}%` }}
              />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {progress.nextStep ? (
              <Link
                href={progress.nextStep.href}
                className="ec-btn bg-white text-[var(--primary)] hover:bg-white/90 border-0"
              >
                Continuer <ArrowRight size={16} />
              </Link>
            ) : (
              <Link
                href="/diagnostic"
                className="ec-btn bg-white text-[var(--primary)] hover:bg-white/90 border-0"
              >
                Voir mon diagnostic <ArrowRight size={16} />
              </Link>
            )}
            <Link
              href="/recommandations"
              className="ec-btn bg-white/10 text-white border border-white/20 hover:bg-white/15"
            >
              Mes recommandations
            </Link>
          </div>
        </div>

        {/* Score énergétique */}
        <div className="ec-card flex flex-col items-center justify-center text-center">
          <div className="text-sm font-bold text-[var(--muted-2)] mb-3 self-start">
            Score énergétique
          </div>
          <div
            className="relative w-[150px] h-[150px] rounded-full"
            style={{
              background: `conic-gradient(var(--primary) ${scoreDeg}deg, var(--background-alt) 0)`,
            }}
          >
            <div className="absolute inset-[14px] rounded-full bg-[var(--surface)] flex flex-col items-center justify-center">
              <span className="text-[34px] font-extrabold leading-none">
                {analysis.score}
              </span>
              <span className="text-xs text-[var(--muted-2)] font-semibold">
                / 100
              </span>
            </div>
          </div>
          <p className="text-sm text-[var(--muted)] mt-3">
            Peut être amélioré →{" "}
            <span className="font-bold text-[var(--primary)]">
              {analysis.scoreAfter}
            </span>{" "}
            après actions
          </p>
        </div>
      </div>

      {/* Ligne 2 : stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Facture estimée" value={`${eur(analysis.bill)}`} sub="/mois" />
        <StatCard
          label="Économie estimée"
          value={`${eur(totalMonthly)}`}
          sub="/mois"
          sand
        />
        <StatCard
          label="Type de compteur"
          value={meter?.meterType.name ?? "—"}
        />
        <StatCard
          label="Plan d'action"
          value={planTotal ? `${planDone}/${planTotal}` : "—"}
          sub={planTotal ? "actions" : ""}
        />
      </div>

      {/* Ligne 3 : priorités + répartition */}
      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div className="ec-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-extrabold tracking-tight">Priorités cette semaine</h2>
            <Link
              href="/recommandations"
              className="text-sm font-semibold text-[var(--primary)]"
            >
              Tout voir →
            </Link>
          </div>
          {effective.list.length ? (
            <div className="space-y-2.5">
              {effective.list.slice(0, 3).map((r, i) => (
                <div
                  key={r.key}
                  className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] px-4 py-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="shrink-0 w-7 h-7 rounded-full bg-[var(--primary-soft)] text-[var(--primary)] text-sm font-bold flex items-center justify-center">
                      {i + 1}
                    </span>
                    <span className="font-semibold truncate">{r.title}</span>
                  </div>
                  <span className="text-[var(--primary)] font-bold whitespace-nowrap">
                    {eur(r.monthlySaving)}/mois
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--muted)]">
              Complétez votre profil pour obtenir vos priorités personnalisées.
            </p>
          )}
        </div>

        <div className="ec-card">
          <h2 className="font-extrabold tracking-tight mb-4">Répartition estimée</h2>
          <div className="flex items-center gap-5">
            <div
              className="relative w-[120px] h-[120px] rounded-full shrink-0"
              style={{ background: donut }}
            >
              <div className="absolute inset-[22px] rounded-full bg-[var(--surface)]" />
            </div>
            <ul className="space-y-1.5 text-sm min-w-0">
              {parts.slice(0, 5).map((p, i) => (
                <li key={p.category} className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-sm shrink-0"
                    style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }}
                  />
                  <span className="truncate">{CATEGORY_LABELS[p.category]}</span>
                  <span className="text-[var(--muted-2)] ml-auto">
                    {Math.round(p.share * 100)}%
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  sand,
}: {
  label: string;
  value: string;
  sub?: string;
  sand?: boolean;
}) {
  return (
    <div className={`ec-card ${sand ? "!bg-[var(--sand-bg)]" : ""}`}>
      <div
        className={`text-xs font-bold ${
          sand ? "text-[var(--sand-text)]" : "text-[var(--muted-2)]"
        }`}
      >
        {label}
      </div>
      <div
        className={`text-[26px] font-extrabold tracking-tight mt-1 ${
          sand ? "text-[var(--sand-text)]" : ""
        }`}
      >
        {value}
        {sub && <span className="text-[13px] font-semibold opacity-70"> {sub}</span>}
      </div>
    </div>
  );
}
