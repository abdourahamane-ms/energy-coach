import Link from "next/link";

// Affiché lorsque les données ne suffisent pas encore pour analyser.
export default function NeedProfile({
  nextHref = "/profil-logement",
}: {
  nextHref?: string;
}) {
  return (
    <div className="ec-card text-center py-10">
      <div className="text-4xl">📝</div>
      <h2 className="mt-3 font-semibold text-lg">
        Complétez votre profil pour obtenir un diagnostic personnalisé
      </h2>
      <p className="text-[var(--muted)] mt-2 max-w-md mx-auto">
        Renseignez votre logement, votre facture et vos appareils pour que nous
        puissions estimer votre consommation et vos économies possibles.
      </p>
      <Link href={nextHref} className="ec-btn ec-btn-primary mt-5">
        Compléter mon profil
      </Link>
    </div>
  );
}
