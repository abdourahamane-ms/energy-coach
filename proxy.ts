import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";

// Proxy (ex-middleware depuis Next.js 16) — vérification optimiste de session.
// La véritable autorisation reste faite côté serveur (requireUser/requireAdmin).
const PROTECTED_PREFIXES = [
  "/tableau-de-bord",
  "/profil-logement",
  "/compteur",
  "/consommation",
  "/scan-qr",
  "/appareils",
  "/habitudes",
  "/diagnostic",
  "/recommandations",
  "/graphiques",
  "/plan-action",
  "/parametres",
  "/admin",
];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
  if (!isProtected) return NextResponse.next();

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (!session) {
    const url = req.nextUrl.clone();
    url.pathname = "/connexion";
    url.searchParams.set("suite", pathname);
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/admin") && session.role !== "ADMIN") {
    const url = req.nextUrl.clone();
    url.pathname = "/tableau-de-bord";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|qrcodes|.*\\.png$).*)"],
};
