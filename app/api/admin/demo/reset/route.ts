import { NextResponse } from "next/server";
import { getAdmin } from "@/lib/auth";
import { resetDemoUser } from "@/lib/demo";

// Réinitialise le compte démo à partir du profil démo principal.
export async function POST() {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  try {
    await resetDemoUser();
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Impossible de réinitialiser le compte démo." },
      { status: 500 }
    );
  }
}
