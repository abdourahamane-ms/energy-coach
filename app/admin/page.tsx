import Link from "next/link";
import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/PageHeader";

export default async function AdminHomePage() {
  const [users, devices, sources, rules, recos, demos] = await Promise.all([
    prisma.user.count(),
    prisma.device.count(),
    prisma.calculationSource.count(),
    prisma.calculationRule.count(),
    prisma.recommendation.count(),
    prisma.demoProfile.count(),
  ]);

  const cards = [
    { label: "Utilisateurs", value: users, href: "/admin/utilisateurs", icon: "👥" },
    { label: "Appareils", value: devices, href: "/admin/appareils", icon: "📺" },
    { label: "Sources", value: sources, href: "/admin/sources", icon: "📚" },
    { label: "Règles de calcul", value: rules, href: "/admin/regles", icon: "🧮" },
    { label: "Recommandations", value: recos, href: "/admin/recommandations", icon: "💡" },
    { label: "Profils démo", value: demos, href: "/admin/profils-demo", icon: "🎬" },
  ];

  return (
    <div>
      <PageHeader
        title="Vue d'ensemble"
        subtitle="Gérez le contenu et les utilisateurs d'Energy Coach."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <Link key={c.href} href={c.href} className="ec-card hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <span className="text-2xl">{c.icon}</span>
              <span className="text-3xl font-extrabold">{c.value}</span>
            </div>
            <p className="mt-2 font-medium text-[var(--muted)]">{c.label}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
