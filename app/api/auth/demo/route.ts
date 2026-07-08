import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { establishSession } from "@/lib/auth";
import { DEMO_EMAIL, resetDemoUser } from "@/lib/demo";

// Démarre le mode démo : recharge le compte démo, applique le profil fictif,
// puis ouvre une session authentifiée (le mode démo ne contourne pas l'auth).
export async function POST() {
  try {
    const demo = await prisma.user.findUnique({ where: { email: DEMO_EMAIL } });
    if (!demo) {
      return NextResponse.json(
        {
          error:
            "Le compte de démonstration n'est pas disponible pour le moment.",
        },
        { status: 503 }
      );
    }
    await resetDemoUser();
    await establishSession(demo);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Impossible de démarrer le mode démo. Veuillez réessayer." },
      { status: 500 }
    );
  }
}
