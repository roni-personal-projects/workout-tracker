import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';

export default function PRTracker({ session }) {
  const [prs, setPrs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPRs();
  }, [session]);

  const fetchPRs = async () => {
    setLoading(true);
    
    // We need sets and their session dates. 
    // This could be heavy with many logs, but for a personal tracker it's okay.
    const { data: sessionsData } = await supabase
      .from('sessions')
      .select('id, session_date')
      .eq('user_id', session.user.id);

    if (!sessionsData || sessionsData.length === 0) {
      setLoading(false);
      return;
    }

    const sessionDateMap = {};
    sessionsData.forEach(s => sessionDateMap[s.id] = s.session_date);
    const sessionIds = sessionsData.map(s => s.id);

    const { data: sets } = await supabase
      .from('session_sets')
      .select('*')
      .in('session_id', sessionIds)
      .not('exercise_name', 'is', null)
      .order('created_at', { ascending: false });

    if (sets) {
      const prMap = {}; // exercise_name -> best set
      
      sets.forEach(set => {
        if (!set.weight || !set.reps) return;
        const score = set.weight * set.reps; // simple PR metric
        
        if (!prMap[set.exercise_name] || score > prMap[set.exercise_name].score) {
          prMap[set.exercise_name] = {
            exercise: set.exercise_name,
            weight: set.weight,
            reps: set.reps,
            date: sessionDateMap[set.session_id],
            score: score,
            timestamp: new Date(sessionDateMap[set.session_id]).getTime()
          };
        }
      });
      
      const prList = Object.values(prMap).sort((a, b) => b.timestamp - a.timestamp);
      setPrs(prList);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="iron-card h-[300px] flex items-center justify-center text-[var(--text-secondary)] font-mono animate-pulse">
        Calculating PRs...
      </div>
    );
  }

  if (prs.length === 0) {
    return (
      <div className="iron-card h-[300px] flex items-center justify-center text-[var(--text-secondary)] font-mono">
        No PRs established yet.
      </div>
    );
  }

  return (
    <div className="iron-card flex flex-col h-full max-h-[400px]">
      <h3 className="font-bold uppercase tracking-wider m-0 mb-4 text-[var(--warning)]">Personal Records</h3>
      <div className="flex-1 overflow-y-auto pr-2">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[var(--bg-border)] text-[10px] font-mono text-[var(--text-secondary)] uppercase">
              <th className="pb-2 font-normal">Exercise</th>
              <th className="pb-2 font-normal">Best</th>
              <th className="pb-2 font-normal">Date</th>
            </tr>
          </thead>
          <tbody>
            {prs.map((pr, i) => (
              <tr key={pr.exercise} className={`border-b border-[var(--bg-border)]/50 ${i === 0 ? 'bg-[var(--accent-dim)]' : ''}`}>
                <td className="py-3 text-sm font-bold truncate max-w-[120px] pr-2">{pr.exercise}</td>
                <td className="py-3 font-mono text-sm">
                  {pr.weight}<span className="text-[10px] text-[var(--text-secondary)] mx-1">{localStorage.getItem('ironlog_unit') || 'kg'}</span>× {pr.reps}
                </td>
                <td className="py-3 font-mono text-[10px] text-[var(--text-secondary)]">{new Date(pr.date).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
