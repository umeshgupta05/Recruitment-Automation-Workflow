import { useNavigate } from 'react-router-dom';
import ScoreBadge from './ScoreBadge';
import StageBadge from './StageBadge';

function getInitials(name) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

const avatarColors = [
  'bg-primary-500/20 text-primary-700 dark:text-primary-300 border-primary-500/30',
  'bg-success-500/20 text-success-700 dark:text-success-300 border-success-500/30',
  'bg-warning-500/20 text-warning-700 dark:text-warning-300 border-warning-500/30',
  'bg-danger-500/20 text-danger-700 dark:text-danger-300 border-danger-500/30',
  'bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30',
  'bg-purple-500/20 text-purple-300 border-purple-500/30',
];

function getAvatarColor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

export default function CandidateTable({ candidates, compact = false }) {
  const navigate = useNavigate();

  if (!candidates || candidates.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-surface-tertiary flex items-center justify-center">
          <span className="text-lg">👤</span>
        </div>
        <p className="text-sm text-neutral-400">No candidates found</p>
        <p className="text-xs text-neutral-500 mt-1">Upload a resume to get started</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-neutral-700/40">
            <th className="text-left py-3 px-3 text-xs font-medium text-neutral-400 uppercase tracking-wider">Name</th>
            <th className="text-left py-3 px-3 text-xs font-medium text-neutral-400 uppercase tracking-wider">Role</th>
            <th className="text-left py-3 px-3 text-xs font-medium text-neutral-400 uppercase tracking-wider">Score</th>
            <th className="text-left py-3 px-3 text-xs font-medium text-neutral-400 uppercase tracking-wider">Stage</th>
            {!compact && (
              <th className="text-left py-3 px-3 text-xs font-medium text-neutral-400 uppercase tracking-wider">Applied</th>
            )}
          </tr>
        </thead>
        <tbody>
          {candidates.map((c) => (
            <tr
              key={c.id}
              onClick={() => navigate(`/candidates/${c.id}`)}
              className="border-b border-neutral-700/20 cursor-pointer transition-colors duration-150 hover:bg-surface-tertiary/50"
            >
              <td className="py-3 px-3">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold shrink-0 ${getAvatarColor(c.name)}`}>
                    {getInitials(c.name)}
                  </div>
                  <div className={compact ? '' : ''}>
                    <p className="text-sm font-medium text-neutral-200">{c.name}</p>
                    {!compact && <p className="text-xs text-neutral-500">{c.email}</p>}
                  </div>
                </div>
              </td>
              <td className="py-3 px-3">
                <span className="text-sm text-neutral-300">{c.job_title || '—'}</span>
              </td>
              <td className="py-3 px-3">
                <ScoreBadge score={c.score} showBar={!compact} />
              </td>
              <td className="py-3 px-3">
                <StageBadge stage={c.stage} />
              </td>
              {!compact && (
                <td className="py-3 px-3">
                  <span className="text-xs text-neutral-500">
                    {c.created_at ? new Date(c.created_at).toLocaleDateString() : '—'}
                  </span>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export { getInitials, getAvatarColor };
