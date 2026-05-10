import { useState } from 'react';
import VolumeChart from './VolumeChart';
import PRTracker from './PRTracker';
import HeatmapChart from './HeatmapChart';
import CardioTrends from './CardioTrends';
import MuscleGroupChart from './MuscleGroupChart';
import SessionConsistency from './SessionConsistency';
import ExerciseConsistency from './ExerciseConsistency';

export default function Dashboard({ session }) {
  const [timeRange, setTimeRange] = useState('3months');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState(new Date().toISOString().split('T')[0]);

  const commonProps = {
    session,
    timeRange,
    customStart: timeRange === 'custom' ? customStart : null,
    customEnd: timeRange === 'custom' ? customEnd : null
  };

  return (
    <div className="max-w-6xl mx-auto pb-10">
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-end border-b border-[var(--bg-border)] pb-4 gap-4">
        <div>
          <h2 className="text-3xl m-0 font-bold uppercase tracking-tight">Dashboard</h2>
          <p className="text-[var(--text-secondary)] font-mono text-xs mt-1 uppercase tracking-widest">Performance Analytics</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-[var(--text-secondary)] uppercase">Range:</span>
            <select 
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="bg-[var(--bg-surface)] border border-[var(--bg-border)] text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-[var(--accent-primary)] font-mono"
            >
              <option value="30days">30 Days</option>
              <option value="3months">3 Months</option>
              <option value="6months">6 Months</option>
              <option value="1year">1 Year</option>
              <option value="all">All Time</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {timeRange === 'custom' && (
            <div className="flex items-center gap-2 animate-in slide-in-from-right-2 duration-300">
              <input 
                type="date" 
                value={customStart}
                onChange={e => setCustomStart(e.target.value)}
                className="bg-[var(--bg-surface)] border border-[var(--bg-border)] text-[10px] font-mono rounded px-2 py-1.5 focus:outline-none focus:border-[var(--accent-primary)]"
              />
              <span className="text-[10px] font-mono text-[var(--text-tertiary)] uppercase">To</span>
              <input 
                type="date" 
                value={customEnd}
                onChange={e => setCustomEnd(e.target.value)}
                className="bg-[var(--bg-surface)] border border-[var(--bg-border)] text-[10px] font-mono rounded px-2 py-1.5 focus:outline-none focus:border-[var(--accent-primary)]"
              />
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Top Row: Volume & PRs */}
        <div className="lg:col-span-2">
          <VolumeChart {...commonProps} />
        </div>
        <div className="lg:col-span-1">
          <PRTracker session={session} />
        </div>
        
        {/* Consistency Row */}
        <div className="lg:col-span-2">
          <SessionConsistency {...commonProps} />
        </div>
        <div className="lg:col-span-1">
          <ExerciseConsistency {...commonProps} />
        </div>

        {/* Heatmap */}
        <div className="lg:col-span-3">
          <HeatmapChart {...commonProps} />
        </div>
        
        {/* Bottom Row: Cardio & Muscle Focus */}
        <div className="lg:col-span-2">
          <CardioTrends {...commonProps} />
        </div>
        <div className="lg:col-span-1">
          <MuscleGroupChart {...commonProps} />
        </div>

      </div>
    </div>
  );
}
