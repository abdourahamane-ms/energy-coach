import "server-only";
import { prisma } from "@/lib/prisma";
import { buildAnalysis, type RecoResult } from "@/lib/analysis";
import { getStoredRecommendations } from "@/lib/recostore";

// Range une recommandation dans une des 4 semaines du plan.
function weekForReco(r: RecoResult): number {
  if (["veille", "eclairage"].includes(r.category)) return 1;
  if (["electromenager", "multimedia"].includes(r.category)) return 2;
  if (["chauffage", "climatisation", "eau_chaude"].includes(r.category)) return 3;
  return 1;
}

// Génère (ou régénère) le plan d'action 30 jours à partir des recommandations
// retenues (sélection IA persistée si présente, sinon moteur de règles).
export async function generateActionPlan(userId: string) {
  const analysis = await buildAnalysis(userId);
  const stored = await getStoredRecommendations(userId);
  const recommendations = stored?.list ?? analysis.recommendations;

  // On conserve les actions déjà cochées pour ne pas perdre la progression.
  const previousDone = new Map<string, boolean>();
  const existing = await prisma.actionPlan.findFirst({
    where: { userId },
    include: { items: true },
  });
  if (existing) {
    for (const it of existing.items) {
      if (it.recommendationId) previousDone.set(it.recommendationId, it.isCompleted);
    }
    await prisma.actionPlan.deleteMany({ where: { userId } });
  }

  const plan = await prisma.actionPlan.create({
    data: {
      userId,
      title: "Plan d'action 30 jours",
      durationDays: 30,
    },
  });

  // Actions issues des recommandations
  for (const r of recommendations) {
    await prisma.actionItem.create({
      data: {
        actionPlanId: plan.id,
        recommendationId: r.id,
        title: r.title,
        description: r.shortDescription ?? r.reason,
        weekNumber: weekForReco(r),
        estimatedMonthlySavingEuro: r.monthlySaving,
        isCompleted: previousDone.get(r.id) ?? false,
      },
    });
  }

  // Semaine 4 : mesure et ajustement (actions fixes de suivi)
  const week4 = [
    {
      title: "Comparer votre estimation",
      description:
        "Comparez votre facture réelle à l'estimation avant / après du diagnostic.",
    },
    {
      title: "Vérifier les actions réalisées",
      description: "Faites le point sur les actions cochées et celles à poursuivre.",
    },
    {
      title: "Ajuster vos habitudes",
      description:
        "Conservez les gestes qui fonctionnent et ajustez ceux qui sont difficiles à tenir.",
    },
  ];
  for (const w of week4) {
    await prisma.actionItem.create({
      data: {
        actionPlanId: plan.id,
        title: w.title,
        description: w.description,
        weekNumber: 4,
        isCompleted: false,
      },
    });
  }

  return plan.id;
}
