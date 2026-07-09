import { demoAction } from "@/app/actions/auth";
import SubmitButton from "@/components/SubmitButton";

// Lance le mode démo via une Server Action (fonctionne sans JavaScript).
export default function DemoButton({
  className = "ec-btn ec-btn-ghost",
  label = "Tester le mode démo",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <form action={demoAction}>
      <SubmitButton className={className} pendingLabel="Préparation…">
        {label}
      </SubmitButton>
    </form>
  );
}
