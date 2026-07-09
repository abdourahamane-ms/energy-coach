"use client";

import { useFormStatus } from "react-dom";

// Bouton de soumission pour les <form action={serverAction}> :
// affiche un état de chargement, et fonctionne aussi sans JavaScript.
export default function SubmitButton({
  children,
  pendingLabel,
  className = "ec-btn ec-btn-ghost",
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? pendingLabel ?? "…" : children}
    </button>
  );
}
