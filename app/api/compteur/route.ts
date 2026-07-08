import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { meterChoiceSchema } from "@/lib/validation";

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

  const parsed = meterChoiceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Données invalides." },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const meterType = await prisma.meterType.findUnique({
    where: { slug: data.meterSlug },
  });
  if (!meterType) {
    return NextResponse.json(
      { error: "Type de compteur non reconnu." },
      { status: 400 }
    );
  }

  try {
    // Un seul compteur actif par utilisateur : on remplace l'existant
    // (sauf les compteurs de démo connectés via QR, conservés).
    await prisma.userMeterProfile.deleteMany({
      where: { userId: user.id, isConnectedDemo: false },
    });
    await prisma.userMeterProfile.create({
      data: {
        userId: user.id,
        meterTypeId: meterType.id,
        label: data.label ?? meterType.name,
        manualMonthlyBillEuro: data.manualMonthlyBillEuro,
        manualMonthlyKwh: data.manualMonthlyKwh,
        prepaidMonthlyBudget: data.prepaidMonthlyBudget,
        prepaidRechargeAmount: data.prepaidRechargeAmount,
        prepaidRechargeFrequency: data.prepaidRechargeFrequency,
      },
    });

    // Report des montants renseignés sur le profil logement (utile au diagnostic).
    const billFromPrepaid = data.prepaidMonthlyBudget;
    const bill = data.manualMonthlyBillEuro ?? billFromPrepaid;
    if (bill || data.manualMonthlyKwh) {
      await prisma.housingProfile.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          monthlyBillEuro: bill,
          monthlyConsumptionKwh: data.manualMonthlyKwh,
        },
        update: {
          ...(bill ? { monthlyBillEuro: bill } : {}),
          ...(data.manualMonthlyKwh
            ? { monthlyConsumptionKwh: data.manualMonthlyKwh }
            : {}),
        },
      });
    }

    return NextResponse.json({ ok: true, energyType: meterType.energyType });
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
