import "server-only";
import type { Analysis, RecoResult } from "@/lib/analysis";
import { CATEGORY_LABELS } from "@/lib/analysis";

const SYSTEM_PROMPT =
  "Tu es le moteur de recommandations d'Energy Coach. À partir du profil d'un foyer et d'un catalogue d'actions déjà chiffrées par le système, tu SÉLECTIONNES et PRIORISES les 3 à 5 actions les plus pertinentes pour ce foyer. Tu ne choisis QUE des actions présentes dans le catalogue (via leur clé). Tu n'inventes aucune action, aucun chiffre, aucune économie, aucun prix. Pour chaque action retenue, tu écris une courte raison personnalisée en français (une phrase). Tu réponds STRICTEMENT en JSON.";

export type AiSelection = {
  list: RecoResult[];
  model: string;
};

function buildPrompt(analysis: Analysis): string {
  const catalog = analysis.allComputed
    .map(
      (r) =>
        `- clé="${r.key}" | titre="${r.title}" | poste=${
          CATEGORY_LABELS[r.category] ?? r.category
        } | effort=${r.effortLevel ?? "?"} | impact=${
          r.impactLevel ?? "?"
        } | economie=${r.monthlySaving}€/mois`
    )
    .join("\n");

  const breakdown = analysis.breakdown
    .filter((b) => b.cost > 0)
    .map((b) => `${b.label} ${Math.round(b.share * 100)}%`)
    .join(", ");

  return `Profil du foyer :
- Facture mensuelle estimée : ${analysis.bill} €
- Consommation estimée : ${analysis.consumptionKwh} kWh/mois
- Répartition estimée : ${breakdown || "non disponible"}
- Postes principaux : ${analysis.topCategories.join(", ")}

Catalogue d'actions disponibles (clés autorisées) :
${catalog}

Sélectionne les 3 à 5 actions les plus utiles pour CE foyer, de la plus prioritaire à la moins prioritaire.
Réponds uniquement avec un objet JSON de cette forme exacte :
{"recommendations":[{"key":"<clé du catalogue>","reason":"<phrase courte et personnalisée>"}]}
N'utilise que des clés présentes dans le catalogue. N'invente aucun chiffre.`;
}

type OllamaReply = { recommendations?: { key?: string; reason?: string }[] };

// Demande à Ollama de choisir/prioriser les recommandations dans le catalogue.
// Les économies restent celles calculées par le moteur (analysis.allComputed).
// Renvoie null si Ollama est indisponible ou si la réponse est inexploitable.
export async function selectAiRecommendations(
  analysis: Analysis
): Promise<AiSelection | null> {
  const url = process.env.OLLAMA_URL;
  const model = process.env.OLLAMA_MODEL ?? "llama3.2";
  if (!url || analysis.allComputed.length === 0) return null;

  const byKey = new Map(analysis.allComputed.map((r) => [r.key, r]));

  // Timeout large : sur une machine CPU, le 1er appel charge le modèle en RAM.
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45000);
  try {
    const res = await fetch(`${url}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        system: SYSTEM_PROMPT,
        prompt: buildPrompt(analysis),
        stream: false,
        format: "json",
        options: { temperature: 0.3 },
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) return null;

    const data = (await res.json()) as { response?: string };
    if (!data.response) return null;

    const parsed = JSON.parse(data.response) as OllamaReply;
    const picks = parsed.recommendations;
    if (!Array.isArray(picks) || picks.length === 0) return null;

    const list: RecoResult[] = [];
    const seen = new Set<string>();
    for (const p of picks) {
      if (!p.key || seen.has(p.key)) continue;
      const base = byKey.get(p.key);
      if (!base) continue; // clé hors catalogue : ignorée (anti-hallucination)
      seen.add(p.key);
      list.push({
        ...base,
        reason: (p.reason && p.reason.trim()) || base.reason || "",
      });
      if (list.length >= 5) break;
    }

    if (list.length === 0) return null;
    return { list, model };
  } catch {
    clearTimeout(timeout);
    return null;
  }
}
