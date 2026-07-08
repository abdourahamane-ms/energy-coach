import "server-only";
import type { Analysis } from "@/lib/analysis";
import { eur } from "@/lib/energy";

const SYSTEM_PROMPT =
  "Tu es un coach énergie pour une application appelée Energy Coach. Tu expliques les résultats avec un langage simple, clair et rassurant. Tu utilises uniquement les données fournies par le système. Tu ne modifies jamais les chiffres calculés. Tu n'inventes aucune économie, aucun prix, aucune source et aucun coefficient. Tu rappelles que les économies sont des estimations. Ton objectif est d'aider l'utilisateur à comprendre quoi faire en priorité.";

export type CoachingResult = {
  text: string;
  model: string;
  usedFallback: boolean;
};

// Texte de repli (aucune IA requise) construit uniquement à partir des calculs.
export function fallbackCoaching(analysis: Analysis): string {
  const top = analysis.recommendations.slice(0, 3);
  const lines = top.map(
    (r, i) =>
      `${i + 1}. ${r.title} — économie estimée ${eur(r.monthlySaving)}/mois.`
  );
  const totals =
    analysis.totalMonthlySaving > 0
      ? ` En appliquant ces actions, vous pourriez réduire votre facture d'environ ${eur(
          analysis.totalMonthlySaving
        )} par mois (${eur(analysis.totalYearlySaving)} par an, estimation).`
      : "";
  return `${analysis.summary}${totals}${
    lines.length ? "\n\nVos priorités :\n" + lines.join("\n") : ""
  }`;
}

function buildUserPrompt(analysis: Analysis): string {
  const recos = analysis.recommendations
    .slice(0, 5)
    .map(
      (r) =>
        `- ${r.title} (catégorie ${r.category}) : économie estimée ${r.monthlySaving} €/mois. Raison : ${r.reason}`
    )
    .join("\n");
  return `Voici les données calculées par le système (ne les modifie pas) :
- Facture mensuelle estimée : ${analysis.bill} €
- Consommation estimée : ${analysis.consumptionKwh} kWh/mois
- Score énergétique actuel : ${analysis.score}/100, estimé après actions : ${analysis.scoreAfter}/100
- Postes principaux : ${analysis.topCategories.join(", ")}
- Économie totale estimée : ${analysis.totalMonthlySaving} €/mois

Recommandations retenues par le moteur :
${recos}

Rédige un court texte de coaching (4 à 6 phrases) en français : explique simplement la situation, mets en avant les 2-3 actions prioritaires, et rappelle que ce sont des estimations. N'invente aucun chiffre.`;
}

// Interroge Ollama si disponible ; sinon renvoie le texte de repli.
export async function generateCoaching(
  analysis: Analysis
): Promise<CoachingResult> {
  const url = process.env.OLLAMA_URL;
  const model = process.env.OLLAMA_MODEL ?? "llama3.2";
  if (!url) {
    return { text: fallbackCoaching(analysis), model: "fallback", usedFallback: true };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const res = await fetch(`${url}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        system: SYSTEM_PROMPT,
        prompt: buildUserPrompt(analysis),
        stream: false,
        options: { temperature: 0.4 },
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) throw new Error("Ollama indisponible");
    const data = (await res.json()) as { response?: string };
    const text = (data.response ?? "").trim();
    if (!text) throw new Error("Réponse vide");
    return { text, model, usedFallback: false };
  } catch {
    clearTimeout(timeout);
    return { text: fallbackCoaching(analysis), model: "fallback", usedFallback: true };
  }
}
