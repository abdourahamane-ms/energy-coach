import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// Déconnecte une simulation de compteur (droit de l'utilisateur).
export async function POST() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }
  try {
    await prisma.userMeterProfile.deleteMany({
      where: { userId: user.id, isConnectedDemo: true },
    });
    await prisma.meterReading.deleteMany({
      where: { userId: user.id, isDemo: true },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Une erreur est survenue. Veuillez réessayer." },
      { status: 500 }
    );
  }
}
