import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { Play, CheckCircle2, AlertCircle } from 'lucide-react';
import SessionLogger from '../logger/SessionLogger';

export default function TodayScreen({ session }) {
  const [loading, setLoading] = useState(true);
  const [todaySchedule, setTodaySchedule] = useState(null);
  const [templateExercises, setTemplateExercises] = useState([]);
  const [todaySession, setTodaySession] = useState(null);
  const [sessionSummary, setSessionSummary] = useState(null);
  const [isLogging, setIsLogging] = useState(false);

  useEffect(() => {
    fetchTodayData();
  }, [session]);

  const fetchTodayData = async () => {
    setLoading(true);
    const dayOfWeek = new Date().getDay(); // 0=Sun, 1=Mon...
    const todayDate = new Date().toISOString().split('T')[0];

    // Fetch schedule
    const { data: scheduleData } = await supabase
      .from('workout_days')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('day_of_week', dayOfWeek)
      .maybeSingle();

    if (scheduleData) {
      setTodaySchedule(scheduleData);
      // Fetch template exercises
      const { data: templateExs } = await supabase
        .from('workout_day_exercises')
        .select('target_sets, exercises(*)')
        .eq('workout_day_id', scheduleData.id)
        .order('order_index');
      setTemplateExercises(templateExs?.map(te => ({
        ...te.exercises,
        target_sets: te.target_sets || 3,
        target_weight: te.target_weight,
        tracking_type: te.exercises.tracking_type || 'Weight & Reps'
      })).filter(ex => ex.id) || []);
    } else {
      setTodaySchedule({ category: 'Rest', workout_name: 'Rest Day' });
      setTemplateExercises([]);
    }

    // Fetch session
    const { data: sessionData } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('session_date', todayDate)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    setTodaySession(sessionData);

    if (sessionData) {
      // Fetch summary data
      const { data: sets } = await supabase
        .from('session_sets')
        .select('*')
        .eq('session_id', sessionData.id);
        
      const { data: cardio } = await supabase
        .from('cardio_logs')
        .select('*')
        .eq('session_id', sessionData.id);

      let totalVolume = 0;
      let exercisesCount = new Set();
      
      sets?.forEach(set => {
        if (set.weight && set.reps) {
          totalVolume += (set.weight * set.reps);
        }
        exercisesCount.add(set.exercise_id || set.exercise_name);
      });

      setSessionSummary({
        exercises: exercisesCount.size,
        sets: sets?.length || 0,
        volume: totalVolume,
        cardio: cardio?.length || 0
      });
    }

    setLoading(false);
  };

  if (isLogging) {
    return (
      <SessionLogger 
        session={session} 
        workoutName={todaySchedule?.workout_name !== 'Rest Day' ? todaySchedule?.workout_name : ''}
        existingSessionId={todaySession?.id}
        initialExercises={!todaySession?.id ? templateExercises : []}
        onClose={() => {
          setIsLogging(false);
          fetchTodayData();
        }}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--accent-primary)]"></div>
      </div>
    );
  }

  const isRestDay = todaySchedule?.category === 'Rest' || !todaySchedule;

  return (
    <div className="max-w-2xl mx-auto pb-10">
      <h2 className="text-3xl mb-6 border-b border-[var(--bg-border)] pb-2 m-0">Today</h2>
      
      <div 
        className="iron-card mb-8 flex flex-col items-center justify-center p-10 text-center relative overflow-hidden"
        style={!isRestDay ? { borderTopWidth: '4px', borderTopColor: todaySchedule?.color || 'var(--accent-primary)' } : {}}
      >
        {!isRestDay && (
          <div 
            className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none" 
            style={{ backgroundColor: todaySchedule?.color || 'var(--accent-primary)' }}
          ></div>
        )}
        
        <h3 className="text-sm font-mono text-[var(--text-secondary)] uppercase tracking-widest mb-2">
          Scheduled Workout
        </h3>
        <h1 className={`text-5xl uppercase tracking-tighter m-0 ${isRestDay ? 'text-[var(--text-secondary)] italic' : 'text-[var(--text-primary)]'}`}>
          {todaySchedule?.workout_name || 'Rest Day'}
        </h1>
        
        {!isRestDay && (
          <span className="mt-4 px-3 py-1 bg-[var(--bg-elevated)] text-[var(--text-secondary)] text-xs font-mono uppercase rounded">
            {todaySchedule?.category}
          </span>
        )}

        {todaySession ? (
          <div className="mt-8 w-full">
            <div className="flex items-center justify-center gap-2 text-[var(--success)] mb-6">
              <CheckCircle2 size={24} />
              <span className="font-bold tracking-wider uppercase text-lg">Session Logged</span>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-left">
              <div className="bg-[var(--bg-base)] border border-[var(--bg-border)] p-3 rounded">
                <div className="text-[10px] text-[var(--text-secondary)] font-mono uppercase mb-1">Exercises</div>
                <div className="font-mono text-xl">{sessionSummary?.exercises || 0}</div>
              </div>
              <div className="bg-[var(--bg-base)] border border-[var(--bg-border)] p-3 rounded">
                <div className="text-[10px] text-[var(--text-secondary)] font-mono uppercase mb-1">Sets</div>
                <div className="font-mono text-xl">{sessionSummary?.sets || 0}</div>
              </div>
              <div className="bg-[var(--bg-base)] border border-[var(--bg-border)] p-3 rounded">
                <div className="text-[10px] text-[var(--text-secondary)] font-mono uppercase mb-1">Volume</div>
                <div className="font-mono text-xl">{sessionSummary?.volume.toLocaleString() || 0} <span className="text-xs text-[var(--text-tertiary)]">{localStorage.getItem('ironlog_unit') || 'kg'}</span></div>
              </div>
              <div className="bg-[var(--bg-base)] border border-[var(--bg-border)] p-3 rounded">
                <div className="text-[10px] text-[var(--text-secondary)] font-mono uppercase mb-1">Cardio</div>
                <div className="font-mono text-xl">{sessionSummary?.cardio || 0}</div>
              </div>
            </div>
            
            <button 
              onClick={() => setIsLogging(true)}
              className="mt-6 iron-button-ghost w-full uppercase tracking-widest text-sm"
            >
              Edit Session
            </button>
          </div>
        ) : (
          <div className="mt-8 w-full max-w-xs">
            <button 
              onClick={() => setIsLogging(true)}
              className="iron-button-primary w-full py-4 text-lg uppercase tracking-widest flex justify-center items-center gap-2"
            >
              <Play size={20} fill="currentColor" />
              Start Session
            </button>
            {isRestDay && (
              <p className="text-xs text-[var(--text-secondary)] font-mono mt-4 flex items-center justify-center gap-1">
                <AlertCircle size={14} /> You can still log a session on a rest day.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
