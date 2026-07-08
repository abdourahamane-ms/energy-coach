import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/PageHeader";
import RuleManager from "@/components/admin/RuleManager";

export default async function AdminRulesPage() {
  const rules = await prisma.calculationRule.findMany({
    orderBy: { title: "asc" },
    include: { source: { select: { name: true } } },
  });
  return (
    <div>
      <PageHeader
        title="Règles de calcul"
        subtitle="Les coefficients utilisés pour estimer les économies. Modifier un coefficient met à jour les recommandations correspondantes."
      />
      <RuleManager
        rules={rules.map((r) => ({
          id: r.id,
          key: r.key,
          title: r.title,
          description: r.description,
          coefficient: r.coefficient,
          targetCategory: r.targetCategory,
          sourceName: r.source?.name ?? null,
          isActive: r.isActive,
        }))}
      />
    </div>
  );
}
