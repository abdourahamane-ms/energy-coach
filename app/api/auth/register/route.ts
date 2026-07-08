import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, establishSession } from "@/lib/auth";
import { registerSchema } from "@/lib/validation";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Requête invalide." },
      { status: 400 }
    );
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Données invalides." },
      { status: 400 }
    );
  }

  const { firstName, lastName, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "Un compte existe déjà avec cette adresse email." },
      { status: 409 }
    );
  }

  try {
    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        passwordHash: await hashPassword(password),
        role: "USER",
        lastLoginAt: new Date(),
      },
    });
    await establishSession(user);
    return NextResponse.json({ ok: true, firstName: user.firstName });
  } catch {
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la création du compte. Veuillez réessayer." },
      { status: 500 }
    );
  }
}
