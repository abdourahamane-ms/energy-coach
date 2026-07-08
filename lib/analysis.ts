import "server-only";
import { prisma } from "@/lib/prisma";
import { deviceMonthlyKwh, getDefaultKwhPrice, round1, round2 } from "@/lib/energy";

// Catégories de consommation affichées (ordre stable pour les graphiques).
export const CATEGORIES = [
  "chauffage",
  "climatisation",
  "electromenager",
  "multimedia",
  "eclairage",
  "eau_chaude",
  "veille",
] as const;
export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_LABELS: Record<string, string> = {
  chauffage: "Chauffage",
  climatisation: "Climatisation",
  electromenager: "Électroménager",
  multimedia: "Multimédia",
  eclairage: "Éclairage",
  eau_chaude: "Eau chaude",
  veille: "Veille & petits appareils",
};

// Parts par défaut d'une facture quand aucun appareil n'est renseigné dans
// une catégorie (repères ADEME simplifiés).
const DEFAULT_SHARES: Record<Category, number> = {
  chauffage: 0.45,
  climatisation: 0.08,
  electromenager: 0.18,
  multimedia: 0.08,
  eclairage: 0.05,
  eau_chaude: 0.12,
  veille: 0.05,
};

const ANSWER_INDEX: Record<string, number> = {
  jamais: 0,
  rarement: 1,
  parfois: 2,
  souvent: 3,
  tres_souvent: 4,
};

export type BreakdownItem = {
  category: Category;
  label: string;
  kwh: number;
  cost: number;
  share: number; // 0..1
};

export type RecoDetails = {
  bill: number;
  category: string;
  categoryCost: number;
  categoryShareUsed: number | null;
  coefficient: number;
  formulaType: string;
  monthlySaving: number;
};

export type RecoResult = {
  key: string;
  id: string;
  title: string;
  category: string;
  shortDescription: string | null;
  detailedExplanation: string | null;
  effortLevel: string | null;
  impactLevel: string | null;
  sourceLabel: string | null;
  monthlySaving: number;
  yearlySaving: number;
  monthlyKwhSaving: number;
  reason: string;
  details: RecoDetails;
};

export type Analysis = {
  hasEnoughData: boolean;
  bill: number;
  consumptionKwh: number;
  price: number;
  isPrepaid: boolean;
  breakdown: BreakdownItem[];
  recommendations: RecoResult[];
  allComputed: RecoResult[];
  totalMonthlySaving: number;
  totalYearlySaving: number;
  billAfter: number;
  score: number;
  scoreAfter: number;
  summary: string;
  topCategories: string[];
};

type Ctx = Awaited<ReturnType<typeof loadContext>>;

