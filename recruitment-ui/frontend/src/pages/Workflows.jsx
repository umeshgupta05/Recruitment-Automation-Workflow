import { useState, useEffect } from 'react';
import { Zap, RefreshCw } from 'lucide-react';
import client from '../api/client';
import { StatusBadge, getStatusConfig } from '../components/WorkflowStatus';

const WORKFLOW_META = {
  recruitment_ats_scorer: {
    name: 'ATS Scorer',
    description: 'Scores resumes against job descriptions using AI',
  },
  recruitment_stage_notifier: {
    name: 'Stage Notifier',
    description: 'Sends notifications on candidate stage changes',
  },
  recruitment_idle_checker: {
    name: 'Idle Checker',
    description: 'Flags candidates idle for more than 14 days',
  },
  recruitment_error_handler: {
    name: 'Error Handler',
    description: 'Catches and logs workflow failures',
  },
};

function timeAgo(dateStr) {
  if (!dateStr) return '—';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function formatDuration(start, end) {
  if (!start || !end) return '—';
  const diff = new Date(end).getTime() - new Date(start).getTime();
  if (diff < 1000) return '<1s';
  if (diff < 60000) return `${(diff / 1000).toFixed(1)}s`;
  return `${Math.floor(diff / 60000)}m ${Math.floor((diff % 60000) / 1000)}s`;
}

export default function Workflows() {
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function fetchRuns() {
    try {
      const res = await client.get('/workflows/runs');
      setRuns(res.data || []);
    } catch (err) {
      console.error('Fetch workflow runs error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchRuns();
    const interval = setInterval(fetchRuns, 10000);
    return () => clearInterval(interval);
  }, []);

  // Build card data from runs
  const workflowCards = Object.entries(WORKFLOW_META).map(([flowId, meta]) => {
    const flowRuns = runs.filter((r) => r.flow_id === flowId);
    const lastRun = flowRuns[0];
    return {
      flowId,
      ...meta,
      status: lastRun?.status || 'IDLE',
      lastRun: lastRun?.started_at,
      lastExecutionId: lastRun?.execution_id,
    };
  });

  if (loading) return <WorkflowsSkeleton />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-neutral-100">Kestra Workflows</h2>
          <p className="text-sm text-neutral-500 mt-0.5">Auto-refreshes every 10 seconds</p>
        </div>
        <button
          onClick={() => { setRefreshing(true); fetchRuns(); }}
          className="btn-secondary"
          disabled={refreshing}
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Workflow cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {workflowCards.map((wf) => {
          const cfg = getStatusConfig(wf.status);
          return (
            <div key={wf.flowId} className="card-hover">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary-500/10">
                    <Zap className="w-5 h-5 text-primary-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-neutral-200">{wf.name}</h3>
                    <p className="text-xs text-neutral-500 mt-0.5">{wf.description}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mt-4 pt-3 border-t border-neutral-700/30">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                  <span className={`text-xs font-medium capitalize ${cfg.text}`}>{cfg.label}</span>
                </div>
                <span className="text-xs text-neutral-500">{timeAgo(wf.lastRun)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent executions table */}
      <div className="card p-0 overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-700/40">
          <h3 className="text-sm font-semibold text-neutral-300">Recent executions</h3>
        </div>

        {runs.length === 0 ? (
          <div className="text-center py-12">
            <Zap className="w-8 h-8 mx-auto mb-3 text-neutral-600" />
            <p className="text-sm text-neutral-400">No workflow executions yet</p>
            <p className="text-xs text-neutral-500 mt-1">Upload a resume to trigger the first workflow</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-700/40 bg-surface-tertiary/30">
                <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 uppercase tracking-wider">Flow</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 uppercase tracking-wider">Execution ID</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 uppercase tracking-wider">Trigger</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 uppercase tracking-wider">Duration</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 uppercase tracking-wider">Status</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 uppercase tracking-wider">Candidate</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((run) => (
                <tr key={run.id} className="border-b border-neutral-700/20 transition-colors hover:bg-surface-tertiary/30">
                  <td className="py-3 px-4">
                    <span className="text-sm text-neutral-300">
                      {WORKFLOW_META[run.flow_id]?.name || run.flow_id}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <code className="text-xs text-primary-400 bg-primary-500/10 px-2 py-0.5 rounded">
                      {run.execution_id ? run.execution_id.slice(0, 12) + '...' : '—'}
                    </code>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-xs text-neutral-500">{timeAgo(run.started_at)}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-xs text-neutral-400">{formatDuration(run.started_at, run.finished_at)}</span>
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={run.status || 'UNKNOWN'} />
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-xs text-neutral-400">{run.candidate_email || '—'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function WorkflowsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="skeleton h-6 w-40 mb-2" />
          <div className="skeleton h-4 w-52" />
        </div>
        <div className="skeleton h-10 w-28 rounded-lg" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card">
            <div className="flex items-center gap-3 mb-4">
              <div className="skeleton w-10 h-10 rounded-lg" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-4 w-28" />
                <div className="skeleton h-3 w-full" />
              </div>
            </div>
            <div className="skeleton h-6 w-full rounded" />
          </div>
        ))}
      </div>
      <div className="card">
        <div className="skeleton h-4 w-36 mb-4" />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="skeleton h-10 w-full mb-3" />
        ))}
      </div>
    </div>
  );
}
