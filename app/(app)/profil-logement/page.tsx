import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/PageHeader";
import ProfileForm from "@/components/ProfileForm";

export default async function ProfilLogementPage() {
  const user = await requireUser();
  const housing = await prisma.housingProfile.findUnique({
    where: { userId: user.id },
  });

  return (
    <div>
      <PageHeader
        title="Profil logement"
        subtitle="Ces informations nous permettent d'estimer votre consommation et de personnaliser vos recommandations."
      />
      <div className="ec-card">
        <ProfileForm initial={housing ?? {}} />
      </div>
    </div>
  );
}
