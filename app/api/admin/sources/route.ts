import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAdmin } from "@/lib/auth";

const schema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1).max(80),
  organization: z.string().trim().max(120).optional(),
  url: z.string().trim().max(200).optional(),
  description: z.string().trim().max(300).optional(),
  isActive: z.boolean().optional(),
});

export async function POST(req: Request) {
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
  const { id, ...data } = parsed.data;
  if (id) {
    await prisma.calculationSource.update({
      where: { id },
      data: { ...data, checkedAt: new Date() },
    });
  } else {
    await prisma.calculationSource.create({
      data: { ...data, checkedAt: new Date() },
    });
  }
  return NextResponse.json({ ok: true });
}