async function loadContext(userId: string) {
  const [housing, userDevices, userHabits, meter, reading] = await Promise.all([
    prisma.housingProfile.findUnique({ where: { userId } }),
    prisma.userDevice.findMany({ where: { userId }, include: { device: true } }),
    prisma.userHabit.findMany({ where: { userId }, include: { habit: true } }),
    prisma.userMeterProfile.findFirst({
      where: { userId },
      include: { meterType: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.meterReading.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  return { housing, userDevices, userHabits, meter, reading };
}

function habitAnswer(ctx: Ctx, key: string): number {
  const h = ctx.userHabits.find((u) => u.habit.key === key);
  return h ? (ANSWER_INDEX[h.answerValue] ?? 0) : -1;
}

function hasDevice(ctx: Ctx, name: string): boolean {
  return ctx.userDevices.some((u) => u.device.name === name);
}

// Calcule la répartition de consommation par catégorie.
function computeBreakdown(ctx: Ctx, bill: number, price: number): BreakdownItem[] {
  const deviceCost: Record<string, number> = {};
  const deviceKwh: Record<string, number> = {};
  for (const u of ctx.userDevices) {
    const k = deviceMonthlyKwh(u);
    const cat = u.device.category;
    deviceKwh[cat] = (deviceKwh[cat] ?? 0) + k;
    deviceCost[cat] = (deviceCost[cat] ?? 0) + k * price;
  }

  // Coût par catégorie : appareils réels sinon part par défaut de la facture,
  // uniquement si la catégorie est plausible pour ce logement.
  const items: BreakdownItem[] = CATEGORIES.map((cat) => {
    let cost = deviceCost[cat] ?? 0;
    let kwh = deviceKwh[cat] ?? 0;
    if (cost === 0 && categoryPlausible(ctx, cat)) {
      cost = DEFAULT_SHARES[cat] * bill;
      kwh = price > 0 ? cost / price : 0;
    }
    return { category: cat, label: CATEGORY_LABELS[cat], kwh, cost, share: 0 };
  });

  const total = items.reduce((s, i) => s + i.cost, 0) || 1;
  for (const i of items) i.share = i.cost / total;
  return items;
}

function categoryPlausible(ctx: Ctx, cat: Category): boolean {
  const h = ctx.housing;
  switch (cat) {
    case "chauffage":
      return Boolean(h?.hasElectricHeating || h?.hasGasHeating) || true;
    case "climatisation":
      return Boolean(h?.hasAirConditioning);
    case "eau_chaude":
      return Boolean(h?.hasElectricWaterHeater) || true;
    case "veille":
      return true;
    default:
      return true;
  }
}

function categoryCost(breakdown: BreakdownItem[], cat: string): number {
  return breakdown.find((b) => b.category === cat)?.cost ?? 0;
}

// Détermine si une recommandation s'applique à l'utilisateur.
function isTriggered(ctx: Ctx, key: string): { on: boolean; reason: string } {
  switch (key) {
    case "baisser-chauffage":
      if (ctx.housing?.hasElectricHeating || hasDevice(ctx, "Chauffage électrique"))
        return { on: true, reason: "Vous avez un chauffage électrique." };
      if (habitAnswer(ctx, "chauffage_eleve") >= 3)
        return { on: true, reason: "Vous chauffez souvent au-dessus de 20°C." };
      return { on: false, reason: "" };
    case "limiter-clim":
      if (ctx.housing?.hasAirConditioning || hasDevice(ctx, "Climatiseur"))
        return { on: true, reason: "Vous utilisez une climatisation." };
      if (habitAnswer(ctx, "clim_frequente") >= 3)
        return { on: true, reason: "Vous utilisez souvent la climatisation." };
      return { on: false, reason: "" };
    case "couper-veilles":
      if (
        habitAnswer(ctx, "veille_appareils") >= 3 ||
        habitAnswer(ctx, "box_nuit") >= 3 ||
        habitAnswer(ctx, "chargeurs_branches") >= 3
      )
        return { on: true, reason: "Plusieurs appareils restent en veille." };
      if (hasDevice(ctx, "Box internet") || hasDevice(ctx, "Télévision"))
        return { on: true, reason: "Vos appareils multimédias consomment en veille." };
      return { on: false, reason: "" };
    case "eteindre-lumieres":
      if (habitAnswer(ctx, "lumieres_vides") >= 2)
        return { on: true, reason: "Des lumières restent parfois allumées inutilement." };
      if (hasDevice(ctx, "Lampes"))
        return { on: true, reason: "Un usage maîtrisé de l'éclairage aide." };
      return { on: false, reason: "" };
    case "reduire-seche-linge":
      if (hasDevice(ctx, "Sèche-linge") || habitAnswer(ctx, "seche_linge") >= 3)
        return { on: true, reason: "Le sèche-linge est très énergivore." };
      return { on: false, reason: "" };
    case "machines-pleines":
      if (habitAnswer(ctx, "machines_demi") >= 3)
        return { on: true, reason: "Des machines sont parfois lancées à moitié pleines." };
      if (hasDevice(ctx, "Machine à laver") || hasDevice(ctx, "Lave-vaisselle"))
        return { on: true, reason: "Optimiser vos cycles réduit la consommation." };
      return { on: false, reason: "" };
    case "optimiser-chauffe-eau":
      if (ctx.housing?.hasElectricWaterHeater || hasDevice(ctx, "Chauffe-eau électrique"))
        return { on: true, reason: "Vous avez un chauffe-eau électrique." };
      if (habitAnswer(ctx, "douches_longues") >= 3)
        return { on: true, reason: "Des douches chaudes longues et fréquentes." };
      return { on: false, reason: "" };
    case "surveiller-multimedia":
      if (habitAnswer(ctx, "multimedia_freq") >= 3)
        return { on: true, reason: "Usage multimédia fréquent au quotidien." };
      if (hasDevice(ctx, "Ordinateur") || hasDevice(ctx, "Console de jeux"))
        return { on: true, reason: "Plusieurs appareils multimédias sont présents." };
      return { on: false, reason: "" };
    case "heures-creuses":
      if (hasDevice(ctx, "Machine à laver") || hasDevice(ctx, "Lave-vaisselle") || hasDevice(ctx, "Chauffe-eau électrique"))
        return { on: true, reason: "Certains usages peuvent être décalés en heures creuses." };
      return { on: false, reason: "" };
    default:
      return { on: false, reason: "" };
  }
}

function computeScore(ctx: Ctx, consumptionKwh: number): number {
  const surface = ctx.housing?.surfaceM2 ?? 40;
  const intensity = consumptionKwh / Math.max(surface, 15); // kWh/m²/mois
  const intensityPenalty = Math.min(Math.max((intensity - 4) * 3, 0), 30);

  const badHabits = [
    "veille_appareils",
    "chargeurs_branches",
    "chauffage_eleve",
    "clim_frequente",
    "seche_linge",
    "machines_demi",
    "box_nuit",
    "multimedia_freq",
    "douches_longues",
    "lumieres_vides",
  ];
  let habitPenalty = 0;
  for (const k of badHabits) {
    const idx = habitAnswer(ctx, k);
    if (idx > 0) habitPenalty += idx * 1.4;
  }
  habitPenalty = Math.min(habitPenalty, 40);

  return Math.round(Math.max(10, Math.min(100, 100 - intensityPenalty - habitPenalty)));
}

export async function buildAnalysis(userId: string): Promise<Analysis> {
  const ctx = await loadContext(userId);

  const isPrepaid = ctx.meter?.meterType.slug === "prepaye";
  const energyType = ctx.housing?.mainEnergy ?? "electricite";
  const price =
    ctx.housing?.knownKwhPrice ?? (await getDefaultKwhPrice(energyType));

  // Facture mensuelle estimée (priorité aux données saisies).
  let bill =
    ctx.housing?.monthlyBillEuro ??
    ctx.reading?.costEuro ??
    ctx.meter?.prepaidMonthlyBudget ??
    ctx.meter?.manualMonthlyBillEuro ??
    0;

  // Consommation
  let consumptionKwh =
    ctx.housing?.monthlyConsumptionKwh ??
    ctx.reading?.consumptionKwh ??
    (bill > 0 && price > 0 ? bill / price : 0);

  // Si aucune facture mais des appareils, on estime depuis les appareils.
  const deviceTotalKwh = ctx.userDevices.reduce(
    (s, u) => s + deviceMonthlyKwh(u),
    0
  );
  if (bill === 0 && deviceTotalKwh > 0) {
    consumptionKwh = deviceTotalKwh;
    bill = round2(consumptionKwh * price);
  }
  if (consumptionKwh === 0 && deviceTotalKwh > 0) consumptionKwh = deviceTotalKwh;

  const hasEnoughData = bill > 0 || deviceTotalKwh > 0;

  const breakdown = computeBreakdown(ctx, bill, price);

  // Recommandations
  const recos = await prisma.recommendation.findMany({
    where: { isActive: true },
    include: { rule: true, source: true },
  });

  // On calcule une estimation d'économie pour CHAQUE recommandation du
  // catalogue (savings toujours issus du moteur). `results` = celles retenues
  // par les règles ; `allComputed` = toutes (pour que l'IA puisse choisir).
  const results: RecoResult[] = [];
  const allComputed: RecoResult[] = [];
  for (const r of recos) {
    const trig = isTriggered(ctx, r.key);

    const coefficient = r.rule?.coefficient ?? 0.05;
    const formulaType = r.rule?.formulaType ?? "percentageOfBill";
    const targetCategory = r.rule?.targetCategory ?? r.category ?? "veille";

    let catCost = 0;
    let shareUsed: number | null = null;
    let monthlySaving = 0;
    if (formulaType === "percentageOfBill") {
      monthlySaving = coefficient * bill;
      catCost = bill;
    } else {
      catCost = categoryCost(breakdown, targetCategory);
      shareUsed = bill > 0 ? catCost / bill : null;
      monthlySaving = coefficient * catCost;
    }
    monthlySaving = round2(monthlySaving);
    if (monthlySaving <= 0) continue;

    const monthlyKwhSaving = price > 0 ? round1(monthlySaving / price) : 0;

    const reco: RecoResult = {
      key: r.key,
      id: r.id,
      title: r.title,
      category: r.category ?? targetCategory,
      shortDescription: r.shortDescription,
      detailedExplanation: r.detailedExplanation,
      effortLevel: r.effortLevel,
      impactLevel: r.impactLevel,
      sourceLabel: r.source?.name ?? "ADEME",
      monthlySaving,
      yearlySaving: round2(monthlySaving * 12),
      monthlyKwhSaving,
      reason: trig.reason,
      details: {
        bill: round2(bill),
        category: targetCategory,
        categoryCost: round2(catCost),
        categoryShareUsed: shareUsed,
        coefficient,
        formulaType,
        monthlySaving,
      },
    };

    allComputed.push(reco);
    if (trig.on) results.push(reco);
  }

  // Tri par économie décroissante puis impact
  results.sort((a, b) => b.monthlySaving - a.monthlySaving);
  allComputed.sort((a, b) => b.monthlySaving - a.monthlySaving);

  const totalMonthlySaving = round2(
    results.reduce((s, r) => s + r.monthlySaving, 0)
  );
  const totalYearlySaving = round2(totalMonthlySaving * 12);
  const billAfter = round2(Math.max(0, bill - totalMonthlySaving));

  const score = computeScore(ctx, consumptionKwh);
  const savingShare = bill > 0 ? totalMonthlySaving / bill : 0;
  const scoreAfter = Math.min(
    98,
    Math.max(score, score + Math.round(savingShare * 45) + 4)
  );

  const topCategories = [...breakdown]
    .sort((a, b) => b.cost - a.cost)
    .slice(0, 3)
    .map((b) => b.label);

  const summary = buildSummary(topCategories, results, isPrepaid);

  return {
    hasEnoughData,
    bill: round2(bill),
    consumptionKwh: round1(consumptionKwh),
    price,
    isPrepaid,
    breakdown,
    recommendations: results,
    allComputed,
    totalMonthlySaving,
    totalYearlySaving,
    billAfter,
    score,
    scoreAfter,
    summary,
    topCategories,
  };
}

function buildSummary(
  topCategories: string[],
  recos: RecoResult[],
  isPrepaid: boolean
): string {
  const cats = topCategories.slice(0, 3).join(", ").toLowerCase();
  const first = recos[0]?.title.toLowerCase();
  const intro = isPrepaid
    ? "Votre budget énergie part principalement vers "
    : "Votre consommation semble principalement liée à ";
  const base = topCategories.length
    ? `${intro}${cats}.`
    : "Complétez votre profil pour affiner votre diagnostic.";
  const action = first
    ? ` Une première action utile : ${first}.`
    : "";
  return `${base}${action} Les actions prioritaires ci-dessous peuvent vous aider à réduire votre facture progressivement.`;
}
