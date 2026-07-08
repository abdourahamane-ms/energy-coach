import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const schema = z.object({
  devices: z.array(
    z.object({
      deviceId: z.string().min(1),
      quantity: z.coerce.number().int().min(1).max(50).default(1),
      usageHoursPerDay: z.coerce.number().min(0).max(24).optional(),
      usageDaysPerMonth: z.coerce.number().min(0).max(31).optional(),
      energyClass: z.string().trim().max(4).optional(),
      customPowerWatts: z.coerce.number().min(0).max(20000).optional(),
    })
  ),
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

  try {
    // Remplacement complet de la sélection d'appareils de l'utilisateur.
    await prisma.userDevice.deleteMany({ where: { userId: user.id } });
    if (parsed.data.devices.length > 0) {
      await prisma.userDevice.createMany({
        data: parsed.data.devices.map((d) => ({
          userId: user.id,
          deviceId: d.deviceId,
          quantity: d.quantity,
          usageHoursPerDay: d.usageHoursPerDay,
          usageDaysPerMonth: d.usageDaysPerMonth,
          energyClass: d.energyClass,
          customPowerWatts: d.customPowerWatts,
        })),
      });
    }
    return NextResponse.json({ ok: true, count: parsed.data.devices.length });
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
