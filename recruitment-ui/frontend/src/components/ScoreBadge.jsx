import clsx from 'clsx';

function getScoreColor(score) {
  if (score >= 85) return { bar: 'bg-success-500', text: 'text-success-400', dot: 'bg-success-400' };
  if (score >= 70) return { bar: 'bg-warning-500', text: 'text-warning-400', dot: 'bg-warning-400' };
  return { bar: 'bg-danger-500', text: 'text-danger-400', dot: 'bg-danger-400' };
}

export default function ScoreBadge({ score, showBar = true }) {
  const colors = getScoreColor(score);

  return (
    <div className="flex items-center gap-2.5">
      <span className={clsx('w-2 h-2 rounded-full shrink-0', colors.dot)} />
      {showBar && (
        <div className="w-16 h-1.5 bg-neutral-700 rounded-full overflow-hidden">
          <div
            className={clsx('h-full rounded-full transition-all duration-500', colors.bar)}
            style={{ width: `${Math.min(score, 100)}%` }}
          />
        </div>
      )}
      <span className={clsx('text-sm font-semibold tabular-nums', colors.text)}>{score}</span>
    </div>
  );
}

export { getScoreColor };
