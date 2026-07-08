import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/PageHeader";
import ConsumptionForm from "@/components/ConsumptionForm";

export default async function ConsommationPage() {
  const user = await requireUser();
  const housing = await prisma.housingProfile.findUnique({
    where: { userId: user.id },
  });

  return (
    <div>
      <PageHeader
        title="Facture & consommation"
        subtitle="Saisissez votre facture ou votre consommation. Si vous ne renseignez que la facture, nous estimons les kWh à partir du prix de l'énergie."
      />
      <div className="ec-card">
        <ConsumptionForm
          initialBill={housing?.monthlyBillEuro ?? null}
          initialKwh={housing?.monthlyConsumptionKwh ?? null}
          initialPrice={housing?.knownKwhPrice ?? null}
        />
      </div>
    </div>
  );
}
