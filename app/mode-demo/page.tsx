import Link from "next/link";
import { redirect } from "next/navigation";
import DemoButton from "@/components/DemoButton";
import { getCurrentUser } from "@/lib/auth";

export default async function ModeDemoPage() {
  const user = await getCurrentUser();
  if (user) redirect("/tableau-de-bord");

  return (
    <main className="flex-1">
      <header className="border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto max-w-3xl px-5 h-16 flex items-center">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--primary)] text-white">
              ⚡
            </span>
            Energy Coach
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-5 py-14 text-center">
        <span className="ec-badge mb-4">Mode démonstration</span>
        <h1 className="text-3xl font-bold">Découvrez Energy Coach en un clic</h1>
        <p className="mt-4 text-[var(--muted)]">
          Le mode démo vous connecte à un compte fictif déjà rempli : profil
          logement, appareils, habitudes et compteur simulé. Vous pouvez explorer
          le diagnostic, les recommandations, les graphiques et le plan
          d&apos;action, avec des données entièrement fictives.
        </p>
        <div className="mt-8 flex justify-center">
          <DemoButton
            className="ec-btn ec-btn-primary text-base px-6 py-3"
            label="Lancer le mode démo"
          />
        </div>
        <p className="mt-6 text-sm text-[var(--muted)]">
          Vous préférez votre propre compte ?{" "}
          <Link href="/inscription" className="text-[var(--primary)] font-semibold">
            Créer un compte
          </Link>
        </p>
      </div>
    </main>
  );
}
