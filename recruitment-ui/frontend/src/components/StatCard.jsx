import clsx from 'clsx';

export default function StatCard({ label, value, delta, deltaType, icon: Icon, color = 'primary' }) {
  const colorMap = {
    primary: 'border-primary-500/20',
    success: 'border-success-500/20',
    warning: 'border-warning-500/20',
    danger: 'border-danger-500/20',
  };

  const deltaColors = {
    positive: 'text-success-400',
    neutral: 'text-neutral-400',
    negative: 'text-danger-400',
    info: 'text-warning-400',
  };

  const barColors = {
    primary: 'bg-primary-500',
    success: 'bg-success-500',
    warning: 'bg-warning-500',
    danger: 'bg-danger-500',
  };

  return (
    <div className={clsx('card relative overflow-hidden', colorMap[color])}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm text-neutral-400 font-medium">{label}</p>
        {Icon && (
          <div className="p-1.5 rounded-lg bg-surface-tertiary">
            <Icon className="w-4 h-4 text-neutral-400" />
          </div>
        )}
      </div>
      <p className="text-3xl font-bold text-neutral-100 mb-1">{value}</p>
      {delta && (
        <p className={clsx('text-xs font-medium', deltaColors[deltaType] || 'text-neutral-500')}>
          {delta}
        </p>
      )}
      {/* Bottom colored bar */}
      <div className="absolute bottom-0 left-0 right-0 h-[3px]">
        <div className={clsx('h-full w-full', barColors[color])} style={{ opacity: 0.6 }} />
      </div>
    </div>
  );
}
