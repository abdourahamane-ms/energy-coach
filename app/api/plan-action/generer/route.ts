import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { generateActionPlan } from "@/lib/actionplan";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }
  try {
    await generateActionPlan(user.id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Impossible de générer le plan pour le moment. Veuillez réessayer." },
      { status: 500 }
    );
  }
}
