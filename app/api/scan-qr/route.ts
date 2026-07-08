import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { qrScanSchema } from "@/lib/validation";
import { applyDemoMeterToUser } from "@/lib/demo";

const PREFIX = "energycoach://connect-meter";
const ALLOWED_TYPES = new Set(["linky", "gazpar", "prepaid"]);

const INVALID_MESSAGE =
  "QR code non reconnu. Ce QR code ne correspond pas à un compteur Energy Coach. Utilisez un QR code Energy Coach valide ou choisissez la saisie manuelle.";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const parsed = qrScanSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: INVALID_MESSAGE }, { status: 400 });
  }

  const payload = parsed.data.payload.trim();

  // 1. Le contenu doit être un lien Energy Coach de connexion compteur.
  if (!payload.startsWith(PREFIX)) {
    return NextResponse.json({ error: INVALID_MESSAGE }, { status: 400 });
  }

  // 2. Extraire le type et l'identifiant.
  let type: string | null = null;
  let meterId: string | null = null;
  try {
    const url = new URL(payload);
    type = url.searchParams.get("type");
    meterId = url.searchParams.get("meterId");
  } catch {
    return NextResponse.json({ error: INVALID_MESSAGE }, { status: 400 });
  }

  // 3. Type autorisé ?
  if (!type || !ALLOWED_TYPES.has(type) || !meterId) {
    return NextResponse.json({ error: INVALID_MESSAGE }, { status: 400 });
  }

  // 4. L'identifiant doit exister en base (profil démo) avec le bon type.
  const profiles = await prisma.demoProfile.findMany({ where: { isActive: true } });
  const match = profiles.find((p) => {
    try {
      const meter = JSON.parse(p.meterDataJson ?? "null");
      return (
        meter?.demoMeterIdentifier === meterId &&
        (p.qrPayload?.includes(`type=${type}`) ?? false)
      );
    } catch {
      return false;
    }
  });

  if (!match) {
    return NextResponse.json({ error: INVALID_MESSAGE }, { status: 400 });
  }

  // 5-6. Charger UNIQUEMENT les données de compteur (consommation) et les
  // associer à l'utilisateur. Les appareils et habitudes restent à sa charge.
  try {
    await applyDemoMeterToUser(user.id, match.slug);
    return NextResponse.json({
      ok: true,
      message:
        "Simulation compteur activée — les données de consommation fictives ont été associées à votre espace. Renseignez vos appareils et habitudes pour un diagnostic complet.",
      profileName: match.name,
    });
  } catch {
    return NextResponse.json(
      {
        error:
          "Une erreur est survenue lors de l'activation de la simulation. Veuillez réessayer.",
      },
      { status: 500 }
    );
  }
}
