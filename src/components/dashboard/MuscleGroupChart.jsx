import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { getDateRange } from '../../utils/dateUtils';

const COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)', '#ED8936', '#38B2AC', '#A0AEC0'];

export default function MuscleGroupChart({ session, timeRange }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mostTrained, setMostTrained] = useState('');

  useEffect(() => {
    fetchData();
  }, [session, timeRange]);

  const fetchData = async () => {
    setLoading(true);
    
    const { isoStartDate } = getDateRange(timeRange);

    const { data: sessionsData } = await supabase
      .from('sessions')
      .select('id')
      .eq('user_id', session.user.id)
      .gte('session_date', isoStartDate);

    let pieData = [];

    if (sessionsData && sessionsData.length > 0) {
      const sessionIds = sessionsData.map(s => s.id);
      
      const { data: sets } = await supabase
        .from('session_sets')
        .select('exercise_id')
        .in('session_id', sessionIds)
        .not('exercise_id', 'is', null);

      if (sets && sets.length > 0) {
        // Need to get muscle groups. Since we don't store it in session_sets, we fetch exercises.
        const exIds = [...new Set(sets.map(s => s.exercise_id))];
        const { data: exercises } = await supabase
          .from('exercises')
          .select('id, muscle_group')
          .in('id', exIds);

        if (exercises) {
          const exMap = {};
          exercises.forEach(ex => exMap[ex.id] = ex.muscle_group);
          
          const groupCount = {};
          sets.forEach(set => {
            const group = exMap[set.exercise_id] || 'Unknown';
            groupCount[group] = (groupCount[group] || 0) + 1;
          });

          pieData = Object.keys(groupCount).map(key => ({
            name: key,
            value: groupCount[key]
          })).sort((a, b) => b.value - a.value);
        }
      }
    }
    
    setData(pieData);
    if (pieData.length > 0) setMostTrained(pieData[0].name);
    else setMostTrained('');
    
    setLoading(false);
  };

  const formatLabel = () => {
    switch(timeRange) {
      case '30days': return '30 Days';
      case '3months': return '3 Months';
      case '6months': return '6 Months';
      case '1year': return '1 Year';
      case 'all': return 'All Time';
      default: return 'Period';
    }
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded p-3 shadow-lg">
          <p className="text-[var(--text-secondary)] font-mono text-xs uppercase mb-1">{payload[0].name}</p>
          <p className="font-bold text-lg m-0" style={{ color: payload[0].payload.fill }}>
            {payload[0].value} <span className="text-xs font-normal">sets</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="iron-card flex flex-col h-full">
      <h3 className="font-bold uppercase tracking-wider m-0 mb-2">Muscle Focus <span className="text-[10px] text-[var(--text-secondary)] font-normal normal-case">({formatLabel()})</span></h3>
      
      {loading ? (
        <div className="flex-1 flex items-center justify-center text-[var(--text-secondary)] font-mono animate-pulse">Loading...</div>
      ) : data.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-[var(--text-secondary)] font-mono text-sm">No data for this period</div>
      ) : (
        <div className="flex-1 relative min-h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                innerRadius={60}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
                stroke="var(--bg-surface)"
                strokeWidth={2}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[10px] font-mono text-[var(--text-secondary)] uppercase">Focus</span>
            <span className="font-bold text-[var(--chart-1)] uppercase tracking-wider">{mostTrained}</span>
          </div>
        </div>
      )}
    </div>
  );
}
