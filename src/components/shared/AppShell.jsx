import { NavLink, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Calendar, Dumbbell, BarChart2, Settings, List, Search } from 'lucide-react';
import TodayScreen from '../today/TodayScreen';
import ScheduleBuilder from '../schedule/ScheduleBuilder';
import ExerciseLibrary from '../exercises/ExerciseLibrary';
import Dashboard from '../dashboard/Dashboard';
import HistoryScreen from '../history/HistoryScreen';
import SettingsScreen from '../settings/SettingsScreen';

export default function AppShell({ session }) {
  const location = useLocation();

  const tabs = [
    { id: 'today', label: 'Today', icon: Dumbbell, path: '/' },
    { id: 'history', label: 'History', icon: List, path: '/history' },
    { id: 'schedule', label: 'Schedule', icon: Calendar, path: '/schedule' },
    { id: 'exercises', label: 'Library', icon: Search, path: '/exercises' },
    { id: 'dashboard', label: 'Dashboard', icon: BarChart2, path: '/dashboard' },
    { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-base)] text-[var(--text-primary)]">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-[240px] bg-[var(--bg-surface)] border-r border-[var(--bg-border)]">
        <div className="p-6">
          <h1 className="text-3xl tracking-tight">IRON<span className="text-[var(--accent-primary)]">LOG</span></h1>
        </div>
        <nav className="flex-1 px-2 space-y-1">
          {tabs.map(tab => (
            <NavLink
              key={tab.id}
              to={tab.path}
              className={({ isActive }) => `
                w-full flex items-center space-x-3 px-4 py-3 rounded text-left transition-colors
                ${isActive 
                  ? 'bg-[var(--accent-dim)] text-[var(--accent-primary)] border-l-4 border-[var(--accent-primary)]' 
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] border-l-4 border-transparent'
                }
              `}
            >
              <tab.icon className="w-5 h-5" />
              <span className="font-semibold uppercase tracking-wider text-sm">{tab.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
        <div className="h-full p-4 md:p-8 max-w-6xl mx-auto">
          <Routes>
            <Route path="/" element={<TodayScreen session={session} />} />
            <Route path="/history" element={<HistoryScreen session={session} />} />
            <Route path="/schedule" element={<ScheduleBuilder session={session} />} />
            <Route path="/exercises" element={<ExerciseLibrary session={session} />} />
            <Route path="/dashboard" element={<Dashboard session={session} />} />
            <Route path="/settings" element={<SettingsScreen session={session} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>

      {/* Mobile Bottom Tab Bar */}
      <nav className="md:hidden fixed bottom-0 w-full bg-[var(--bg-surface)] border-t border-[var(--bg-border)] flex justify-around p-2 pb-safe z-50">
        {tabs.map(tab => (
          <NavLink
            key={tab.id}
            to={tab.path}
            className={({ isActive }) => `
              flex flex-col items-center p-2 rounded transition-colors
              ${isActive ? 'text-[var(--accent-primary)]' : 'text-[var(--text-secondary)]'}
            `}
          >
            <tab.icon className="w-6 h-6 mb-1" />
            <span className="text-[10px] uppercase tracking-wider font-semibold">{tab.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
