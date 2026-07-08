import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAdmin } from "@/lib/auth";

const schema = z.object({
  id: z.string().min(1),
  title: z.string().trim().min(1).max(120).optional(),
  description: z.string().trim().max(400).optional(),
  coefficient: z.coerce.number().min(0).max(1).optional(),
  sourceId: z.string().optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(req: Request) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "Accès refusé." }, { status: 403 });

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
  const { id, sourceId, ...rest } = parsed.data;
  await prisma.calculationRule.update({
    where: { id },
    data: { ...rest, ...(sourceId !== undefined ? { sourceId: sourceId || null } : {}) },
  });
  return NextResponse.json({ ok: true });
}
