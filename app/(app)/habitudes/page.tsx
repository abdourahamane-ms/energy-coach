import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/PageHeader";
import HabitsForm from "@/components/HabitsForm";

export default async function HabitudesPage() {
  const user = await requireUser();
  const [habits, userHabits] = await Promise.all([
    prisma.habit.findMany({
      where: { isActive: true },
      orderBy: { orderIndex: "asc" },
    }),
    prisma.userHabit.findMany({ where: { userId: user.id } }),
  ]);

  const initialAnswers: Record<string, string> = {};
  for (const u of userHabits) initialAnswers[u.habitId] = u.answerValue;

  return (
    <div>
      <PageHeader
        title="Mes habitudes"
        subtitle="Vos réponses affinent vos recommandations personnalisées."
      />
      <HabitsForm habits={habits} initialAnswers={initialAnswers} />
    </div>
  );
}
