/**
 * Seed Energy Coach — données de départ pour tester l'application immédiatement.
 * Exécution : npm run db:seed
 * Idempotent : peut être relancé sans dupliquer les données.
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const round1 = (n: number) => Math.round(n * 10) / 10;

async function upsertSource(name: string, data: {
  organization?: string;
  url?: string;
  description?: string;
}) {
  const existing = await prisma.calculationSource.findFirst({ where: { name } });
  if (existing) {
    return prisma.calculationSource.update({
      where: { id: existing.id },
      data: { ...data, checkedAt: new Date(), isActive: true },
    });
  }
  return prisma.calculationSource.create({
    data: { name, ...data, checkedAt: new Date(), isActive: true },
  });
}

async function upsertDevice(d: {
  name: string;
  category: string;
  powerWatts: number;
  defaultDailyHours: number;
  impactLevel: string;
  advice: string;
  sourceId?: string;
}) {
  const averageMonthlyKwh = round1(
    (d.powerWatts * d.defaultDailyHours * 30) / 1000
  );
  const averageYearlyKwh = round1(averageMonthlyKwh * 12);
  const payload = {
    category: d.category,
    powerWatts: d.powerWatts,
    defaultDailyHours: d.defaultDailyHours,
    averageMonthlyKwh,
    averageYearlyKwh,
    impactLevel: d.impactLevel,
    advice: d.advice,
    sourceId: d.sourceId,
    isActive: true,
  };
  const existing = await prisma.device.findFirst({ where: { name: d.name } });
  if (existing) {
    return prisma.device.update({ where: { id: existing.id }, data: payload });
  }
  return prisma.device.create({ data: { name: d.name, ...payload } });
}

async function main() {
  console.log("→ Seed Energy Coach…");

  // 1. Sources -----------------------------------------------------------
  const ademe = await upsertSource("ADEME", {
    organization: "Agence de la transition écologique",
    url: "https://www.ademe.fr",
    description: "Repères de consommation et d'économies d'énergie.",
  });
  const enedis = await upsertSource("Enedis", {
    organization: "Gestionnaire du réseau de distribution d'électricité",
    url: "https://www.enedis.fr",
  });
  const grdf = await upsertSource("GRDF", {
    organization: "Gestionnaire du réseau de distribution de gaz",
    url: "https://www.grdf.fr",
  });
  const edf = await upsertSource("EDF / CRE", {
    organization: "Commission de régulation de l'énergie",
    url: "https://www.cre.fr",
    description: "Tarifs de référence de l'énergie.",
  });
  await upsertSource("data.gouv.fr", {
    organization: "Plateforme ouverte des données publiques françaises",
    url: "https://www.data.gouv.fr",
  });

  // 2. Prix de l'énergie -------------------------------------------------
  const prices = [
    { label: "Électricité (référence)", energyType: "electricite", pricePerKwh: 0.25, sourceId: edf.id, isDefault: true },
    { label: "Gaz (référence)", energyType: "gaz", pricePerKwh: 0.11, sourceId: grdf.id, isDefault: true },
  ];
  for (const p of prices) {
    const existing = await prisma.energyPrice.findFirst({ where: { label: p.label } });
    if (existing) {
      await prisma.energyPrice.update({ where: { id: existing.id }, data: p });
    } else {
      await prisma.energyPrice.create({ data: { ...p, validFrom: new Date() } });
    }
  }

  // 3. Types de compteurs ------------------------------------------------
  const meterTypes = [
    { slug: "linky", name: "Linky (électrique)", energyType: "electricite", supportsQrDemo: true, supportsRealConnectionLater: true, description: "Compteur électrique communicant." },
    { slug: "electrique-classique", name: "Compteur électrique classique", energyType: "electricite", supportsManualEntry: true },
    { slug: "gazpar", name: "Gazpar (gaz)", energyType: "gaz", supportsQrDemo: true, supportsRealConnectionLater: true, description: "Compteur gaz communicant." },
    { slug: "gaz-classique", name: "Compteur gaz classique", energyType: "gaz", supportsManualEntry: true },
    { slug: "prepaye", name: "Compteur prépayé", energyType: "electricite", supportsQrDemo: true },
    { slug: "manuel", name: "Saisie manuelle (facture)", energyType: "mixte", supportsManualEntry: true },
    { slug: "inconnu", name: "Je ne sais pas", energyType: "inconnu", supportsManualEntry: true },
    { slug: "demo", name: "Mode démo", energyType: "mixte", supportsQrDemo: true },
  ];
  for (const m of meterTypes) {
    await prisma.meterType.upsert({
      where: { slug: m.slug },
      create: { supportsManualEntry: true, ...m },
      update: m,
    });
  }

  // 4. Appareils ---------------------------------------------------------
  const devices = [
    { name: "Réfrigérateur", category: "electromenager", powerWatts: 150, defaultDailyHours: 8, impactLevel: "moyen", advice: "Dégivrez régulièrement et éloignez-le des sources de chaleur." },
    { name: "Congélateur", category: "electromenager", powerWatts: 200, defaultDailyHours: 8, impactLevel: "moyen", advice: "Réglez la température à -18°C, pas plus froid." },
    { name: "Télévision", category: "multimedia", powerWatts: 100, defaultDailyHours: 4, impactLevel: "moyen", advice: "Éteignez complètement plutôt que de laisser en veille." },
    { name: "Box internet", category: "multimedia", powerWatts: 15, defaultDailyHours: 24, impactLevel: "moyen", advice: "Éteignez-la la nuit ou lors d'absences prolongées." },
    { name: "Ordinateur", category: "multimedia", powerWatts: 120, defaultDailyHours: 5, impactLevel: "moyen", advice: "Activez la mise en veille automatique de l'écran." },
    { name: "Console de jeux", category: "multimedia", powerWatts: 150, defaultDailyHours: 2, impactLevel: "faible", advice: "Désactivez la veille connectée." },
    { name: "Machine à laver", category: "electromenager", powerWatts: 2000, defaultDailyHours: 0.5, impactLevel: "moyen", advice: "Lancez à pleine charge et utilisez le programme éco." },
    { name: "Sèche-linge", category: "electromenager", powerWatts: 2500, defaultDailyHours: 0.75, impactLevel: "eleve", advice: "Privilégiez le séchage à l'air libre quand c'est possible." },
    { name: "Lave-vaisselle", category: "electromenager", powerWatts: 1500, defaultDailyHours: 1, impactLevel: "moyen", advice: "Utilisez le mode éco et remplissez-le complètement." },
    { name: "Four", category: "electromenager", powerWatts: 2500, defaultDailyHours: 0.5, impactLevel: "moyen", advice: "Éteignez avant la fin pour profiter de la chaleur résiduelle." },
    { name: "Micro-ondes", category: "electromenager", powerWatts: 1000, defaultDailyHours: 0.2, impactLevel: "faible", advice: "Idéal pour réchauffer : très économe par rapport au four." },
    { name: "Plaques électriques", category: "electromenager", powerWatts: 2000, defaultDailyHours: 1, impactLevel: "eleve", advice: "Couvrez les casseroles et coupez avant la fin de cuisson." },
    { name: "Chauffage électrique", category: "chauffage", powerWatts: 1500, defaultDailyHours: 6, impactLevel: "eleve", advice: "Baissez d'1°C et programmez selon vos horaires." },
    { name: "Climatiseur", category: "climatisation", powerWatts: 1200, defaultDailyHours: 3, impactLevel: "eleve", advice: "Réglez à 26°C et fermez les volets la journée." },
    { name: "Chauffe-eau électrique", category: "eau_chaude", powerWatts: 2000, defaultDailyHours: 3, impactLevel: "eleve", advice: "Programmez en heures creuses ; 55°C suffisent." },
    { name: "Lampes", category: "eclairage", powerWatts: 60, defaultDailyHours: 5, impactLevel: "faible", advice: "Passez aux LED et éteignez en quittant une pièce." },
    { name: "Chargeurs", category: "veille", powerWatts: 10, defaultDailyHours: 24, impactLevel: "faible", advice: "Débranchez-les une fois la charge terminée." },
  ];
  for (const d of devices) {
    await upsertDevice({ ...d, sourceId: ademe.id });
  }

  // 5. Habitudes ---------------------------------------------------------
  const habits = [
    { key: "lumieres_vides", question: "Laissez-vous souvent les lumières allumées dans une pièce vide ?", category: "eclairage", recommendationTrigger: "eteindre-lumieres" },
    { key: "veille_appareils", question: "Laissez-vous les appareils en veille ?", category: "veille", recommendationTrigger: "couper-veilles" },
    { key: "chargeurs_branches", question: "Laissez-vous les chargeurs branchés ?", category: "veille", recommendationTrigger: "couper-veilles" },
    { key: "chauffage_eleve", question: "Chauffez-vous souvent au-dessus de 20°C ?", category: "chauffage", recommendationTrigger: "baisser-chauffage" },
    { key: "clim_frequente", question: "Utilisez-vous souvent la climatisation ?", category: "climatisation", recommendationTrigger: "limiter-clim" },
    { key: "seche_linge", question: "Utilisez-vous souvent le sèche-linge ?", category: "electromenager", recommendationTrigger: "reduire-seche-linge" },
    { key: "machines_demi", question: "Lancez-vous parfois les machines à moitié pleines ?", category: "electromenager", recommendationTrigger: "machines-pleines" },
    { key: "box_nuit", question: "Laissez-vous la box internet allumée la nuit ?", category: "multimedia", recommendationTrigger: "couper-veilles" },
    { key: "multimedia_freq", question: "Utilisez-vous souvent TV, console ou ordinateur plusieurs heures par jour ?", category: "multimedia", recommendationTrigger: "surveiller-multimedia" },
    { key: "douches_longues", question: "Prenez-vous souvent de longues douches chaudes (chauffe-eau électrique) ?", category: "eau_chaude", recommendationTrigger: "optimiser-chauffe-eau" },
  ];
  for (let i = 0; i < habits.length; i++) {
    const h = habits[i];
    await prisma.habit.upsert({
      where: { key: h.key },
      create: { ...h, orderIndex: i, isActive: true },
      update: { ...h, orderIndex: i, isActive: true },
    });
  }

  // 6. Règles de calcul --------------------------------------------------
  const rules = [
    { key: "baisser-chauffage", title: "Baisse du chauffage", formulaType: "percentageOfCategory", coefficient: 0.07, targetCategory: "chauffage", sourceId: ademe.id, description: "Baisser le chauffage d'1°C réduit d'environ 7 % la consommation de chauffage." },
    { key: "limiter-clim", title: "Limitation de la climatisation", formulaType: "percentageOfCategory", coefficient: 0.1, targetCategory: "climatisation", sourceId: ademe.id, description: "Réduire l'usage de la climatisation diminue nettement sa consommation." },
    { key: "couper-veilles", title: "Coupure des veilles", formulaType: "percentageOfBill", coefficient: 0.05, targetCategory: "veille", sourceId: ademe.id, description: "Les appareils en veille représentent environ 5 % de la facture d'électricité." },
    { key: "eteindre-lumieres", title: "Extinction des lumières", formulaType: "percentageOfCategory", coefficient: 0.15, targetCategory: "eclairage", sourceId: ademe.id, description: "Éteindre les lumières inutiles réduit la consommation d'éclairage." },
    { key: "reduire-seche-linge", title: "Réduction du sèche-linge", formulaType: "percentageOfCategory", coefficient: 0.3, targetCategory: "electromenager", sourceId: ademe.id, description: "Le sèche-linge est l'un des appareils les plus énergivores du foyer." },
    { key: "machines-pleines", title: "Machines pleines", formulaType: "percentageOfCategory", coefficient: 0.1, targetCategory: "electromenager", sourceId: ademe.id, description: "Lancer les machines pleines optimise chaque cycle." },
    { key: "optimiser-chauffe-eau", title: "Optimisation du chauffe-eau", formulaType: "percentageOfCategory", coefficient: 0.15, targetCategory: "eau_chaude", sourceId: ademe.id, description: "Régler le chauffe-eau et réduire les douches longues fait baisser la consommation d'eau chaude." },
    { key: "surveiller-multimedia", title: "Maîtrise du multimédia", formulaType: "percentageOfCategory", coefficient: 0.1, targetCategory: "multimedia", sourceId: ademe.id, description: "Limiter les temps d'usage et les veilles multimédia réduit la consommation." },
  ];
  const ruleIdByKey: Record<string, string> = {};
  for (const r of rules) {
    const rule = await prisma.calculationRule.upsert({
      where: { key: r.key },
      create: { ...r, isActive: true },
      update: { ...r, isActive: true },
    });
    ruleIdByKey[r.key] = rule.id;
  }

  // 7. Recommandations ---------------------------------------------------
  const recos = [
    { key: "baisser-chauffage", title: "Baisser le chauffage de 1°C", category: "chauffage", effortLevel: "faible", impactLevel: "eleve", ruleKey: "baisser-chauffage", shortDescription: "Un degré de moins, c'est jusqu'à 7 % d'économie sur le chauffage.", detailedExplanation: "Baisser la température d'1°C est peu perceptible mais réduit sensiblement la consommation de chauffage, votre poste le plus important en hiver." },
    { key: "limiter-clim", title: "Limiter la climatisation", category: "climatisation", effortLevel: "moyen", impactLevel: "eleve", ruleKey: "limiter-clim", shortDescription: "Réglez à 26°C et fermez les volets la journée.", detailedExplanation: "La climatisation est très énergivore. Un réglage à 26°C et une bonne gestion des volets limitent fortement sa consommation." },
    { key: "couper-veilles", title: "Couper les appareils en veille", category: "veille", effortLevel: "faible", impactLevel: "moyen", ruleKey: "couper-veilles", shortDescription: "Les veilles pèsent ~5 % de votre facture d'électricité.", detailedExplanation: "TV, box, console, chargeurs continuent de consommer en veille. Une multiprise à interrupteur permet de tout couper facilement." },
    { key: "eteindre-lumieres", title: "Éteindre les lumières inutiles", category: "eclairage", effortLevel: "faible", impactLevel: "faible", ruleKey: "eteindre-lumieres", shortDescription: "Un réflexe simple, surtout avec des ampoules LED.", detailedExplanation: "Éteindre en quittant une pièce et passer aux LED réduit durablement la consommation d'éclairage." },
    { key: "reduire-seche-linge", title: "Réduire l'usage du sèche-linge", category: "electromenager", effortLevel: "moyen", impactLevel: "eleve", ruleKey: "reduire-seche-linge", shortDescription: "Séchez à l'air libre dès que possible.", detailedExplanation: "Le sèche-linge est l'un des appareils les plus gourmands. L'étendage réduit fortement cette dépense." },
    { key: "machines-pleines", title: "Lancer les machines pleines", category: "electromenager", effortLevel: "faible", impactLevel: "moyen", ruleKey: "machines-pleines", shortDescription: "Attendez une charge complète et utilisez le mode éco.", detailedExplanation: "Lave-linge et lave-vaisselle consomment autant à moitié pleins. Optimiser chaque cycle réduit le nombre de lavages." },
    { key: "optimiser-chauffe-eau", title: "Optimiser le chauffe-eau", category: "eau_chaude", effortLevel: "moyen", impactLevel: "eleve", ruleKey: "optimiser-chauffe-eau", shortDescription: "55°C suffisent, et des douches plus courtes aident.", detailedExplanation: "L'eau chaude est un poste majeur. Régler le ballon à 55°C, le programmer en heures creuses et raccourcir les douches font baisser la facture." },
    { key: "surveiller-multimedia", title: "Surveiller les appareils multimédias", category: "multimedia", effortLevel: "faible", impactLevel: "moyen", ruleKey: "surveiller-multimedia", shortDescription: "Limitez les temps d'usage et les veilles.", detailedExplanation: "TV, ordinateur et console cumulés représentent une part croissante de la consommation. Les extinctions complètes aident." },
    { key: "heures-creuses", title: "Utiliser les heures creuses", category: "electromenager", effortLevel: "faible", impactLevel: "moyen", ruleKey: "machines-pleines", shortDescription: "Décalez les gros usages vers les heures creuses.", detailedExplanation: "Si votre contrat le permet, programmer lave-linge, lave-vaisselle et chauffe-eau en heures creuses réduit le coût." },
  ];
  for (const r of recos) {
    const { ruleKey, ...rest } = r;
    await prisma.recommendation.upsert({
      where: { key: r.key },
      create: { ...rest, sourceId: ademe.id, ruleId: ruleIdByKey[ruleKey], isActive: true },
      update: { ...rest, sourceId: ademe.id, ruleId: ruleIdByKey[ruleKey], isActive: true },
    });
  }

  // 8. Comptes admin & démo ---------------------------------------------
  await prisma.user.upsert({
    where: { email: "admin@energycoach.local" },
    create: {
      firstName: "Admin",
      lastName: "Energy Coach",
      email: "admin@energycoach.local",
      passwordHash: await bcrypt.hash("Admin1234!", 10),
      role: "ADMIN",
    },
    update: { role: "ADMIN" },
  });
  const demoUser = await prisma.user.upsert({
    where: { email: "demo@energycoach.local" },
    create: {
      firstName: "Camille",
      lastName: "Démo",
      email: "demo@energycoach.local",
      passwordHash: await bcrypt.hash("Demo1234!", 10),
      role: "DEMO_USER",
      isDemo: true,
    },
    update: { role: "DEMO_USER", isDemo: true },
  });

  // 9. Profils démo ------------------------------------------------------
  const demoProfiles = [
    {
      slug: "etudiant-appartement",
      name: "Étudiant en appartement",
      description: "Appartement 45 m², 2 personnes, chauffage électrique.",
      qrCodePath: "/qrcodes/demo-linky-001.png",
      qrPayload: "energycoach://connect-meter?type=linky&meterId=demo-linky-001",
      housingDataJson: JSON.stringify({ housingType: "appartement", surfaceM2: 45, occupants: 2, city: "Lyon", country: "France", mainEnergy: "electricite", hasElectricHeating: true, hasElectricWaterHeater: true, monthlyBillEuro: 95, knownKwhPrice: 0.25 }),
      devicesJson: JSON.stringify([
        { name: "Réfrigérateur" }, { name: "Télévision" }, { name: "Box internet" },
        { name: "Ordinateur" }, { name: "Console de jeux" }, { name: "Machine à laver", usageDaysPerMonth: 12 },
        { name: "Chauffage électrique" }, { name: "Lampes" }, { name: "Chargeurs" },
      ]),
      habitsJson: JSON.stringify([
        { key: "veille_appareils", answerValue: "souvent" },
        { key: "chauffage_eleve", answerValue: "souvent" },
        { key: "lumieres_vides", answerValue: "parfois" },
        { key: "multimedia_freq", answerValue: "souvent" },
        { key: "chargeurs_branches", answerValue: "souvent" },
        { key: "box_nuit", answerValue: "souvent" },
      ]),
      meterDataJson: JSON.stringify({ meterSlug: "linky", label: "Linky (démo)", consumptionKwh: 380, costEuro: 95, demoMeterIdentifier: "demo-linky-001" }),
    },
    {
      slug: "famille",
      name: "Famille en maison",
      description: "Maison 90 m², 4 personnes, chauffage gaz.",
      qrCodePath: "/qrcodes/demo-gazpar-001.png",
      qrPayload: "energycoach://connect-meter?type=gazpar&meterId=demo-gazpar-001",
      housingDataJson: JSON.stringify({ housingType: "maison", surfaceM2: 90, occupants: 4, city: "Nantes", country: "France", mainEnergy: "mixte", hasGasHeating: true, hasElectricWaterHeater: true, monthlyBillEuro: 180, knownKwhPrice: 0.11 }),
      devicesJson: JSON.stringify([
        { name: "Réfrigérateur" }, { name: "Congélateur" }, { name: "Lave-vaisselle", usageDaysPerMonth: 25 },
        { name: "Sèche-linge", usageDaysPerMonth: 15 }, { name: "Machine à laver", usageDaysPerMonth: 20 },
        { name: "Télévision" }, { name: "Box internet" }, { name: "Four", usageDaysPerMonth: 20 },
        { name: "Chauffe-eau électrique" }, { name: "Lampes" },
      ]),
      habitsJson: JSON.stringify([
        { key: "machines_demi", answerValue: "souvent" },
        { key: "chauffage_eleve", answerValue: "souvent" },
        { key: "seche_linge", answerValue: "souvent" },
        { key: "veille_appareils", answerValue: "parfois" },
        { key: "douches_longues", answerValue: "souvent" },
      ]),
      meterDataJson: JSON.stringify({ meterSlug: "gazpar", label: "Gazpar (démo)", consumptionKwh: 1200, costEuro: 180, demoMeterIdentifier: "demo-gazpar-001" }),
    },
    {
      slug: "prepaye",
      name: "Compteur prépayé",
      description: "Studio 30 m², 1 personne, budget à optimiser.",
      qrCodePath: "/qrcodes/demo-prepaid-001.png",
      qrPayload: "energycoach://connect-meter?type=prepaid&meterId=demo-prepaid-001",
      housingDataJson: JSON.stringify({ housingType: "studio", surfaceM2: 30, occupants: 1, city: "Marseille", country: "France", mainEnergy: "electricite", hasAirConditioning: true, hasElectricWaterHeater: true, monthlyBillEuro: 60 }),
      devicesJson: JSON.stringify([
        { name: "Réfrigérateur" }, { name: "Télévision" }, { name: "Climatiseur" },
        { name: "Micro-ondes" }, { name: "Lampes" }, { name: "Chargeurs" },
      ]),
      habitsJson: JSON.stringify([
        { key: "veille_appareils", answerValue: "souvent" },
        { key: "clim_frequente", answerValue: "souvent" },
      ]),
      meterDataJson: JSON.stringify({ meterSlug: "prepaye", label: "Compteur prépayé (démo)", consumptionKwh: 220, costEuro: 60, demoMeterIdentifier: "demo-prepaid-001", prepaidMonthlyBudget: 70, prepaidRechargeAmount: 20, prepaidRechargeFrequency: "hebdomadaire" }),
    },
  ];
  for (const p of demoProfiles) {
    await prisma.demoProfile.upsert({
      where: { slug: p.slug },
      create: { ...p, isActive: true },
      update: { ...p, isActive: true },
    });
  }

  // 10. Paramètres admin -------------------------------------------------
  const settings = [
    { key: "app_name", value: "Energy Coach" },
    { key: "default_currency", value: "EUR" },
    { key: "demo_email", value: "demo@energycoach.local" },
  ];
  for (const s of settings) {
    await prisma.adminSetting.upsert({
      where: { key: s.key },
      create: s,
      update: { value: s.value },
    });
  }

  // 11. Applique le profil démo principal au compte démo -----------------
  await applyPrimaryDemo(demoUser.id);

  console.log("✓ Seed terminé.");
  console.log("  Admin : admin@energycoach.local / Admin1234!");
  console.log("  Démo  : demo@energycoach.local / Demo1234!");
}

// Duplique la logique de lib/demo pour le contexte seed (sans alias @/).
async function applyPrimaryDemo(userId: string) {
  const profile = await prisma.demoProfile.findUnique({
    where: { slug: "etudiant-appartement" },
  });
  if (!profile) return;
  const housing = JSON.parse(profile.housingDataJson ?? "{}");
  const devices = JSON.parse(profile.devicesJson ?? "[]");
  const habits = JSON.parse(profile.habitsJson ?? "[]");
  const meter = JSON.parse(profile.meterDataJson ?? "null");

  await prisma.housingProfile.upsert({
    where: { userId },
    create: { userId, ...housing },
    update: housing,
  });
  await prisma.userDevice.deleteMany({ where: { userId } });
  for (const d of devices) {
    const device = await prisma.device.findFirst({ where: { name: d.name } });
    if (!device) continue;
    await prisma.userDevice.create({
      data: {
        userId,
        deviceId: device.id,
        quantity: d.quantity ?? 1,
        usageHoursPerDay: d.usageHoursPerDay ?? device.defaultDailyHours ?? undefined,
        usageDaysPerMonth: d.usageDaysPerMonth ?? 30,
      },
    });
  }
  for (const h of habits) {
    const habit = await prisma.habit.findUnique({ where: { key: h.key } });
    if (!habit) continue;
    await prisma.userHabit.upsert({
      where: { userId_habitId: { userId, habitId: habit.id } },
      create: { userId, habitId: habit.id, answerValue: h.answerValue },
      update: { answerValue: h.answerValue },
    });
  }
  if (meter) {
    const meterType = await prisma.meterType.findUnique({ where: { slug: meter.meterSlug } });
    if (meterType) {
      await prisma.userMeterProfile.deleteMany({ where: { userId } });
      await prisma.userMeterProfile.create({
        data: { userId, meterTypeId: meterType.id, label: meter.label, demoMeterIdentifier: meter.demoMeterIdentifier, isConnectedDemo: true },
      });
      await prisma.meterReading.deleteMany({ where: { userId, isDemo: true } });
      await prisma.meterReading.create({
        data: { userId, meterTypeId: meterType.id, consumptionKwh: meter.consumptionKwh, costEuro: meter.costEuro, sourceType: "demo", isDemo: true },
      });
    }
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
