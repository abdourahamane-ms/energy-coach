import { SignJWT, jwtVerify } from "jose";

// Gestion des sessions via un JWT signé stocké dans un cookie httpOnly.
// jose fonctionne aussi bien côté serveur Node que dans le middleware (edge).

export const SESSION_COOKIE = "ec_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 jours

export type SessionPayload = {
  sub: string; // id utilisateur
  role: string;
  isDemo: boolean;
};

function getSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("SESSION_SECRET manquant ou trop court.");
  }
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ role: payload.role, isDemo: payload.isDemo })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(getSecret());
}

export async function verifySessionToken(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (!payload.sub) return null;
    return {
      sub: payload.sub as string,
      role: (payload.role as string) ?? "USER",
      isDemo: Boolean(payload.isDemo),
    };
  } catch {
    return null;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: MAX_AGE_SECONDS,
};
