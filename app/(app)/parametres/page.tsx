import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/PageHeader";
import LogoutButton from "@/components/LogoutButton";
import DisconnectMeterButton from "@/components/DisconnectMeterButton";

const ROLE_LABELS: Record<string, string> = {
  USER: "Utilisateur",
  ADMIN: "Administrateur",
  DEMO_USER: "Compte de démonstration",
};

export default async function ParametresPage() {
  const user = await requireUser();
  const connectedMeter = await prisma.userMeterProfile.findFirst({
    where: { userId: user.id, isConnectedDemo: true },
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Paramètres" subtitle="Votre compte et vos préférences." />

      <div className="ec-card space-y-2">
        <h2 className="font-semibold">Votre compte</h2>
        <div className="grid gap-1 text-sm">
          <Row label="Nom" value={`${user.firstName} ${user.lastName}`} />
          <Row label="Email" value={user.email} />
          <Row label="Type de compte" value={ROLE_LABELS[user.role] ?? user.role} />
        </div>
      </div>

      <div className="ec-card space-y-3">
        <h2 className="font-semibold">Simulation de compteur</h2>
        {connectedMeter ? (
          <>
            <p className="text-sm text-[var(--muted)]">
              Une simulation de compteur est actuellement active sur votre espace.
              Vous pouvez la déconnecter à tout moment.
            </p>
            <DisconnectMeterButton />
          </>
        ) : (
          <p className="text-sm text-[var(--muted)]">
            Aucune simulation de compteur active.
          </p>
        )}
      </div>

      <div className="ec-card space-y-3">
        <h2 className="font-semibold">Confidentialité</h2>
        <p className="text-sm text-[var(--muted)]">
          Vos données restent privées. Consultez notre page dédiée pour en savoir
          plus.
        </p>
        <Link href="/confidentialite" className="ec-btn ec-btn-ghost">
          Confidentialité et sécurité
        </Link>
      </div>

      <div className="ec-card flex items-center justify-between">
        <span className="text-sm text-[var(--muted)]">Terminer votre session</span>
        <LogoutButton />
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1.5 border-b border-[var(--border)] last:border-0">
      <span className="text-[var(--muted)]">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
