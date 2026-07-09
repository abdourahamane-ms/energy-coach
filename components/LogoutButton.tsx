import { logoutAction } from "@/app/actions/auth";
import SubmitButton from "@/components/SubmitButton";

// Déconnexion via Server Action (fonctionne sans JavaScript).
export default function LogoutButton() {
  return (
    <form action={logoutAction}>
      <SubmitButton
        className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]"
        pendingLabel="…"
      >
        Se déconnecter
      </SubmitButton>
    </form>
  );
}
