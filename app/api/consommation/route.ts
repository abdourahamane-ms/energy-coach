import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import {
  getDefaultKwhPrice,
  estimateKwhFromBill,
  round1,
} from "@/lib/energy";

const schema = z
  .object({
    monthlyBillEuro: z.coerce.number().positive().optional(),
    monthlyKwh: z.coerce.number().positive().optional(),
    kwhPrice: z.coerce.number().positive().optional(),
    periodStart: z.string().optional(),
    periodEnd: z.string().optional(),
  })
  .refine((d) => d.monthlyBillEuro || d.monthlyKwh, {
    message: "Indiquez au moins une facture ou une consommation.",
  });

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
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Données invalides." },
      { status: 400 }
    );
  }

  const { monthlyBillEuro, monthlyKwh, kwhPrice, periodStart, periodEnd } =
    parsed.data;

  try {
    const housing = await prisma.housingProfile.findUnique({
      where: { userId: user.id },
    });
    const energyType = housing?.mainEnergy ?? "electricite";
    const price =
      kwhPrice ?? housing?.knownKwhPrice ?? (await getDefaultKwhPrice(energyType));

    // Cas 2 (facture seule) : on estime les kWh. Cas 1 : kWh fournis.
    const consumptionKwh = monthlyKwh
      ? monthlyKwh
      : monthlyBillEuro
        ? round1(estimateKwhFromBill(monthlyBillEuro, price))
        : undefined;
    const costEuro =
      monthlyBillEuro ??
      (monthlyKwh ? round1(monthlyKwh * price) : undefined);

    await prisma.housingProfile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        monthlyBillEuro: costEuro,
        monthlyConsumptionKwh: consumptionKwh,
        knownKwhPrice: kwhPrice ?? undefined,
      },
      update: {
        monthlyBillEuro: costEuro,
        monthlyConsumptionKwh: consumptionKwh,
        ...(kwhPrice ? { knownKwhPrice: kwhPrice } : {}),
      },
    });

    await prisma.meterReading.create({
      data: {
        userId: user.id,
        consumptionKwh,
        costEuro,
        sourceType: monthlyKwh ? "manual" : "estimated",
        periodStart: periodStart ? new Date(periodStart) : undefined,
        periodEnd: periodEnd ? new Date(periodEnd) : undefined,
      },
    });

    return NextResponse.json({
      ok: true,
      consumptionKwh,
      costEuro,
      priceUsed: price,
    });
  } catch {
    return NextResponse.json(
      {
        error:
          "Une erreur est survenue lors de l'enregistrement. Veuillez réessayer.",
      },
      { status: 500 }
    );
  }
}
