import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/PageHeader";
import DeviceLibrary from "@/components/DeviceLibrary";

export default async function AppareilsPage() {
  const user = await requireUser();
  const [library, userDevices] = await Promise.all([
    prisma.device.findMany({
      where: { isActive: true },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    }),
    prisma.userDevice.findMany({ where: { userId: user.id } }),
  ]);

  const initialSelected = userDevices.map((u) => ({
    deviceId: u.deviceId,
    quantity: u.quantity,
    usageHoursPerDay: u.usageHoursPerDay ?? undefined,
    usageDaysPerMonth: u.usageDaysPerMonth ?? undefined,
  }));

  return (
    <div>
      <PageHeader
        title="Mes appareils"
        subtitle="Sélectionnez vos appareils et précisez leur usage. Plus c'est précis, meilleur est le diagnostic."
      />
      <DeviceLibrary library={library} initialSelected={initialSelected} />
    </div>
  );
}
