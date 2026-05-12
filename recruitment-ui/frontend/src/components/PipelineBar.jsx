import clsx from 'clsx';

const defaultStages = [
  { key: 'applied', label: 'Applied', color: 'bg-neutral-400' },
  { key: 'scored', label: 'Scored', color: 'bg-primary-500' },
  { key: 'shortlisted', label: 'Shortlisted', color: 'bg-blue-500' },
  { key: 'interview_scheduled', label: 'Interview', color: 'bg-warning-500' },
  { key: 'offer_extended', label: 'Offer', color: 'bg-success-500' },
  { key: 'rejected', label: 'Rejected', color: 'bg-danger-500' },
];

export default function PipelineBar({ stages, onStageClick }) {
  const items = stages || defaultStages;

  return (
    <div className="card">
      <div className="grid grid-cols-6 gap-3">
        {items.map((stage) => (
          <button
            key={stage.key || stage.label}
            onClick={() => onStageClick?.(stage.key || stage.label)}
            className="text-left group transition-all duration-200 hover:scale-[1.02]"
          >
            <p className="text-xs text-neutral-400 font-medium mb-1 truncate">{stage.label}</p>
            <p className="text-2xl font-bold text-neutral-100 mb-2 tabular-nums">{stage.count ?? 0}</p>
            <div className="h-[3px] rounded-full bg-neutral-700/50 overflow-hidden">
              <div
                className={clsx('h-full rounded-full transition-all duration-500', stage.color)}
                style={{ width: stage.count > 0 ? '100%' : '0%' }}
              />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
