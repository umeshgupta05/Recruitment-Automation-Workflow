import clsx from 'clsx';

const statusConfig = {
  SUCCESS: { dot: 'bg-success-400', text: 'text-success-300', label: 'success', bgBadge: 'bg-success-500/15 border-success-500/30' },
  RUNNING: { dot: 'bg-warning-400 dot-pulse', text: 'text-warning-300', label: 'running', bgBadge: 'bg-warning-500/15 border-warning-500/30' },
  FAILED: { dot: 'bg-danger-400', text: 'text-danger-300', label: 'failed', bgBadge: 'bg-danger-500/15 border-danger-500/30' },
  CREATED: { dot: 'bg-primary-400 dot-pulse', text: 'text-primary-300', label: 'created', bgBadge: 'bg-primary-500/15 border-primary-500/30' },
  IDLE: { dot: 'bg-neutral-500', text: 'text-neutral-400', label: 'idle', bgBadge: 'bg-neutral-500/15 border-neutral-500/30' },
  UNKNOWN: { dot: 'bg-neutral-600', text: 'text-neutral-500', label: 'unknown', bgBadge: 'bg-neutral-500/10 border-neutral-600/30' },
};

function getStatusConfig(status) {
  return statusConfig[status] || statusConfig.UNKNOWN;
}

export default function WorkflowStatus({ execution, compact = false }) {
  if (!execution) return null;

  const taskRuns = execution.taskRunList || execution.taskRuns || [];

  if (compact || taskRuns.length === 0) {
    const cfg = getStatusConfig(execution.state?.current || execution.status || 'UNKNOWN');
    return (
      <span className={clsx('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border', cfg.bgBadge, cfg.text)}>
        <span className={clsx('w-1.5 h-1.5 rounded-full', cfg.dot)} />
        {cfg.label}
      </span>
    );
  }

  // Full timeline view
  return (
    <div className="space-y-3">
      {taskRuns.map((task, i) => {
        const cfg = getStatusConfig(task.state?.current || 'UNKNOWN');
        const duration = task.state?.duration
          ? `${(task.state.duration / 1000).toFixed(1)}s`
          : '—';

        return (
          <div key={task.id || i} className="flex items-start gap-3 relative">
            {/* Timeline line */}
            {i < taskRuns.length - 1 && (
              <div className="absolute left-[7px] top-5 w-px h-full bg-neutral-700/50" />
            )}
            <span className={clsx('w-[15px] h-[15px] rounded-full shrink-0 mt-0.5 border-2 border-surface-secondary', cfg.dot)} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-neutral-200 truncate">{task.taskId || `Task ${i + 1}`}</p>
                <span className="text-xs text-neutral-500 shrink-0">{duration}</span>
              </div>
              <p className={clsx('text-xs capitalize', cfg.text)}>{cfg.label}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function StatusBadge({ status }) {
  const cfg = getStatusConfig(status);
  return (
    <span className={clsx('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border', cfg.bgBadge, cfg.text)}>
      <span className={clsx('w-1.5 h-1.5 rounded-full', cfg.dot)} />
      {cfg.label}
    </span>
  );
}

export { getStatusConfig };
