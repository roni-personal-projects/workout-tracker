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

  return (
    <div className="max-w-6xl mx-auto pb-10">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-[var(--bg-border)] pb-2">
        <div>
          <h2 className="text-3xl m-0">Dashboard</h2>
          <p className="text-[var(--text-secondary)] font-mono text-sm mt-1">Track your progress and intensity.</p>
        </div>
        
        <div className="mt-4 sm:mt-0 flex items-center gap-2">
          <span className="text-[10px] font-mono text-[var(--text-secondary)] uppercase">Time Range:</span>
          <select 
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="bg-[var(--bg-surface)] border border-[var(--bg-border)] text-sm rounded px-2 py-1 focus:outline-none focus:border-[var(--accent-primary)] font-mono"
          >
            <option value="30days">Last 30 Days</option>
            <option value="3months">Last 3 Months</option>
            <option value="6months">Last 6 Months</option>
            <option value="1year">Last Year</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Top Row: Volume & PRs */}
        <div className="lg:col-span-2">
          <VolumeChart session={session} timeRange={timeRange} />
        </div>
        <div className="lg:col-span-1">
          <PRTracker session={session} />
        </div>
        
        {/* Consistency Row */}
        <div className="lg:col-span-2">
          <SessionConsistency session={session} timeRange={timeRange} />
        </div>
        <div className="lg:col-span-1">
          <ExerciseConsistency session={session} timeRange={timeRange} />
        </div>

        {/* Heatmap */}
        <div className="lg:col-span-3">
          <HeatmapChart session={session} timeRange={timeRange} />
        </div>
        
        {/* Bottom Row: Cardio & Muscle Focus */}
        <div className="lg:col-span-2">
          <CardioTrends session={session} timeRange={timeRange} />
        </div>
        <div className="lg:col-span-1">
          <MuscleGroupChart session={session} timeRange={timeRange} />
        </div>

      </div>
    </div>
  );
}
