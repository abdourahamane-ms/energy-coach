import "server-only";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import {
  SESSION_COOKIE,
  createSessionToken,
  verifySessionToken,
  sessionCookieOptions,
} from "@/lib/session";
import type { User } from "@prisma/client";

// Détermine si le cookie doit être marqué `Secure`.
// On l'active uniquement en HTTPS réel : ainsi l'application fonctionne aussi
// bien en local sur http://localhost (dev ET build de production) que derrière
// un proxy HTTPS en déploiement.
async function shouldUseSecureCookie(): Promise<boolean> {
  const h = await headers();
  const proto = h.get("x-forwarded-proto");
  if (proto) return proto.split(",")[0].trim() === "https";
  return false;
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(
  plain: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

// Établit la session pour un utilisateur (écrit le cookie).
export async function establishSession(user: {
  id: string;
  role: string;
  isDemo: boolean;
}) {
  const token = await createSessionToken({
    sub: user.id,
    role: user.role,
    isDemo: user.isDemo,
  });
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    ...sessionCookieOptions,
    secure: await shouldUseSecureCookie(),
  });
}

export async function clearSession() {
  const store = await cookies();
  store.set(SESSION_COOKIE, "", {
    ...sessionCookieOptions,
    secure: await shouldUseSecureCookie(),
    maxAge: 0,
  });
}

// Retourne l'utilisateur courant ou null (lecture seule).
export async function getCurrentUser(): Promise<User | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const payload = await verifySessionToken(token);
  if (!payload) return null;
  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user || !user.isActive) return null;
  return user;
}

// Exige un utilisateur connecté, sinon redirige vers la connexion.
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion");
  return user;
}

// Retourne l'utilisateur courant s'il est administrateur, sinon null.
// Pratique pour les routes API (renvoyer un 403).
export async function getAdmin(): Promise<User | null> {
  const user = await getCurrentUser();
  return user && user.role === "ADMIN" ? user : null;
}

// Exige un administrateur, sinon redirige.
export async function requireAdmin(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion");
  if (user.role !== "ADMIN") redirect("/tableau-de-bord");
  return user;
}
