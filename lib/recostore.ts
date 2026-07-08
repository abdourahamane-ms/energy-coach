import "server-only";
import { prisma } from "@/lib/prisma";
import type { Analysis, RecoResult, RecoDetails } from "@/lib/analysis";

// Persistance des recommandations retenues (issues de l'IA ou du repli règles),
// en conservant l'ordre de priorité et la raison personnalisée dans le JSON de
// détails de calcul (pas de changement de schéma nécessaire).

export async function persistSelectedRecommendations(
  userId: string,
  list: RecoResult[],
  usedAi: boolean
) {
  await prisma.recommendationResult.deleteMany({ where: { userId } });
  for (let i = 0; i < list.length; i++) {
    const r = list[i];
    await prisma.recommendationResult.create({
      data: {
        userId,
        recommendationId: r.id,
        estimatedMonthlySavingEuro: r.monthlySaving,
        estimatedYearlySavingEuro: r.yearlySaving,
        estimatedMonthlySavingKwh: r.monthlyKwhSaving,
        calculationDetailsJson: JSON.stringify({
          ...r.details,
          __order: i,
          __reason: r.reason,
          __usedAi: usedAi,
        }),
        sourceLabel: r.sourceLabel,
      },
    });
  }
}

export type StoredRecommendations = {
  list: RecoResult[];
  usedAi: boolean;
};

// Recharge les recommandations persistées. Renvoie null si aucune (auquel cas
// l'appelant retombe sur le calcul en direct par les règles).
export async function getStoredRecommendations(
  userId: string
): Promise<StoredRecommendations | null> {
  const rows = await prisma.recommendationResult.findMany({
    where: { userId },
    include: { recommendation: { include: { source: true } } },
  });
  if (rows.length === 0) return null;

  let usedAi = false;
  const list: RecoResult[] = rows.map((row) => {
    const raw = safeParse(row.calculationDetailsJson);
    const order = typeof raw.__order === "number" ? raw.__order : 0;
    const reason = typeof raw.__reason === "string" ? raw.__reason : "";
    if (raw.__usedAi === true) usedAi = true;
    const details: RecoDetails = {
      bill: num(raw.bill),
      category: str(raw.category),
      categoryCost: num(raw.categoryCost),
      categoryShareUsed:
        typeof raw.categoryShareUsed === "number" ? raw.categoryShareUsed : null,
      coefficient: num(raw.coefficient),
      formulaType: str(raw.formulaType) || "percentageOfBill",
      monthlySaving: num(raw.monthlySaving),
    };
    const rec = row.recommendation;
    return {
      __order: order,
      key: rec.key,
      id: rec.id,
      title: rec.title,
      category: rec.category ?? details.category,
      shortDescription: rec.shortDescription,
      detailedExplanation: rec.detailedExplanation,
      effortLevel: rec.effortLevel,
      impactLevel: rec.impactLevel,
      sourceLabel: row.sourceLabel ?? rec.source?.name ?? "ADEME",
      monthlySaving: row.estimatedMonthlySavingEuro ?? details.monthlySaving,
      yearlySaving:
        row.estimatedYearlySavingEuro ??
        (row.estimatedMonthlySavingEuro ?? 0) * 12,
      monthlyKwhSaving: row.estimatedMonthlySavingKwh ?? 0,
      reason,
      details,
    } as RecoResult & { __order: number };
  });

  list.sort(
    (a, b) =>
      ((a as RecoResult & { __order: number }).__order ?? 0) -
      ((b as RecoResult & { __order: number }).__order ?? 0)
  );

  return { list, usedAi };
}

// Recommandations à afficher : la sélection persistée (IA ou repli déjà joué)
// si elle existe, sinon le calcul en direct par les règles.
export async function getEffectiveRecommendations(
  userId: string,
  analysis: Analysis
): Promise<{ list: RecoResult[]; usedAi: boolean; persisted: boolean }> {
  const stored = await getStoredRecommendations(userId);
  if (stored) {
    return { list: stored.list, usedAi: stored.usedAi, persisted: true };
  }
  return { list: analysis.recommendations, usedAi: false, persisted: false };
}

function safeParse(json: string | null): Record<string, unknown> {
  if (!json) return {};
  try {
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return {};
  }
}
const num = (v: unknown) => (typeof v === "number" ? v : 0);
const str = (v: unknown) => (typeof v === "string" ? v : "");
