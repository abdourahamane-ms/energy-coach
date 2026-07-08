import Link from "next/link";

export default function ConfidentialitePage() {
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
      <div className="mx-auto max-w-3xl px-5 py-10 space-y-5">
        <h1 className="text-2xl font-bold">Confidentialité et sécurité</h1>
        <p className="text-[var(--muted)]">
          Energy Coach est conçu pour respecter vos données et rester
          transparent sur ses estimations.
        </p>

        <div className="ec-card space-y-3">
          <h2 className="font-semibold">Vos données</h2>
          <ul className="list-disc pl-5 space-y-1 text-[var(--muted)]">
            <li>Votre mot de passe est stocké de façon sécurisée (haché).</li>
            <li>Vos pages personnelles sont protégées par authentification.</li>
            <li>Vos données ne sont visibles que par vous (et un administrateur pour le support).</li>
            <li>Vous pouvez déconnecter à tout moment une simulation de compteur.</li>
          </ul>
        </div>

        <div className="ec-card space-y-3">
          <h2 className="font-semibold">À propos des estimations</h2>
          <p className="text-[var(--muted)]">
            Les économies affichées sont des estimations. Elles peuvent varier
            selon l&apos;usage réel, la météo, le logement et le prix de
            l&apos;énergie. Energy Coach ne garantit pas un montant d&apos;économie.
          </p>
        </div>

        <Link href="/" className="ec-btn ec-btn-ghost">
          ← Retour à l&apos;accueil
        </Link>
      </div>
    </main>
  );
}
