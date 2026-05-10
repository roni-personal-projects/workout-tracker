import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { getDateRange, getLocalDateString } from '../../utils/dateUtils';

export default function HeatmapChart({ session, timeRange, customStart, customEnd }) {
  const [weeks, setWeeks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHeatmapData();
  }, [session, timeRange, customStart, customEnd]);

  const fetchHeatmapData = async () => {
    setLoading(true);
    
    let { startDate: rangeStart, endDate: rangeEnd } = getDateRange(timeRange, customStart, customEnd);
    
    // For "All Time", let's find the earliest session to avoid showing years of empty boxes
    if (timeRange === 'all') {
      const { data: firstSession } = await supabase
        .from('sessions')
        .select('session_date')
        .eq('user_id', session.user.id)
        .order('session_date', { ascending: true })
        .limit(1)
        .single();
      
      if (firstSession) {
        rangeStart = new Date(firstSession.session_date);
      }
    }

    const endDate = new Date(rangeEnd);
    endDate.setHours(23, 59, 59, 999);
    
    const diffTime = Math.abs(endDate - rangeStart);
    let numWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));
    
    if (numWeeks < 12) numWeeks = 12; 
    // We can cap at a reasonable large number if needed, e.g., 2 years (104 weeks) or just let it be.
    // For now let's allow up to 2 years to keep performance stable
    if (numWeeks > 104) numWeeks = 104; 

    // Adjust to end on the Saturday of the end date's week
    const endDayOfWeek = endDate.getDay();
    const finalDate = new Date(endDate);
    finalDate.setDate(endDate.getDate() + (6 - endDayOfWeek));
    
    const startDate = new Date(finalDate);
    startDate.setDate(finalDate.getDate() - (numWeeks * 7) + 1);
    
    const grid = [];
    const dateMap = new Map();
    
    let currentDate = new Date(startDate);
    for (let w = 0; w < numWeeks; w++) {
      const week = [];
      for (let d = 0; d < 7; d++) {
        const iso = getLocalDateString(currentDate);
        const dayObj = { date: iso, intensity: 0, dateObj: new Date(currentDate) };
        week.push(dayObj);
        dateMap.set(iso, dayObj);
        
        currentDate.setDate(currentDate.getDate() + 1);
      }
      grid.push(week);
    }

    // Fetch sessions in this range
    const { data: sessionsData } = await supabase
      .from('sessions')
      .select('id, session_date, workout_name')
      .eq('user_id', session.user.id)
      .gte('session_date', getLocalDateString(startDate));

    if (sessionsData && sessionsData.length > 0) {
      const sessionIds = sessionsData.map(s => s.id);
      
      const { data: sets } = await supabase
        .from('session_sets')
        .select('session_id, weight, reps')
        .in('session_id', sessionIds);

      // Calculate volume per session
      const sessionVolume = {};
      sets?.forEach(set => {
        if (set.weight && set.reps) {
          sessionVolume[set.session_id] = (sessionVolume[set.session_id] || 0) + (set.weight * set.reps);
        }
      });

      // Count sessions per day just in case there are multiple
      const sessionsPerDay = {};
      sessionsData.forEach(s => {
        sessionsPerDay[s.session_date] = (sessionsPerDay[s.session_date] || 0) + 1;
      });

      let maxVolume = 1;
      sessionsData.forEach(s => {
        const vol = sessionVolume[s.id] || 0;
        if (vol > maxVolume) maxVolume = vol;
      });

      sessionsData.forEach(s => {
        const day = dateMap.get(s.session_date);
        if (day) {
          const vol = sessionVolume[s.id] || 0;
          let intensity = 0;
          if (vol === 0) intensity = 1; // Logged but no volume
          else if (vol < maxVolume * 0.33) intensity = 1;
          else if (vol < maxVolume * 0.66) intensity = 2;
          else intensity = 3;
          
          // If multiple sessions, bump intensity slightly
          if (sessionsPerDay[s.session_date] > 1) {
            intensity = Math.min(3, intensity + 1);
          }
          
          const unit = localStorage.getItem('ironlog_unit') || 'kg';
          day.intensity = intensity;
          
          const sessionCountStr = sessionsPerDay[s.session_date] > 1 ? ` (${sessionsPerDay[s.session_date]} sessions)` : '';
          
          // Append to tooltip in case of multiple
          if (day.tooltip) {
             day.tooltip += ` | ${s.workout_name} (${vol} ${unit})`;
          } else {
             day.tooltip = `${s.workout_name} (${vol} ${unit})${sessionCountStr}`;
          }
        }
      });
    }

    setWeeks(grid);
    setLoading(false);
  };

  const getIntensityColor = (intensity) => {
    switch (intensity) {
      case 1: return '#2D1515';
      case 2: return '#7B1D1D';
      case 3: return 'var(--accent-primary)';
      default: return 'var(--bg-elevated)';
    }
  };

  if (loading) {
    return (
      <div className="iron-card h-[200px] flex items-center justify-center text-[var(--text-secondary)] font-mono animate-pulse">
        Generating Heatmap...
      </div>
    );
  }

  const formatHeatmapDate = (dateString) => {
    const d = new Date(dateString);
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  };

  return (
    <div className="iron-card overflow-x-auto hide-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
      <h3 className="font-bold uppercase tracking-wider m-0 mb-4">Training Consistency</h3>
      <div className="flex gap-1 min-w-max">
        {weeks.map((week, wIndex) => (
          <div key={wIndex} className="flex flex-col gap-1">
            {week.map((day, dIndex) => (
              <div 
                key={`${wIndex}-${dIndex}`}
                className="w-3 h-3 rounded-sm transition-colors hover:ring-1 hover:ring-[var(--text-primary)]"
                style={{ backgroundColor: getIntensityColor(day.intensity) }}
                title={day.intensity > 0 ? `${formatHeatmapDate(day.date)}: ${day.tooltip}` : formatHeatmapDate(day.date)}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="flex justify-end items-center gap-2 mt-4 text-[10px] font-mono text-[var(--text-secondary)] uppercase">
        <span>Less</span>
        <div className="w-3 h-3 rounded-sm bg-[var(--bg-elevated)]"></div>
        <div className="w-3 h-3 rounded-sm bg-[#2D1515]"></div>
        <div className="w-3 h-3 rounded-sm bg-[#7B1D1D]"></div>
        <div className="w-3 h-3 rounded-sm bg-[var(--accent-primary)]"></div>
        <span>More</span>
      </div>
    </div>
  );
}
