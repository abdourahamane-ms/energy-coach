import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAdmin } from "@/lib/auth";

const schema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1).max(80),
  category: z.string().trim().min(1).max(40),
  powerWatts: z.coerce.number().min(0).max(20000).optional(),
  defaultDailyHours: z.coerce.number().min(0).max(24).optional(),
  averageMonthlyKwh: z.coerce.number().min(0).optional(),
  impactLevel: z.enum(["faible", "moyen", "eleve"]).optional(),
  advice: z.string().trim().max(300).optional(),
  sourceId: z.string().optional(),
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
  const { id, sourceId, ...rest } = parsed.data;
  const data = { ...rest, sourceId: sourceId || null };

  if (id) {
    await prisma.device.update({ where: { id }, data });
  } else {
    await prisma.device.create({ data });
  }
  return NextResponse.json({ ok: true });
}
