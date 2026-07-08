import Link from "next/link";
import { redirect } from "next/navigation";
import RegisterForm from "@/components/RegisterForm";
import Logo from "@/components/Logo";
import { getCurrentUser } from "@/lib/auth";

export default async function InscriptionPage() {
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
          <h1 className="text-xl font-bold">Créer votre compte</h1>
          <p className="text-sm text-[var(--muted)] mt-1 mb-5">
            Quelques secondes pour commencer à réduire votre facture.
          </p>
          <RegisterForm />
          <p className="mt-5 text-sm text-center text-[var(--muted)]">
            Déjà un compte ?{" "}
            <Link href="/connexion" className="text-[var(--primary)] font-semibold">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
