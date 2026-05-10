import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { getDateRange, generateDateBuckets } from '../../utils/dateUtils';

export default function CardioTrends({ session, timeRange, customStart, customEnd }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [metric, setMetric] = useState('duration'); // 'duration' or 'distance'

  useEffect(() => {
    fetchCardioData();
  }, [session, metric, timeRange, customStart, customEnd]);

  const fetchCardioData = async () => {
    setLoading(true);
    
    const { startDate, endDate, isoStartDate } = getDateRange(timeRange, customStart, customEnd);
    
    let bucketType = 'week';
    if (timeRange === '30days') bucketType = 'day';
    else if (timeRange === 'all') bucketType = 'month';
    
    const buckets = generateDateBuckets(startDate, endDate, bucketType);

    // Fetch sessions first to get the accurate workout dates
    const { data: sessionsData } = await supabase
      .from('sessions')
      .select('id, session_date')
      .eq('user_id', session.user.id)
      .gte('session_date', isoStartDate);

    if (sessionsData && sessionsData.length > 0) {
      const sessionIds = sessionsData.map(s => s.id);
      const sessionDateMap = {};
      sessionsData.forEach(s => {
        // Parse date as local YYYY-MM-DD
        const [y, m, d] = s.session_date.split('-').map(Number);
        sessionDateMap[s.id] = new Date(y, m - 1, d);
      });

      const { data: cardio } = await supabase
        .from('cardio_logs')
        .select('duration_mins, distance_km, session_id')
        .in('session_id', sessionIds);

      if (cardio) {
        cardio.forEach(log => {
          const logDate = sessionDateMap[log.session_id];
          if (!logDate) return;

          for (let i = 0; i < buckets.length; i++) {
            if (logDate >= buckets[i].start && logDate < buckets[i].end) {
              buckets[i].value += metric === 'duration' ? Number(log.duration_mins) : Number(log.distance_km || 0);
              break;
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
          <p className="text-[var(--chart-2)] font-bold text-lg m-0">
            {payload[0].value.toFixed(1)} <span className="text-xs font-normal">{metric === 'duration' ? 'mins' : 'km'}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="iron-card">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-bold uppercase tracking-wider m-0 text-[var(--chart-2)]">Cardio Trends</h3>
        <div className="flex bg-[var(--bg-elevated)] p-1 rounded">
          <button 
            onClick={() => setMetric('duration')}
            className={`px-3 py-1 text-[10px] font-mono uppercase rounded ${metric === 'duration' ? 'bg-[var(--chart-2)] text-white' : 'text-[var(--text-secondary)]'}`}
          >
            Duration
          </button>
          <button 
            onClick={() => setMetric('distance')}
            className={`px-3 py-1 text-[10px] font-mono uppercase rounded ${metric === 'distance' ? 'bg-[var(--chart-2)] text-white' : 'text-[var(--text-secondary)]'}`}
          >
            Distance
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="h-[300px] flex items-center justify-center text-[var(--text-secondary)] font-mono animate-pulse">Loading...</div>
      ) : (
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
              <defs>
                <linearGradient id="colorCardio" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0}/>
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
                tickFormatter={(value) => value}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--text-secondary)', strokeWidth: 1, strokeDasharray: '4 4', fill: 'transparent' }} />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="var(--chart-2)" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorCardio)" 
                activeDot={{ r: 6, fill: 'var(--bg-surface)', stroke: 'var(--chart-2)', strokeWidth: 2 }} 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
