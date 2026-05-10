import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { getDateRange, generateDateBuckets } from '../../utils/dateUtils';

export default function VolumeChart({ session, timeRange, customStart, customEnd }) {
  const [data, setData] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [selectedExercise, setSelectedExercise] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch user exercises for the dropdown
    supabase.from('exercises').select('id, name').eq('user_id', session.user.id).order('name')
      .then(({ data }) => {
        if (data && data.length > 0) {
          setExercises(data);
          setSelectedExercise(data[0].id);
        } else {
          setLoading(false);
        }
      });
  }, [session]);

  useEffect(() => {
    if (selectedExercise) fetchChartData();
  }, [selectedExercise, timeRange, customStart, customEnd]);

  const fetchChartData = async () => {
    setLoading(true);
    
    const { startDate, endDate, isoStartDate } = getDateRange(timeRange, customStart, customEnd);
    
    let bucketType = 'week';
    if (timeRange === '30days') bucketType = 'day';
    else if (timeRange === 'all') bucketType = 'month';
    
    const buckets = generateDateBuckets(startDate, endDate, bucketType);

    // Fetch sessions first to get the dates
    const { data: sessionsData } = await supabase
      .from('sessions')
      .select('id, session_date')
      .eq('user_id', session.user.id)
      .gte('session_date', isoStartDate);

    if (sessionsData && sessionsData.length > 0) {
      const sessionIds = sessionsData.map(s => s.id);
      const sessionDateMap = {};
      sessionsData.forEach(s => {
        const [y, m, d] = s.session_date.split('-').map(Number);
        sessionDateMap[s.id] = new Date(y, m - 1, d);
      });

      const { data: sets } = await supabase
        .from('session_sets')
        .select('*')
        .in('session_id', sessionIds)
        .eq('exercise_id', selectedExercise);

      if (sets) {
        sets.forEach(set => {
          if (set.weight && set.reps) {
            const setDate = sessionDateMap[set.session_id];
            if (!setDate) return;
            
            for (let i = 0; i < buckets.length; i++) {
              if (setDate >= buckets[i].start && setDate < buckets[i].end) {
                buckets[i].value += (set.weight * set.reps);
                break;
              }
            }
          }
        });
      }
    }

    const filteredBuckets = buckets.filter(b => b.start <= new Date());
    setData(filteredBuckets);
    setLoading(false);
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded p-3 shadow-lg">
          <p className="text-[var(--text-secondary)] font-mono text-xs uppercase mb-1">{payload[0].payload.tooltipLabel || payload[0].payload.label}</p>
          <p className="text-[var(--chart-1)] font-bold text-lg m-0">
            {payload[0].value.toLocaleString()} <span className="text-xs font-normal">{localStorage.getItem('ironlog_unit') || 'kg'}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  if (!exercises.length && !loading) {
    return (
      <div className="iron-card h-[330px] flex items-center justify-center">
        <p className="text-[var(--text-secondary)] font-mono text-sm">No exercises found.</p>
      </div>
    );
  }

  return (
    <div className="iron-card">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-6">
        <h3 className="font-bold uppercase tracking-wider m-0">Volume Progression</h3>
        <select 
          value={selectedExercise} 
          onChange={e => setSelectedExercise(e.target.value)}
          className="bg-[var(--bg-base)] border border-[var(--bg-border)] rounded p-1 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] max-w-full sm:max-w-[200px] truncate"
        >
          {exercises.map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
        </select>
      </div>
      
      {loading ? (
        <div className="h-[300px] flex items-center justify-center text-[var(--text-secondary)] font-mono text-sm animate-pulse">
          Loading data...
        </div>
      ) : (
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
              <defs>
                <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="label" 
                stroke="var(--text-secondary)" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false} 
                tick={{ fill: 'var(--text-secondary)' }}
                minTickGap={30}
                dy={10}
              />
              <YAxis 
                stroke="var(--text-secondary)" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false} 
                width={45}
                tickFormatter={(value) => value >= 1000 ? `${(value/1000).toFixed(1)}k` : value}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--text-secondary)', strokeWidth: 1, strokeDasharray: '4 4', fill: 'transparent' }} />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="var(--chart-1)" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorVolume)" 
                activeDot={{ r: 6, fill: 'var(--bg-surface)', stroke: 'var(--chart-1)', strokeWidth: 2 }} 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
