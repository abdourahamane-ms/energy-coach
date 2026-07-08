import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/PageHeader";
import RecoManager from "@/components/admin/RecoManager";

export default async function AdminRecosPage() {
  const recos = await prisma.recommendation.findMany({
    orderBy: { title: "asc" },
    include: {
      rule: { select: { title: true } },
      source: { select: { name: true } },
    },
  });
  return (
    <div>
      <PageHeader
        title="Recommandations"
        subtitle="Le contenu des recommandations proposées aux utilisateurs."
      />
      <RecoManager
        recos={recos.map((r) => ({
          id: r.id,
          title: r.title,
          category: r.category,
          shortDescription: r.shortDescription,
          detailedExplanation: r.detailedExplanation,
          effortLevel: r.effortLevel,
          impactLevel: r.impactLevel,
          ruleTitle: r.rule?.title ?? null,
          sourceName: r.source?.name ?? null,
          isActive: r.isActive,
        }))}
      />
    </div>
  );
}
