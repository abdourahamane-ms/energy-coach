import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, establishSession } from "@/lib/auth";
import { loginSchema } from "@/lib/validation";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Données invalides." },
      { status: 400 }
    );
  }

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });

  // Message générique volontaire (ne révèle pas si l'email existe).
  if (!user || !user.isActive) {
    return NextResponse.json(
      { error: "Email ou mot de passe incorrect." },
      { status: 401 }
    );
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return NextResponse.json(
      { error: "Email ou mot de passe incorrect." },
      { status: 401 }
    );
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });
  await establishSession(user);

  return NextResponse.json({
    ok: true,
    firstName: user.firstName,
    role: user.role,
  });
}
