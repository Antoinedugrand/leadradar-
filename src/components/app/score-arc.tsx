interface ScoreArcProps {
  score: number;
  max?: number;
}

export function ScoreArc({ score, max = 100 }: ScoreArcProps) {
  const pct = Math.min(Math.max(score / max, 0), 1);
  const circumference = 2 * Math.PI * 42;
  const offset = circumference * (1 - pct);
  const color =
    score <= 35 ? "var(--red)" : score <= 60 ? "var(--amber)" : "var(--emerald)";

  return (
    <div className="lr-score-arc">
      <svg viewBox="0 0 96 96" aria-hidden>
        <circle cx="48" cy="48" r="42" fill="none" stroke="var(--slate-100)" strokeWidth="8" />
        <circle
          cx="48"
          cy="48"
          r="42"
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="num">
        <strong>{score}</strong>
        <span>/{max}</span>
      </div>
    </div>
  );
}
