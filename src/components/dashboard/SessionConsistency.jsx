import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { getDateRange, generateDateBuckets } from '../../utils/dateUtils';

export default function SessionConsistency({ session, timeRange, customStart, customEnd }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChartData();
  }, [timeRange, customStart, customEnd, session]);

  const fetchChartData = async () => {
    setLoading(true);
    const { startDate, endDate, isoStartDate } = getDateRange(timeRange, customStart, customEnd);
    
    let bucketType = 'week';
    if (timeRange === '30days') bucketType = 'day';
    else if (timeRange === 'all') bucketType = 'month';
    
    const buckets = generateDateBuckets(startDate, endDate, bucketType);

    const { data: sessionsData } = await supabase
      .from('sessions')
      .select('session_date')
      .eq('user_id', session.user.id)
      .gte('session_date', isoStartDate);

    if (sessionsData) {
      sessionsData.forEach(s => {
        const [y, m, d] = s.session_date.split('-').map(Number);
        const sessionDate = new Date(y, m - 1, d);
        for (let i = 0; i < buckets.length; i++) {
          if (sessionDate >= buckets[i].start && sessionDate < buckets[i].end) {
            buckets[i].value += 1;
            break;
          }
        }
      });
    }

    // Only keep buckets up to today
    const filteredBuckets = buckets.filter(b => b.start <= new Date());
    
    setData(filteredBuckets);
    setLoading(false);
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded p-3 shadow-lg">
          <p className="text-[var(--text-secondary)] font-mono text-xs uppercase mb-1">{payload[0].payload.tooltipLabel || payload[0].payload.label}</p>
          <p className="text-[var(--chart-3)] font-bold text-lg m-0">
            {payload[0].value} <span className="text-xs font-normal">sessions</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="iron-card">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-bold uppercase tracking-wider m-0">Workout Consistency</h3>
      </div>
      
      {loading ? (
        <div className="h-[300px] flex items-center justify-center text-[var(--text-secondary)] font-mono text-sm animate-pulse">
          Loading data...
        </div>
      ) : (
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
              <defs>
                <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--chart-3)" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="var(--chart-3)" stopOpacity={0.2}/>
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
                width={30}
                tickCount={5}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--bg-surface)', opacity: 0.5 }} />
              <Bar dataKey="value" fill="url(#colorSessions)" radius={[4, 4, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.value > 0 ? "url(#colorSessions)" : "transparent"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
