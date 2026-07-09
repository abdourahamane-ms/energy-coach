"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  hashPassword,
  verifyPassword,
  establishSession,
  clearSession,
} from "@/lib/auth";
import { loginSchema, registerSchema } from "@/lib/validation";
import { DEMO_EMAIL, resetDemoUser } from "@/lib/demo";

export type AuthState = { error?: string };

function safeSuite(v: FormDataEntryValue | null): string | null {
  if (typeof v !== "string") return null;
  // On n'autorise que des chemins internes (anti open-redirect).
  if (v.startsWith("/") && !v.startsWith("//")) return v;
  return null;
}

// Connexion — fonctionne même sans JavaScript (Server Action, POST natif).
export async function loginAction(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive) {
    return { error: "Email ou mot de passe incorrect." };
  }
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    return { error: "Email ou mot de passe incorrect." };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });
  await establishSession(user);

  const suite = safeSuite(formData.get("suite"));
  redirect(user.role === "ADMIN" ? "/admin" : suite ?? "/tableau-de-bord");
}

// Inscription — fonctionne aussi sans JavaScript.
export async function registerAction(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const parsed = registerSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }

  const { firstName, lastName, email, password } = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "Un compte existe déjà avec cette adresse email." };
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
  } catch {
    return {
      error:
        "Une erreur est survenue lors de la création du compte. Veuillez réessayer.",
    };
  }
  redirect("/tableau-de-bord");
}

// Démarrage du mode démo — Server Action (fonctionne sans JS).
export async function demoAction() {
  const demo = await prisma.user.findUnique({ where: { email: DEMO_EMAIL } });
  if (!demo) {
    redirect("/connexion?erreur=demo");
  }
  await resetDemoUser();
  await establishSession(demo);
  redirect("/tableau-de-bord");
}

// Déconnexion — Server Action.
export async function logoutAction() {
  await clearSession();
  redirect("/");
}
