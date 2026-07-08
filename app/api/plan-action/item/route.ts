import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const schema = z.object({
  itemId: z.string().min(1),
  isCompleted: z.boolean(),
});

export async function PATCH(req: Request) {
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
    return NextResponse.json({ error: "Données invalides." }, { status: 400 });
  }

  // Vérifie que l'action appartient bien à un plan de l'utilisateur.
  const item = await prisma.actionItem.findUnique({
    where: { id: parsed.data.itemId },
    include: { actionPlan: true },
  });
  if (!item || item.actionPlan.userId !== user.id) {
    return NextResponse.json({ error: "Action introuvable." }, { status: 404 });
  }

  await prisma.actionItem.update({
    where: { id: item.id },
    data: {
      isCompleted: parsed.data.isCompleted,
      completedAt: parsed.data.isCompleted ? new Date() : null,
    },
  });

  return NextResponse.json({ ok: true });
}
