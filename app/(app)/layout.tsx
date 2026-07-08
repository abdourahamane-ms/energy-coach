import Link from "next/link";
import { requireUser } from "@/lib/auth";
import AppSidebar from "@/components/AppSidebar";
import Logo from "@/components/Logo";
import LogoutButton from "@/components/LogoutButton";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const isAdmin = user.role === "ADMIN";
  const name = `${user.firstName} ${user.lastName}`;
  const initials = `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`.toUpperCase();

  return (
    <div className="min-h-full md:flex">
      {/* Sidebar foncée fixe (desktop) */}
      <aside className="hidden md:flex md:flex-col md:w-[250px] md:shrink-0 md:fixed md:inset-y-0">
        <AppSidebar isAdmin={isAdmin} name={name} initials={initials} />
      </aside>

      {/* Colonne principale */}
      <div className="flex-1 md:ml-[250px] flex flex-col min-h-screen">
        {/* Bandeau démo */}
        {user.isDemo && (
          <div className="bg-[#f4ecd8] text-[#7a5f22] text-sm font-semibold text-center py-2.5 px-4 flex items-center justify-center gap-2">
            <span>●</span> Mode démo activé — les données affichées sont
            fictives.
          </div>
        )}

        {/* Top bar mobile */}
        <header className="md:hidden sticky top-0 z-20 bg-[var(--surface)] border-b border-[var(--border)]">
          <div className="px-5 h-14 flex items-center justify-between">
            <Link href="/tableau-de-bord">
              <Logo size={28} />
            </Link>
            <LogoutButton />
          </div>
        </header>

        <main className="flex-1 min-w-0 px-5 sm:px-8 py-7 max-w-[1200px] w-full mx-auto pb-24 md:pb-10">
          {children}
        </main>

        {/* Navigation mobile */}
        <MobileNav isAdmin={isAdmin} />
      </div>
    </div>
  );
}

function MobileNav({ isAdmin }: { isAdmin: boolean }) {
  return (
    <div className="md:hidden fixed bottom-0 inset-x-0 z-20 border-t border-[var(--border)] bg-[var(--surface)]">
      <div className="flex">
        {[
          { href: "/tableau-de-bord", label: "Accueil", icon: "🏠" },
          { href: "/diagnostic", label: "Diagnostic", icon: "🩺" },
          { href: "/recommandations", label: "Actions", icon: "💡" },
          { href: "/plan-action", label: "Plan", icon: "🎯" },
          { href: "/parametres", label: "Réglages", icon: "⚙️" },
          ...(isAdmin ? [{ href: "/admin", label: "Admin", icon: "🛠️" }] : []),
        ].map((i) => (
          <Link
            key={i.href}
            href={i.href}
            className="flex-1 min-w-[60px] py-2 text-center text-[11px] text-[var(--muted)]"
          >
            <div className="text-lg">{i.icon}</div>
            {i.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
