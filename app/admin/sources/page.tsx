import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/PageHeader";
import SourceManager from "@/components/admin/SourceManager";

export default async function AdminSourcesPage() {
  const sources = await prisma.calculationSource.findMany({
    orderBy: { name: "asc" },
  });
  return (
    <div>
      <PageHeader
        title="Sources"
        subtitle="Les sources sur lesquelles reposent les calculs et recommandations."
      />
      <SourceManager sources={sources} />
    </div>
  );
}
