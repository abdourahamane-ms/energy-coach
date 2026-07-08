import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import LoginForm from "@/components/LoginForm";
import DemoButton from "@/components/DemoButton";
import Logo from "@/components/Logo";
import { getCurrentUser } from "@/lib/auth";

export default async function ConnexionPage() {
  const user = await getCurrentUser();
  if (user) redirect("/tableau-de-bord");

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
          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>
          <p className="mt-5 text-sm text-center text-[var(--muted)]">
            Pas encore de compte ?{" "}
            <Link href="/inscription" className="text-[var(--primary)] font-semibold">
              Créer un compte
            </Link>
          </p>
        </div>
        <div className="mt-5 text-center">
          <DemoButton />
        </div>
      </div>
    </main>
  );
}
