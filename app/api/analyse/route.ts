import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { buildAnalysis, type RecoResult } from "@/lib/analysis";
import { selectAiRecommendations } from "@/lib/airecommendations";
import { persistSelectedRecommendations } from "@/lib/recostore";
import { fallbackCoaching } from "@/lib/ai";
import { round2 } from "@/lib/energy";

// Lance l'analyse :
//  1. le moteur calcule les économies (chiffres déterministes) ;
//  2. Ollama sélectionne et priorise les recommandations (si disponible) ;
//  3. sinon, repli automatique sur les recommandations issues des règles ;
//  4. persistance + texte de coaching. Ne bloque jamais l'utilisateur.
export async function POST() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }
  try {
    const analysis = await buildAnalysis(user.id);

    // 2. Sélection par l'IA locale (dans le catalogue déjà chiffré).
    const ai = await selectAiRecommendations(analysis);
    const usedAi = ai !== null;
    const finalList: RecoResult[] = ai ? ai.list : analysis.recommendations;

    // 3. Persistance (ordre + raison conservés).
    await persistSelectedRecommendations(user.id, finalList, usedAi);

    // 4. Texte de coaching déterministe, cohérent avec la sélection retenue
    //    (les chiffres viennent du moteur). On évite un 2e appel IA coûteux.
    const totalMonthly = round2(
      finalList.reduce((s, r) => s + r.monthlySaving, 0)
    );
    const coachingAnalysis = {
      ...analysis,
      recommendations: finalList,
      totalMonthlySaving: totalMonthly,
      totalYearlySaving: round2(totalMonthly * 12),
      billAfter: round2(Math.max(0, analysis.bill - totalMonthly)),
    };

    await prisma.aiAnalysis.deleteMany({ where: { userId: user.id } });
    await prisma.aiAnalysis.create({
      data: {
        userId: user.id,
        summary: analysis.summary,
        explanation: fallbackCoaching(coachingAnalysis),
        modelName: usedAi ? (ai?.model ?? "ollama") : "moteur",
        usedFallback: !usedAi,
      },
    });

    return NextResponse.json({ ok: true, usedAi });
  } catch {
    return NextResponse.json(
      { error: "L'analyse n'a pas pu être finalisée. Veuillez réessayer." },
      { status: 500 }
    );
  }
}
