import "server-only";
import { prisma } from "@/lib/prisma";

// Prix de secours si la base ne contient pas de prix de référence.
const FALLBACK_PRICE: Record<string, number> = {
  electricite: 0.25,
  gaz: 0.11,
  mixte: 0.2,
};

// Prix du kWh de référence (défini par l'administrateur via EnergyPrice).
export async function getDefaultKwhPrice(
  energyType: string = "electricite"
): Promise<number> {
  const price = await prisma.energyPrice.findFirst({
    where: { energyType, isDefault: true },
  });
  if (price) return price.pricePerKwh;
  const any = await prisma.energyPrice.findFirst({ where: { energyType } });
  return any?.pricePerKwh ?? FALLBACK_PRICE[energyType] ?? 0.25;
}

// Estimation des kWh à partir d'une facture : facture / prix du kWh.
export function estimateKwhFromBill(bill: number, pricePerKwh: number): number {
  if (pricePerKwh <= 0) return 0;
  return bill / pricePerKwh;
}

// Consommation mensuelle d'un appareil (kWh) :
// puissance (W) × heures/jour × jours/mois × quantité / 1000.
export function deviceMonthlyKwh(u: {
  quantity?: number | null;
  usageHoursPerDay?: number | null;
  usageDaysPerMonth?: number | null;
  customPowerWatts?: number | null;
  device: { powerWatts?: number | null; defaultDailyHours?: number | null };
}): number {
  const power = u.customPowerWatts ?? u.device.powerWatts ?? 0;
  const hours = u.usageHoursPerDay ?? u.device.defaultDailyHours ?? 0;
  const days = u.usageDaysPerMonth ?? 30;
  const qty = u.quantity ?? 1;
  return (power * hours * days * qty) / 1000;
}

export const round2 = (n: number) => Math.round(n * 100) / 100;
export const round1 = (n: number) => Math.round(n * 10) / 10;

export const eur = (n: number) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(n);

export const kwh = (n: number) =>
  `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(
    Math.round(n)
  )} kWh`;
