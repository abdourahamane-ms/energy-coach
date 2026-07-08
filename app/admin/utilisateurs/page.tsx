import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/PageHeader";
import UsersTable from "@/components/admin/UsersTable";

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      housingProfile: { select: { housingType: true, surfaceM2: true } },
      meterProfiles: {
        take: 1,
        orderBy: { createdAt: "desc" },
        include: { meterType: true },
      },
    },
  });

  const rows = users.map((u) => ({
    id: u.id,
    name: `${u.firstName} ${u.lastName}`,
    email: u.email,
    role: u.role,
    createdAt: u.createdAt.toISOString(),
    profileComplete: Boolean(
      u.housingProfile?.housingType && u.housingProfile?.surfaceM2
    ),
    meter: u.meterProfiles[0]?.meterType.name ?? null,
    isActive: u.isActive,
  }));

  return (
    <div>
      <PageHeader
        title="Utilisateurs"
        subtitle="Gérez les rôles et l'accès des comptes. Les mots de passe ne sont jamais affichés."
      />
      <UsersTable rows={rows} />
    </div>
  );
}
