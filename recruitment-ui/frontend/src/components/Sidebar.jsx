import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Upload,
  Zap,
  Settings,
  Menu,
  ChevronLeft,
} from 'lucide-react';
import clsx from 'clsx';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/candidates', icon: Users, label: 'Candidates' },
  { to: '/upload', icon: Upload, label: 'Upload' },
  { to: '/workflows', icon: Zap, label: 'Workflows' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar() {
  const [expanded, setExpanded] = useState(false);

  return (
    <aside
      className={clsx(
        'fixed left-0 top-0 h-screen bg-surface-secondary border-r border-neutral-700/40 flex flex-col z-50 transition-all duration-300 ease-in-out',
        expanded ? 'w-[200px]' : 'w-[56px]'
      )}
    >
      {/* Toggle */}
      <div className="h-14 flex items-center justify-center border-b border-neutral-700/40">
        <button
          onClick={() => setExpanded(!expanded)}
          className="p-2 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-surface-tertiary transition-all duration-200"
          aria-label={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {expanded ? <ChevronLeft className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-2 flex flex-col gap-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 rounded-lg transition-all duration-200 group',
                expanded ? 'px-3 py-2.5' : 'px-0 py-2.5 justify-center',
                isActive
                  ? 'bg-primary-600/20 text-primary-400'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-surface-tertiary'
              )
            }
          >
            <item.icon className="w-5 h-5 shrink-0" />
            {expanded && (
              <span className="text-sm font-medium truncate">{item.label}</span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Avatar */}
      <div className="p-3 border-t border-neutral-700/40">
        <div
          className={clsx(
            'flex items-center gap-3',
            !expanded && 'justify-center'
          )}
        >
          <div className="w-8 h-8 rounded-full bg-primary-600/30 border border-primary-500/40 flex items-center justify-center text-xs font-bold text-primary-300 shrink-0">
            RA
          </div>
          {expanded && (
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-neutral-200 truncate">Recruiter Admin</p>
              <p className="text-xs text-neutral-500 truncate">admin@company.io</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
