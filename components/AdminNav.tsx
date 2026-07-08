"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/admin", label: "Vue d'ensemble", icon: "📊" },
  { href: "/admin/utilisateurs", label: "Utilisateurs", icon: "👥" },
  { href: "/admin/appareils", label: "Appareils", icon: "📺" },
  { href: "/admin/sources", label: "Sources", icon: "📚" },
  { href: "/admin/regles", label: "Règles de calcul", icon: "🧮" },
  { href: "/admin/recommandations", label: "Recommandations", icon: "💡" },
  { href: "/admin/profils-demo", label: "Profils démo", icon: "🎬" },
  { href: "/admin/qr-codes", label: "QR codes démo", icon: "🔳" },
];

export default function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="space-y-1">
      {NAV.map((item) => {
        const active =
          item.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
              active
                ? "bg-[var(--foreground)] text-white"
                : "text-[var(--muted)] hover:bg-[var(--border)]/60"
            }`}
          >
            <span>{item.icon}</span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
