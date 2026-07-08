import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import AdminNav from "@/components/AdminNav";
import LogoutButton from "@/components/LogoutButton";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();

  return (
    <div className="min-h-full flex flex-col">
      <header className="bg-[var(--foreground)] text-white">
        <div className="mx-auto max-w-7xl px-5 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="font-bold flex items-center gap-2">
              🛠️ Administration
            </Link>
            <span className="text-xs bg-white/15 px-2 py-0.5 rounded-full">
              Energy Coach
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/tableau-de-bord" className="text-white/80 hover:text-white">
              ← Espace utilisateur
            </Link>
            <span className="text-white/60">{admin.email}</span>
            <LogoutButton />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl w-full px-5 py-6 flex gap-6 flex-1">
        <aside className="hidden md:block w-56 shrink-0">
          <div className="sticky top-6">
            <AdminNav />
          </div>
        </aside>
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
