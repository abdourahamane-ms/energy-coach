// Jauge de score circulaire (SVG, sans dépendance client).
export default function ScoreGauge({
  score,
  scoreAfter,
}: {
  score: number;
  scoreAfter?: number;
}) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.max(0, Math.min(100, score)) / 100;
  const dash = circumference * pct;

  const color =
    score >= 75 ? "#0f8a5f" : score >= 50 ? "#f59e0b" : "#ef4444";

  return (
    <div className="flex items-center gap-5">
      <div className="relative h-32 w-32">
        <svg viewBox="0 0 120 120" className="h-32 w-32 -rotate-90">
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="var(--border)"
            strokeWidth="10"
          />
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference}`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-extrabold">{score}</span>
          <span className="text-xs text-[var(--muted)]">/ 100</span>
        </div>
      </div>
      <div className="text-sm">
        <p className="font-semibold">Score énergétique</p>
        {scoreAfter != null && (
          <p className="text-[var(--muted)] mt-1">
            Estimé après actions :{" "}
            <span className="font-semibold text-[var(--primary)]">
              {scoreAfter}/100
            </span>
          </p>
        )}
        <p className="text-xs text-[var(--muted)] mt-2 max-w-[16rem]">
          Ce score est une estimation destinée à suivre votre progression.
        </p>
      </div>
    </div>
  );
}
