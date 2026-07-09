"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  House,
  Buildings,
  Plug,
  Television,
  ArrowsClockwise,
  Stethoscope,
  Lightbulb,
  ChartBar,
  Target,
  Gear,
  Wrench,
  SignOut,
} from "@phosphor-icons/react";
import Logo from "@/components/Logo";
import { logoutAction } from "@/app/actions/auth";

const NAV = [
  { href: "/tableau-de-bord", label: "Tableau de bord", Icon: House },
  { href: "/profil-logement", label: "Mon logement", Icon: Buildings },
  { href: "/compteur", label: "Mon compteur", Icon: Plug },
  { href: "/appareils", label: "Mes appareils", Icon: Television },
  { href: "/habitudes", label: "Mes habitudes", Icon: ArrowsClockwise },
  { href: "/diagnostic", label: "Diagnostic", Icon: Stethoscope },
  { href: "/recommandations", label: "Recommandations", Icon: Lightbulb },
  { href: "/graphiques", label: "Graphiques", Icon: ChartBar },
  { href: "/plan-action", label: "Plan d'action", Icon: Target },
  { href: "/parametres", label: "Paramètres", Icon: Gear },
];

export default function AppSidebar({
  isAdmin,
  name,
  initials,
}: {
  isAdmin: boolean;
  name: string;
  initials: string;
}) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full bg-[var(--sidebar)] text-[var(--sidebar-text)]">
      <div className="px-5 pt-6 pb-4">
        <Link href="/tableau-de-bord">
          <Logo onDark size={30} />
        </Link>
      </div>

      <div className="px-5 pt-2 pb-2 text-[11px] font-bold tracking-[0.12em] text-[var(--sidebar-sub)]">
        MON PARCOURS
      </div>

      <nav className="flex-1 overflow-y-auto px-3 space-y-0.5">
        {NAV.map(({ href, label, Icon }) => {
          const active =
            pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                active
                  ? "bg-[var(--sidebar-active)] text-white"
                  : "text-[var(--sidebar-text)] hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon size={19} weight={active ? "fill" : "regular"} />
              {label}
            </Link>
          );
        })}

        {isAdmin && (
          <Link
            href="/admin"
            className="mt-2 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-white bg-white/10 hover:bg-white/15 transition"
          >
            <Wrench size={19} />
            Espace admin
          </Link>
        )}
      </nav>

      <div className="p-3 border-t border-white/10">
        <div className="flex items-center gap-3 px-2 py-2">
          <span className="shrink-0 w-9 h-9 rounded-full bg-[var(--sidebar-active)] text-white flex items-center justify-center text-xs font-bold">
            {initials}
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-white truncate">{name}</div>
            <form action={logoutAction}>
              <button
                type="submit"
                className="text-xs text-[var(--sidebar-sub)] hover:text-white flex items-center gap-1"
              >
                <SignOut size={13} /> Se déconnecter
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
