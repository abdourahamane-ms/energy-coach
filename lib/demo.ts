import "server-only";
import { prisma } from "@/lib/prisma";

export const DEMO_EMAIL = "demo@energycoach.local";
export const PRIMARY_DEMO_SLUG = "etudiant-appartement";

// Formats JSON stockés dans DemoProfile.
type DemoHousing = {
  housingType?: string;
  surfaceM2?: number;
  occupants?: number;
  city?: string;
  country?: string;
  mainEnergy?: string;
  hasElectricHeating?: boolean;
  hasGasHeating?: boolean;
  hasAirConditioning?: boolean;
  hasElectricWaterHeater?: boolean;
  monthlyBillEuro?: number;
  monthlyConsumptionKwh?: number;
  knownKwhPrice?: number;
};
type DemoDevice = {
  name: string;
  quantity?: number;
  usageHoursPerDay?: number;
  usageDaysPerMonth?: number;
  energyClass?: string;
};
type DemoHabit = { key: string; answerValue: string };
type DemoMeter = {
  meterSlug: string;
  label?: string;
  consumptionKwh?: number;
  costEuro?: number;
  demoMeterIdentifier?: string;
  prepaidMonthlyBudget?: number;
  prepaidRechargeAmount?: number;
  prepaidRechargeFrequency?: string;
};

function safeParse<T>(json: string | null | undefined, fallback: T): T {
  if (!json) return fallback;
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

// Applique un profil démo (par slug) sur un utilisateur donné, en remplaçant
// ses données de parcours. Utilisé pour le mode démo, le scan QR et le reset.
export async function applyDemoProfileToUser(userId: string, slug: string) {
  const profile = await prisma.demoProfile.findUnique({ where: { slug } });
  if (!profile) throw new Error(`Profil démo introuvable: ${slug}`);

  const housing = safeParse<DemoHousing>(profile.housingDataJson, {});
  const devices = safeParse<DemoDevice[]>(profile.devicesJson, []);
  const habits = safeParse<DemoHabit[]>(profile.habitsJson, []);
  const meter = safeParse<DemoMeter | null>(profile.meterDataJson, null);

  // 1. Profil logement
  await prisma.housingProfile.upsert({
    where: { userId },
    create: { userId, ...housing },
    update: { ...housing },
  });

  // 2. Appareils (remplacement complet)
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
        energyClass: d.energyClass,
      },
    });
  }

  // 3. Habitudes
  for (const h of habits) {
    const habit = await prisma.habit.findUnique({ where: { key: h.key } });
    if (!habit) continue;
    await prisma.userHabit.upsert({
      where: { userId_habitId: { userId, habitId: habit.id } },
      create: { userId, habitId: habit.id, answerValue: h.answerValue },
      update: { answerValue: h.answerValue },
    });
  }

  // 4. Compteur + relevé simulé
  if (meter) {
    const meterType = await prisma.meterType.findUnique({
      where: { slug: meter.meterSlug },
    });
    if (meterType) {
      await prisma.userMeterProfile.deleteMany({ where: { userId } });
      await prisma.userMeterProfile.create({
        data: {
          userId,
          meterTypeId: meterType.id,
          label: meter.label ?? meterType.name,
          demoMeterIdentifier: meter.demoMeterIdentifier,
          isConnectedDemo: true,
          prepaidMonthlyBudget: meter.prepaidMonthlyBudget,
          prepaidRechargeAmount: meter.prepaidRechargeAmount,
          prepaidRechargeFrequency: meter.prepaidRechargeFrequency,
        },
      });
      await prisma.meterReading.deleteMany({ where: { userId, isDemo: true } });
      await prisma.meterReading.create({
        data: {
          userId,
          meterTypeId: meterType.id,
          consumptionKwh: meter.consumptionKwh,
          costEuro: meter.costEuro,
          sourceType: "demo",
          isDemo: true,
        },
      });
    }
  }

  return profile;
}

// Associe UNIQUEMENT la simulation de compteur (relevé de consommation) d'un
// profil démo, sans toucher au logement, aux appareils ni aux habitudes.
// Utilisé par le scan d'un QR code compteur : l'utilisateur garde le contrôle
// de la sélection de ses appareils et de ses habitudes.
export async function applyDemoMeterToUser(userId: string, slug: string) {
  const profile = await prisma.demoProfile.findUnique({ where: { slug } });
  if (!profile) throw new Error(`Profil démo introuvable: ${slug}`);
  const meter = safeParse<DemoMeter | null>(profile.meterDataJson, null);
  if (!meter) throw new Error("Ce profil démo ne contient pas de compteur.");

  const meterType = await prisma.meterType.findUnique({
    where: { slug: meter.meterSlug },
  });
  if (!meterType) throw new Error("Type de compteur du profil démo introuvable.");

  // On remplace uniquement la simulation de compteur précédente.
  await prisma.userMeterProfile.deleteMany({
    where: { userId, isConnectedDemo: true },
  });
  await prisma.userMeterProfile.create({
    data: {
      userId,
      meterTypeId: meterType.id,
      label: meter.label ?? meterType.name,
      demoMeterIdentifier: meter.demoMeterIdentifier,
      isConnectedDemo: true,
      prepaidMonthlyBudget: meter.prepaidMonthlyBudget,
      prepaidRechargeAmount: meter.prepaidRechargeAmount,
      prepaidRechargeFrequency: meter.prepaidRechargeFrequency,
    },
  });
  await prisma.meterReading.deleteMany({ where: { userId, isDemo: true } });
  await prisma.meterReading.create({
    data: {
      userId,
      meterTypeId: meterType.id,
      consumptionKwh: meter.consumptionKwh,
      costEuro: meter.costEuro,
      sourceType: "demo",
      isDemo: true,
    },
  });

  return profile;
}

// Réinitialise entièrement le compte démo à partir du profil principal.
export async function resetDemoUser() {
  const demo = await prisma.user.findUnique({ where: { email: DEMO_EMAIL } });
  if (!demo) throw new Error("Compte démo introuvable.");
  // On nettoie les données dérivées avant de réappliquer le profil.
  await prisma.recommendationResult.deleteMany({ where: { userId: demo.id } });
  await prisma.aiAnalysis.deleteMany({ where: { userId: demo.id } });
  await prisma.actionPlan.deleteMany({ where: { userId: demo.id } });
  await applyDemoProfileToUser(demo.id, PRIMARY_DEMO_SLUG);
  return demo;
}
