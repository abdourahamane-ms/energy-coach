import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const schema = z.object({
  id: z.string().min(1),
  isActive: z.boolean().optional(),
  role: z.enum(["USER", "ADMIN", "DEMO_USER"]).optional(),
});

export async function PATCH(req: Request) {
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "ADMIN") {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
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
  const { id, isActive, role } = parsed.data;
  // Sécurité : un admin ne peut pas se désactiver ni se rétrograder lui-même.
  if (id === admin.id && (isActive === false || (role && role !== "ADMIN"))) {
    return NextResponse.json(
      { error: "Vous ne pouvez pas modifier votre propre compte administrateur." },
      { status: 400 }
    );
  }
  await prisma.user.update({
    where: { id },
    data: {
      ...(isActive !== undefined ? { isActive } : {}),
      ...(role ? { role } : {}),
    },
  });
  return NextResponse.json({ ok: true });
}
