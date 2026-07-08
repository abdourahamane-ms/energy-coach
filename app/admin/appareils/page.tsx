import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/PageHeader";
import DeviceManager from "@/components/admin/DeviceManager";

export default async function AdminDevicesPage() {
  const [devices, sources] = await Promise.all([
    prisma.device.findMany({ orderBy: [{ category: "asc" }, { name: "asc" }] }),
    prisma.calculationSource.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <div>
      <PageHeader
        title="Bibliothèque d'appareils"
        subtitle="Créez, modifiez ou désactivez les appareils proposés aux utilisateurs."
      />
      <DeviceManager
        devices={devices.map((d) => ({
          id: d.id,
          name: d.name,
          category: d.category,
          powerWatts: d.powerWatts,
          averageMonthlyKwh: d.averageMonthlyKwh,
          impactLevel: d.impactLevel,
          advice: d.advice,
          sourceId: d.sourceId,
          isActive: d.isActive,
        }))}
        sources={sources}
      />
    </div>
  );
}
