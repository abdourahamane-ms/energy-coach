import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import PageHeader from "@/components/PageHeader";
import QrScanner from "@/components/QrScanner";

export default async function ScanQrPage() {
  await requireUser();
  const profiles = await prisma.demoProfile.findMany({
    where: { isActive: true },
  });

  const demoQrs = profiles
    .filter((p) => p.qrCodePath && p.qrPayload)
    .map((p) => {
      let type = "";
      try {
        type = new URL(p.qrPayload!).searchParams.get("type") ?? "";
      } catch {}
      return {
        name: p.name,
        payload: p.qrPayload!,
        image: p.qrCodePath!,
        type,
      };
    });

  return (
    <div>
      <PageHeader
        title="Simulation compteur (QR code)"
        subtitle="Scannez un QR code Energy Coach pour associer des données de démonstration à votre espace."
      />
      <QrScanner demoQrs={demoQrs} />
    </div>
  );
}
