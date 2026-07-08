import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex-1 flex items-center justify-center px-5 py-20 text-center">
      <div className="max-w-md">
        <div className="text-5xl">🧭</div>
        <h1 className="mt-4 text-2xl font-bold">Page introuvable</h1>
        <p className="mt-2 text-[var(--muted)]">
          La page que vous cherchez n&apos;existe pas ou a été déplacée.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/" className="ec-btn ec-btn-primary">
            Retour à l&apos;accueil
          </Link>
          <Link href="/tableau-de-bord" className="ec-btn ec-btn-ghost">
            Mon espace
          </Link>
        </div>
      </div>
    </main>
  );
}
