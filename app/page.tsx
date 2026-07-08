import Link from "next/link";
import {
  Leaf,
  ArrowRight,
  PlayCircle,
  MagnifyingGlass,
  Sparkle,
  ChartLineUp,
  Check,
} from "@phosphor-icons/react/dist/ssr";
import Logo from "@/components/Logo";
import DemoButton from "@/components/DemoButton";
import { getCurrentUser } from "@/lib/auth";

export default async function HomePage() {
  const user = await getCurrentUser();

  return (
    <div className="flex flex-col min-h-full">
      {/* Top bar translucide */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-[rgba(246,247,244,0.82)] border-b border-[var(--border)]">
        <div className="mx-auto max-w-[1180px] px-6 sm:px-10 h-[70px] flex items-center justify-between">
          <Link href="/">
            <Logo />
          </Link>
          <nav className="flex items-center gap-2">
            <Link
              href="/confidentialite"
              className="hidden sm:inline px-3.5 py-2.5 text-sm font-semibold text-[var(--muted)] rounded-lg hover:text-[var(--foreground)]"
            >
              Confidentialité
            </Link>
            {user ? (
              <Link href="/tableau-de-bord" className="ec-btn ec-btn-primary">
                Mon espace
              </Link>
            ) : (
              <>
                <Link href="/connexion" className="ec-btn ec-btn-ghost">
                  Se connecter
                </Link>
                <Link href="/inscription" className="ec-btn ec-btn-primary">
                  Créer un compte
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-[1180px] w-full px-6 sm:px-10 pt-16 md:pt-[76px] pb-10 grid lg:grid-cols-[1.02fr_0.98fr] gap-10 lg:gap-14 items-center">
        <div className="ec-fade">
          <span className="ec-badge mb-6">
            <Leaf size={15} weight="regular" /> Comprendre · Agir · Mesurer
          </span>
          <h1 className="text-[40px] md:text-[52px] leading-[1.04] font-extrabold tracking-[-0.035em] mb-5">
            Réduisez votre consommation avec des actions{" "}
            <span className="ec-serif text-[var(--primary)]">
              simples et mesurables
            </span>
            .
          </h1>
          <p className="text-lg leading-relaxed text-[var(--muted)] max-w-[490px] mb-8">
            Energy Coach analyse votre logement, vos appareils et vos habitudes
            pour vous proposer un plan d&apos;action clair, personnalisé et suivi
            sur 30 jours.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/inscription"
              className="ec-btn ec-btn-primary text-[15px] px-6 py-3.5"
            >
              Créer un compte <ArrowRight size={17} />
            </Link>
            <DemoButton
              className="ec-btn ec-btn-ghost text-[15px] px-6 py-3.5"
              label="Tester le mode démo"
            />
          </div>
          <div className="flex gap-7 mt-10">
            {[
              ["−12 %", "économie estimée moyenne"],
              ["30 jours", "plan d'action guidé"],
              ["7 postes", "analysés chez vous"],
            ].map(([n, l], i) => (
              <div key={n} className="flex gap-7 items-start">
                {i > 0 && <div className="w-px self-stretch bg-[var(--border)]" />}
                <div>
                  <div className="text-[26px] font-extrabold tracking-tight">
                    {n}
                  </div>
                  <div className="text-[13px] text-[var(--muted-2)] font-semibold max-w-[130px]">
                    {l}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Aperçu dashboard */}
        <div className="ec-fade relative hidden lg:block">
          <div
            className="absolute -inset-4 rounded-[40px]"
            style={{
              background:
                "radial-gradient(60% 60% at 70% 30%, #dcebe1, transparent)",
            }}
          />
          <div className="relative ec-card ec-card-float !rounded-3xl !p-6">
            <div className="flex justify-between items-center mb-5">
              <div>
                <div className="text-[13px] text-[var(--muted-2)] font-semibold">
                  Bonjour Camille
                </div>
                <div className="font-extrabold text-lg tracking-tight">
                  Votre diagnostic
                </div>
              </div>
              <span className="px-3 py-1.5 bg-[var(--primary-soft)] text-[var(--primary)] rounded-lg text-xs font-bold">
                Profil 75 %
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="bg-[var(--primary)] rounded-2xl p-4 text-white">
                <div className="text-xs opacity-75 font-semibold">
                  Facture estimée
                </div>
                <div className="text-[26px] font-extrabold tracking-tight mt-0.5">
                  95 €<span className="text-[13px] opacity-70 font-semibold">/mois</span>
                </div>
              </div>
              <div className="bg-[var(--sand-bg)] rounded-2xl p-4">
                <div className="text-xs text-[var(--sand-text)] font-bold">
                  Économie estimée
                </div>
                <div className="text-[26px] font-extrabold tracking-tight mt-0.5 text-[var(--sand-text)]">
                  11 €<span className="text-[13px] font-semibold">/mois</span>
                </div>
              </div>
            </div>
            <div className="bg-[var(--background)] rounded-2xl p-4">
              <div className="text-xs text-[var(--muted-2)] font-bold mb-2.5">
                RÉPARTITION ESTIMÉE
              </div>
              <div className="flex items-end gap-2 h-[70px]">
                {[
                  ["100%", "var(--g1)"],
                  ["62%", "var(--g2)"],
                  ["44%", "var(--g3)"],
                  ["30%", "var(--g4)"],
                  ["22%", "var(--g5)"],
                ].map(([h, c], i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-md"
                    style={{ height: h, background: c }}
                  />
                ))}
              </div>
              <div className="flex justify-between mt-2 text-[10.5px] text-[var(--muted-2)] font-semibold">
                <span>Chauffage</span>
                <span>Eau ch.</span>
                <span>Élec.</span>
                <span>Multi.</span>
                <span>Veille</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comment ça marche */}
      <section className="mx-auto max-w-[1180px] w-full px-6 sm:px-10 py-14">
        <div className="text-center mb-11">
          <div className="text-[13px] font-bold text-[var(--g2)] tracking-[0.08em] mb-2.5">
            COMMENT ÇA MARCHE ?
          </div>
          <h2 className="text-[30px] md:text-[34px] font-extrabold tracking-[-0.03em]">
            Comprendre, agir, mesurer
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {[
            {
              icon: <MagnifyingGlass size={23} />,
              step: "ÉTAPE 1",
              title: "Comprendre",
              text: "Renseignez votre logement, votre compteur et vos appareils. Nous identifions vos postes de dépense probables.",
            },
            {
              icon: <Sparkle size={23} />,
              step: "ÉTAPE 2",
              title: "Agir",
              text: "Recevez des recommandations personnalisées et des actions prioritaires, avec une économie estimée pour chacune.",
            },
            {
              icon: <ChartLineUp size={23} />,
              step: "ÉTAPE 3",
              title: "Mesurer",
              text: "Suivez votre plan d'action sur 30 jours et visualisez l'impact estimé sur votre facture.",
            },
          ].map((c) => (
            <div key={c.title} className="ec-card">
              <div className="w-[46px] h-[46px] rounded-[13px] bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center mb-4">
                {c.icon}
              </div>
              <div className="text-xs font-bold text-[var(--muted-2)] mb-1.5">
                {c.step}
              </div>
              <h3 className="text-[19px] font-extrabold mb-2 tracking-tight">
                {c.title}
              </h3>
              <p className="text-[14.5px] leading-relaxed text-[var(--muted)]">
                {c.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Bloc bénéfices vert */}
      <section className="mx-auto max-w-[1180px] w-full px-6 sm:px-10 pb-14">
        <div className="bg-[var(--primary)] rounded-[28px] p-8 md:p-12 grid md:grid-cols-2 gap-8 items-center text-white">
          <div>
            <h2 className="text-[26px] md:text-[30px] font-extrabold tracking-[-0.03em] mb-3">
              Des économies expliquées, jamais promises
            </h2>
            <p className="text-white/75 leading-relaxed">
              Chaque estimation est calculée à partir de sources fiables (ADEME)
              et vous pouvez toujours voir le détail du calcul. Vous gardez le
              contrôle.
            </p>
          </div>
          <ul className="space-y-3">
            {[
              "Un diagnostic clair, sans jargon",
              "Des actions classées par impact et effort",
              "Un plan de 30 jours à cocher, à votre rythme",
            ].map((t) => (
              <li key={t} className="flex items-center gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full bg-[var(--accent-light)]/25 text-[var(--accent-light)] flex items-center justify-center">
                  <Check size={15} weight="bold" />
                </span>
                <span className="text-[15px] text-white/90">{t}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <footer className="mx-auto max-w-[1180px] w-full px-6 sm:px-10 py-10 border-t border-[var(--border)] text-sm text-[var(--muted-2)] flex flex-wrap items-center justify-between gap-3">
        <span>
          © {new Date().getFullYear()} Energy Coach — Les économies affichées sont
          des estimations.
        </span>
        <div className="flex gap-4">
          <Link href="/confidentialite" className="hover:text-[var(--foreground)]">
            Confidentialité
          </Link>
          <Link href="/connexion" className="hover:text-[var(--foreground)]">
            Se connecter
          </Link>
        </div>
      </footer>
    </div>
  );
}
