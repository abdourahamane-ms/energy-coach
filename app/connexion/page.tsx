import Link from "next/link";
import { redirect } from "next/navigation";
import LoginForm from "@/components/LoginForm";
import DemoButton from "@/components/DemoButton";
import Logo from "@/components/Logo";
import { getCurrentUser } from "@/lib/auth";

export default async function ConnexionPage({
  searchParams,
}: {
  searchParams: Promise<{ suite?: string; erreur?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect("/tableau-de-bord");

  const { suite, erreur } = await searchParams;

  return (
    <main className="flex-1 flex items-center justify-center px-5 py-10">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6">
          <Link href="/">
            <Logo />
          </Link>
        </div>
        <div className="ec-card">
          <h1 className="text-xl font-bold">Se connecter</h1>
          <p className="text-sm text-[var(--muted)] mt-1 mb-5">
            Retrouvez votre diagnostic et votre plan d&apos;action.
          </p>
          {erreur === "demo" && (
            <p className="text-sm text-[var(--danger)] bg-red-50 border border-red-100 rounded-md px-3 py-2 mb-4">
              Le compte de démonstration n&apos;est pas disponible pour le moment.
            </p>
          )}
          <LoginForm suite={suite} />
          <p className="mt-5 text-sm text-center text-[var(--muted)]">
            Pas encore de compte ?{" "}
            <Link
              href="/inscription"
              className="text-[var(--primary)] font-semibold"
            >
              Créer un compte
            </Link>
          </p>
        </div>
        <div className="mt-5 flex justify-center">
          <DemoButton />
        </div>
      </div>
    </main>
  );
}
