import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { buildAnalysis } from "@/lib/analysis";

const schema = z.object({ recommendationId: z.string().min(1) });

function weekForCategory(cat: string): number {
  if (["veille", "eclairage"].includes(cat)) return 1;
  if (["electromenager", "multimedia"].includes(cat)) return 2;
  if (["chauffage", "climatisation", "eau_chaude"].includes(cat)) return 3;
  return 1;
}

// Ajoute une recommandation précise au plan d'action (le crée si besoin).
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides." }, { status: 400 });
  }

  try {
    const analysis = await buildAnalysis(user.id);
    const reco = analysis.allComputed.find(
      (r) => r.id === parsed.data.recommendationId
    );
    if (!reco) {
      return NextResponse.json(
        { error: "Cette recommandation n'est pas applicable à votre profil." },
        { status: 400 }
      );
    }

    let plan = await prisma.actionPlan.findFirst({ where: { userId: user.id } });
    if (!plan) {
      plan = await prisma.actionPlan.create({
        data: { userId: user.id, title: "Plan d'action 30 jours", durationDays: 30 },
      });
    }

    const existing = await prisma.actionItem.findFirst({
      where: { actionPlanId: plan.id, recommendationId: reco.id },
    });
    if (existing) {
      return NextResponse.json({ ok: true, alreadyPresent: true });
    }

    await prisma.actionItem.create({
      data: {
        actionPlanId: plan.id,
        recommendationId: reco.id,
        title: reco.title,
        description: reco.shortDescription ?? reco.reason,
        weekNumber: weekForCategory(reco.category),
        estimatedMonthlySavingEuro: reco.monthlySaving,
      },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Une erreur est survenue. Veuillez réessayer." },
      { status: 500 }
    );
  }
}
