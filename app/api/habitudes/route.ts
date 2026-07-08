import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const schema = z.object({
  answers: z.array(
    z.object({
      habitId: z.string().min(1),
      answerValue: z.enum([
        "jamais",
        "rarement",
        "parfois",
        "souvent",
        "tres_souvent",
      ]),
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
    for (const a of parsed.data.answers) {
      await prisma.userHabit.upsert({
        where: {
          userId_habitId: { userId: user.id, habitId: a.habitId },
        },
        create: {
          userId: user.id,
          habitId: a.habitId,
          answerValue: a.answerValue,
        },
        update: { answerValue: a.answerValue },
      });
    }
    return NextResponse.json({ ok: true });
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
