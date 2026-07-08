import "server-only";
import { prisma } from "@/lib/prisma";

export type ProgressStep = {
  key: string;
  label: string;
  href: string;
  done: boolean;
};

export type UserProgress = {
  steps: ProgressStep[];
  completedCount: number;
  total: number;
  percent: number;
  nextStep: ProgressStep | null;
  isComplete: boolean;
};

// Évalue l'avancement du parcours utilisateur à partir des données en base.
export async function getUserProgress(userId: string): Promise<UserProgress> {
  const [housing, meterCount, deviceCount, habitCount, readingCount] =
    await Promise.all([
      prisma.housingProfile.findUnique({ where: { userId } }),
      prisma.userMeterProfile.count({ where: { userId } }),
      prisma.userDevice.count({ where: { userId } }),
      prisma.userHabit.count({ where: { userId } }),
      prisma.meterReading.count({ where: { userId } }),
    ]);

  const housingDone = Boolean(
    housing && housing.housingType && housing.surfaceM2 && housing.occupants
  );
  const consumptionDone = Boolean(
    (housing &&
      (housing.monthlyBillEuro || housing.monthlyConsumptionKwh)) ||
      readingCount > 0
  );

  const steps: ProgressStep[] = [
    {
      key: "housing",
      label: "Profil logement",
      href: "/profil-logement",
      done: housingDone,
    },
    {
      key: "meter",
      label: "Choix du compteur",
      href: "/compteur",
      done: meterCount > 0,
    },
    {
      key: "consumption",
      label: "Facture / consommation",
      href: "/consommation",
      done: consumptionDone,
    },
    {
      key: "devices",
      label: "Vos appareils",
      href: "/appareils",
      done: deviceCount > 0,
    },
    {
      key: "habits",
      label: "Vos habitudes",
      href: "/habitudes",
      done: habitCount > 0,
    },
  ];

  const completedCount = steps.filter((s) => s.done).length;
  const total = steps.length;
  const percent = Math.round((completedCount / total) * 100);
  const nextStep = steps.find((s) => !s.done) ?? null;

  return {
    steps,
    completedCount,
    total,
    percent,
    nextStep,
    isComplete: completedCount === total,
  };
}
