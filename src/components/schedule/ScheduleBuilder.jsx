import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { Plus, X, Search } from 'lucide-react';

const DAYS_OF_WEEK = [
  { id: 1, name: 'Monday' },
  { id: 2, name: 'Tuesday' },
  { id: 3, name: 'Wednesday' },
  { id: 4, name: 'Thursday' },
  { id: 5, name: 'Friday' },
  { id: 6, name: 'Saturday' },
  { id: 0, name: 'Sunday' }
];

const CATEGORIES = ['Strength', 'Calisthenics', 'Cardio', 'Hybrid', 'Rest'];
const COLORS = [
  '#E53E3E', // red
  '#ED8936', // orange
  '#ECC94B', // yellow
  '#48BB78', // green
  '#38B2AC', // teal
  '#4299E1', // blue
  '#9F7AEA', // purple
  '#A0AEC0'  // grey
];

export default function ScheduleBuilder({ session }) {
  const [schedule, setSchedule] = useState({});
  const [allExercises, setAllExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [showExerciseModal, setShowExerciseModal] = useState(null); // dayId or null

  useEffect(() => {
    fetchData();
  }, [session]);

  const fetchData = async () => {
    setLoading(true);
    
    // Fetch exercises library
    const { data: exData } = await supabase
      .from('exercises')
      .select('*')
      .eq('user_id', session.user.id)
      .order('name');
    setAllExercises(exData || []);

    // Fetch schedule
    const { data: daysData } = await supabase
      .from('workout_days')
      .select('*')
      .eq('user_id', session.user.id);
      
    if (daysData) {
      const scheduleMap = {};
      
      // Fetch exercises for each day
      const dayIds = daysData.map(d => d.id);
      const { data: dayExData } = await supabase
        .from('workout_day_exercises')
        .select('*, exercises(*)')
        .in('workout_day_id', dayIds)
        .order('order_index');

      daysData.forEach(day => {
        scheduleMap[day.day_of_week] = {
          ...day,
          exercises: dayExData?.filter(de => de.workout_day_id === day.id).map(de => ({
            ...de.exercises,
            target_sets: de.target_sets || 3,
            target_weight: de.target_weight
          })) || []
        };
      });

      // Fill missing days with defaults
      DAYS_OF_WEEK.forEach(d => {
        if (!scheduleMap[d.id]) {
          scheduleMap[d.id] = {
            day_of_week: d.id,
            workout_name: '',
            category: 'Rest',
            color: '#A0AEC0',
            exercises: []
          };
        }
      });
      setSchedule(scheduleMap);
    }
    setLoading(false);
  };

  const handleUpdate = (dayId, field, value) => {
    setSchedule(prev => ({
      ...prev,
      [dayId]: {
        ...prev[dayId],
        [field]: value,
        ...(field === 'category' && value === 'Rest' ? { workout_name: 'Rest Day', color: '#A0AEC0', exercises: [] } : {})
      }
    }));
  };

  const addExerciseToDay = (dayId, exercise) => {
    setSchedule(prev => {
      const currentExs = prev[dayId].exercises || [];
      if (currentExs.find(e => e.id === exercise.id)) return prev;
      return {
        ...prev,
        [dayId]: {
          ...prev[dayId],
          exercises: [...currentExs, { ...exercise, target_sets: 3, target_weight: '' }]
        }
      };
    });
    setShowExerciseModal(null);
  };

  const removeExerciseFromDay = (dayId, exerciseId) => {
    setSchedule(prev => ({
      ...prev,
      [dayId]: {
        ...prev[dayId],
        exercises: prev[dayId].exercises.filter(e => e.id !== exerciseId)
      }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    
    try {
      // 1. Upsert workout_days
      const dayUpdates = Object.values(schedule).map(day => ({
        user_id: session.user.id,
        day_of_week: day.day_of_week,
        workout_name: day.workout_name,
        category: day.category,
        color: day.color,
        ...(day.id ? { id: day.id } : {})
      }));

      const { data: savedDays, error: dayError } = await supabase
        .from('workout_days')
        .upsert(dayUpdates, { onConflict: 'day_of_week, user_id' }) // On local it might be different, let's assume id or composite
        .select();

      if (dayError) throw dayError;

      // 2. Update exercises for each day
      // Delete old mapping for these days and insert new ones
      const savedDayIds = savedDays.map(d => d.id);
      await supabase.from('workout_day_exercises').delete().in('workout_day_id', savedDayIds);

      const mappingToInsert = [];
      savedDays.forEach(savedDay => {
        const localDay = schedule[savedDay.day_of_week];
        if (localDay.exercises) {
          localDay.exercises.forEach((ex, idx) => {
            mappingToInsert.push({
              workout_day_id: savedDay.id,
              exercise_id: ex.id,
              target_sets: ex.target_sets || 3,
              target_weight: ex.target_weight || null,
              order_index: idx
            });
          });
        }
      });

      if (mappingToInsert.length > 0) {
        const { error: mapError } = await supabase.from('workout_day_exercises').insert(mappingToInsert);
        if (mapError) throw mapError;
      }
      
      setMessage({ type: 'success', text: 'Schedule and templates saved successfully.' });
      await fetchData();
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--accent-primary)]"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pb-10">
      <div className="flex justify-between items-end mb-6 border-b border-[var(--bg-border)] pb-2 px-4 md:px-0">
        <div>
          <h2 className="text-3xl m-0 tracking-tight">Weekly Training Split</h2>
          <p className="text-[var(--text-secondary)] font-mono text-sm mt-1">Define your workouts and exercise templates.</p>
        </div>
        <button 
          onClick={handleSave} 
          disabled={saving}
          className="iron-button-primary"
        >
          {saving ? 'Saving...' : 'Save Schedule'}
        </button>
      </div>

      {message && (
        <div className={`mx-4 md:mx-0 mb-6 p-3 rounded font-mono text-sm border ${message.type === 'success' ? 'bg-[var(--accent-dim)] border-[var(--success)] text-[var(--success)]' : 'bg-[var(--accent-dim)] border-[var(--accent-primary)] text-[var(--accent-primary)]'}`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 px-4 md:px-0">
        {DAYS_OF_WEEK.map(day => {
          const dayData = schedule[day.id];
          const isRest = dayData?.category === 'Rest';

          return (
            <div 
              key={day.id} 
              className={`iron-card flex flex-col gap-4 transition-all duration-300 ${isRest ? 'opacity-60 grayscale-[0.5]' : 'opacity-100 shadow-xl'}`}
              style={{ borderTopWidth: '4px', borderTopColor: dayData?.color || 'var(--bg-border)' }}
            >
              <div className="font-bold text-xl uppercase tracking-widest border-b border-[var(--bg-border)] pb-2">{day.name}</div>
              
              <div>
                <label className="block text-[10px] text-[var(--text-secondary)] font-mono uppercase mb-1">Focus</label>
                <select 
                  value={dayData?.category}
                  onChange={(e) => handleUpdate(day.id, 'category', e.target.value)}
                  className="w-full bg-[var(--bg-base)] border border-[var(--bg-border)] rounded p-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {!isRest && (
                <>
                  <div>
                    <label className="block text-[10px] text-[var(--text-secondary)] font-mono uppercase mb-1">Workout Name</label>
                    <input 
                      type="text" 
                      value={dayData?.workout_name || ''}
                      onChange={(e) => handleUpdate(day.id, 'workout_name', e.target.value)}
                      placeholder="e.g. Heavy Push"
                      className="w-full bg-[var(--bg-base)] border border-[var(--bg-border)] rounded p-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-[var(--text-secondary)] font-mono uppercase mb-1 flex justify-between items-center">
                      Template Exercises
                      <button onClick={() => setShowExerciseModal(day.id)} className="text-[var(--accent-primary)] hover:underline">Add</button>
                    </label>
                    <div className="space-y-1 mt-1">
                      {dayData?.exercises?.length > 0 ? (
                        dayData.exercises.map(ex => (
                          <div key={ex.id} className="flex flex-col bg-[var(--bg-elevated)] p-3 rounded-xl border border-[var(--bg-border)] group/ex transition-all hover:border-[var(--accent-primary)]/30">
                            <div className="flex justify-between items-center mb-2">
                              <span className="truncate font-bold text-[var(--text-primary)]">{ex.name}</span>
                              <button onClick={() => removeExerciseFromDay(day.id, ex.id)} className="text-[var(--text-tertiary)] hover:text-[var(--accent-primary)] ml-2 transition-colors">
                                <X size={14} />
                              </button>
                            </div>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[9px] font-mono uppercase text-[var(--text-secondary)]">Sets</span>
                                <input 
                                  type="number" 
                                  value={ex.target_sets || 3}
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value) || 1;
                                    setSchedule(prev => {
                                      const dayData = prev[day.id];
                                      const updatedExs = dayData.exercises.map(e => 
                                        e.id === ex.id ? { ...e, target_sets: val } : e
                                      );
                                      return { ...prev, [day.id]: { ...dayData, exercises: updatedExs } };
                                    });
                                  }}
                                  className="w-10 bg-[var(--bg-base)] border border-[var(--bg-border)] rounded px-1 py-0.5 text-[10px] font-mono focus:border-[var(--accent-primary)] focus:outline-none"
                                />
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[9px] font-mono uppercase text-[var(--text-secondary)]">Weight</span>
                                <div className="flex items-center gap-1">
                                  <input 
                                    type="number" 
                                    step="0.5"
                                    value={ex.target_weight || ''}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setSchedule(prev => {
                                        const dayData = prev[day.id];
                                        const updatedExs = dayData.exercises.map(e => 
                                          e.id === ex.id ? { ...e, target_weight: val } : e
                                        );
                                        return { ...prev, [day.id]: { ...dayData, exercises: updatedExs } };
                                      });
                                    }}
                                    placeholder="0"
                                    className="w-14 bg-[var(--bg-base)] border border-[var(--bg-border)] rounded px-1 py-0.5 text-[10px] font-mono focus:border-[var(--accent-primary)] focus:outline-none"
                                  />
                                  <span className="text-[8px] font-mono text-[var(--text-tertiary)] uppercase">
                                    {localStorage.getItem('ironlog_unit') || 'kg'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-[10px] text-[var(--text-tertiary)] font-mono italic p-2 border border-dashed border-[var(--bg-border)] rounded text-center">
                          No exercises set
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] text-[var(--text-secondary)] font-mono uppercase mb-1">Color Code</label>
                    <div className="flex flex-wrap gap-2">
                      {COLORS.map(color => (
                        <button
                          key={color}
                          onClick={() => handleUpdate(day.id, 'color', color)}
                          className={`w-5 h-5 rounded-full border-2 ${dayData?.color === color ? 'border-white scale-110' : 'border-transparent opacity-50'}`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {showExerciseModal !== null && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="iron-card w-full max-w-md max-h-[80vh] flex flex-col p-0 overflow-hidden shadow-2xl border-[var(--accent-primary)]/20">
            <div className="p-4 border-b border-[var(--bg-border)] flex justify-between items-center bg-[var(--bg-elevated)]">
              <h3 className="m-0 text-xl tracking-widest uppercase">Select Exercise</h3>
              <button onClick={() => setShowExerciseModal(null)} className="text-[var(--text-secondary)] hover:text-white">
                <X size={24} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {allExercises.length > 0 ? (
                allExercises.map(ex => (
                  <button 
                    key={ex.id}
                    onClick={() => addExerciseToDay(showExerciseModal, ex)}
                    className="w-full text-left p-3 hover:bg-[var(--bg-elevated)] rounded border border-transparent hover:border-[var(--bg-border)] transition-all group"
                  >
                    <div className="font-bold group-hover:text-[var(--accent-primary)] transition-colors">{ex.name}</div>
                    <div className="text-[10px] font-mono uppercase text-[var(--text-secondary)]">{ex.muscle_group}</div>
                  </button>
                ))
              ) : (
                <div className="p-10 text-center text-[var(--text-secondary)] font-mono italic">
                  Library is empty. Create exercises first.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
