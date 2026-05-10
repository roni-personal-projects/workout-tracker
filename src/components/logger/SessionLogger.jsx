import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { ChevronLeft, Plus, Save, Trash2, Search, X, Calendar, ChevronRight } from 'lucide-react';
import SetRow from './SetRow';
import CardioBlock from './CardioBlock';
import ExerciseSelector from './ExerciseSelector';

export default function SessionLogger({ session, workoutName, existingSessionId, initialExercises, initialDate, onClose }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sessionId, setSessionId] = useState(existingSessionId);
  const [sessionDate, setSessionDate] = useState(initialDate || new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  
  // Array of exercise objects containing their sets
  const [sessionExercises, setSessionExercises] = useState([]);
  const [cardioLogs, setCardioLogs] = useState([]);
  
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // Historical data for PR detection: { exercise_id: { maxWeightReps: number } }
  const [prData, setPrData] = useState({});

  useEffect(() => {
    loadSessionData();
  }, []);

  // When date changes on a NEW session, load the template for that day
  useEffect(() => {
    if (!existingSessionId) {
      loadTemplateForDate();
    }
  }, [sessionDate]);

  const loadTemplateForDate = async () => {
    const dayOfWeek = new Date(sessionDate).getDay();
    
    // Fetch template for this day
    const { data: dayData } = await supabase
      .from('workout_days')
      .select('id, workout_name')
      .eq('user_id', session.user.id)
      .eq('day_of_week', dayOfWeek)
      .single();

    if (dayData) {
      const { data: exData } = await supabase
        .from('workout_day_exercises')
        .select('*, exercises(*)')
        .eq('workout_day_id', dayData.id)
        .order('order_index');

      if (exData) {
        const templateExs = exData.map(de => ({
          exercise_id: de.exercises.id,
          exercise_name: de.exercises.name,
          muscle_group: de.exercises.muscle_group,
          exercise_type: de.exercises.exercise_type,
          tracking_type: de.exercises.tracking_type || 'Weight & Reps',
          sets: Array.from({ length: de.target_sets || 3 }).map((_, i) => ({
            ...createEmptySet(i + 1),
            weight: de.target_weight || ''
          }))
        }));
        setSessionExercises(templateExs);
      }
    } else {
      // If no template, just clear
      setSessionExercises([]);
    }
  };

  const loadSessionData = async () => {
    setLoading(true);
    
    // Load PR data for this user
    const { data: allSets } = await supabase
      .from('session_sets')
      .select('exercise_id, weight, reps')
      .not('exercise_id', 'is', null);
      
    const prMap = {};
    if (allSets) {
      allSets.forEach(s => {
        if (!s.weight || !s.reps) return;
        const vol = s.weight * s.reps;
        if (!prMap[s.exercise_id] || vol > prMap[s.exercise_id]) {
          prMap[s.exercise_id] = vol;
        }
      });
    }
    setPrData(prMap);

    setPrData(prMap);

    if (existingSessionId) {
      // Load existing session
      const { data: sessionInfo } = await supabase.from('sessions').select('*').eq('id', existingSessionId).single();
      if (sessionInfo) {
        setNotes(sessionInfo.notes || '');
        setSessionDate(sessionInfo.session_date);
      }

      const { data: sets } = await supabase
        .from('session_sets')
        .select('*, exercises(tracking_type)')
        .eq('session_id', existingSessionId)
        .order('created_at');
      const { data: cardio } = await supabase.from('cardio_logs').select('*').eq('session_id', existingSessionId).order('created_at');

      if (sets) {
        // Group sets by exercise_id
        const exercisesMap = new Map();
        sets.forEach(set => {
          const key = set.exercise_id || set.exercise_name;
          if (!exercisesMap.has(key)) {
            exercisesMap.set(key, {
              exercise_id: set.exercise_id,
              exercise_name: set.exercise_name,
              tracking_type: set.exercises?.tracking_type || 'Weight & Reps',
              sets: []
            });
          }
          exercisesMap.get(key).sets.push({
            id: set.id,
            set_number: set.set_number,
            reps: set.reps,
            weight: set.weight,
            rpe: set.rpe
          });
        });
        setSessionExercises(Array.from(exercisesMap.values()));
      }
      
      if (cardio) {
        setCardioLogs(cardio);
      }
    } else if (initialExercises && initialExercises.length > 0) {
      // Pre-fill from template provided by parent (e.g. TodayScreen)
      const templateExs = initialExercises.map(ex => ({
        exercise_id: ex.id,
        exercise_name: ex.name,
        muscle_group: ex.muscle_group,
        exercise_type: ex.exercise_type,
        sets: Array.from({ length: ex.target_sets || 3 }).map((_, i) => ({
          ...createEmptySet(i + 1),
          weight: ex.target_weight || ''
        }))
      }));
      setSessionExercises(templateExs);
    } else if (!existingSessionId) {
      // Load template for the initial date
      await loadTemplateForDate();
    }
    
    setLoading(false);
  };

  const addExercise = (exercise) => {
    setSessionExercises([...sessionExercises, {
      exercise_id: exercise.id,
      exercise_name: exercise.name,
      muscle_group: exercise.muscle_group,
      exercise_type: exercise.exercise_type,
      tracking_type: exercise.tracking_type || 'Weight & Reps',
      sets: [createEmptySet(1)]
    }]);
    setShowExerciseModal(false);
  };

  const removeExercise = (index) => {
    const newExs = [...sessionExercises];
    newExs.splice(index, 1);
    setSessionExercises(newExs);
  };

  const createEmptySet = (setNumber) => ({
    id: `temp-${Date.now()}-${Math.random()}`,
    set_number: setNumber,
    reps: '',
    weight: '',
    rpe: ''
  });

  const addSet = (exerciseIndex) => {
    const newExs = [...sessionExercises];
    const ex = newExs[exerciseIndex];
    const lastSet = ex.sets[ex.sets.length - 1];
    
    ex.sets.push({
      ...createEmptySet(ex.sets.length + 1),
      weight: lastSet ? lastSet.weight : '', // copy previous weight
      reps: lastSet ? lastSet.reps : '',     // copy previous reps
    });
    setSessionExercises(newExs);
  };

  const removeSet = (exerciseIndex, setIndex) => {
    const newExs = [...sessionExercises];
    newExs[exerciseIndex].sets.splice(setIndex, 1);
    
    // Update set numbers
    newExs[exerciseIndex].sets.forEach((s, idx) => s.set_number = idx + 1);
    
    setSessionExercises(newExs);
  };

  const updateSet = (exerciseIndex, setIndex, field, value) => {
    const newExs = [...sessionExercises];
    newExs[exerciseIndex].sets[setIndex][field] = value;
    setSessionExercises(newExs);
  };

  const addCardio = () => {
    setCardioLogs([...cardioLogs, {
      id: `temp-cardio-${Date.now()}`,
      cardio_type: 'Run',
      duration_mins: '',
      distance_km: '',
      avg_hr: '',
      notes: ''
    }]);
  };

  const removeCardio = (index) => {
    const newCardio = [...cardioLogs];
    newCardio.splice(index, 1);
    setCardioLogs(newCardio);
  };

  const updateCardio = (index, field, value) => {
    const newCardio = [...cardioLogs];
    newCardio[index][field] = value;
    setCardioLogs(newCardio);
  };

  const handleDeleteSession = async () => {
    if (!window.confirm('Are you sure you want to delete this entire session? This cannot be undone.')) return;
    
    setSaving(true);
    try {
      const { error } = await supabase.from('sessions').delete().eq('id', sessionId);
      if (error) {
        console.error('Delete error:', error);
        alert(`Error deleting session: ${error.message || 'Unknown error'}`);
      } else {
        onClose();
      }
    } catch (err) {
      console.error('Catch error:', err);
      alert('An unexpected error occurred during deletion.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSession = async () => {
    setSaving(true);
    
    try {
      let currentSessionId = sessionId;
      
      if (!currentSessionId) {
        // Create the session now
        const { data, error } = await supabase.from('sessions').insert([{
          user_id: session.user.id,
          session_date: sessionDate,
          workout_name: workoutName,
          notes: notes
        }]).select().single();
        
        if (error) throw error;
        currentSessionId = data.id;
        setSessionId(currentSessionId);
      } else {
        // Update session notes and date
        await supabase.from('sessions').update({ notes, session_date: sessionDate }).eq('id', currentSessionId);
      }
      
      // We will delete all existing sets/cardio for this session and insert new ones to avoid complex diffing
      await supabase.from('session_sets').delete().eq('session_id', currentSessionId);
      await supabase.from('cardio_logs').delete().eq('session_id', currentSessionId);
      
      const setsToInsert = [];
      sessionExercises.forEach(ex => {
        ex.sets.forEach(s => {
          setsToInsert.push({
            session_id: currentSessionId,
            exercise_id: ex.exercise_id,
            exercise_name: ex.exercise_name,
            set_number: s.set_number,
            reps: s.reps ? parseInt(s.reps) : null,
            weight: s.weight ? parseFloat(s.weight) : null,
            rpe: s.rpe ? parseInt(s.rpe) : null
          });
        });
      });
      
      if (setsToInsert.length > 0) {
        const { error } = await supabase.from('session_sets').insert(setsToInsert);
        if (error) throw new Error(`Sets Insert Error: ${error.message || JSON.stringify(error)}`);
      }

      const cardioToInsert = cardioLogs.map(c => ({
        session_id: currentSessionId,
        user_id: session.user.id,
        cardio_type: c.cardio_type,
        duration_mins: parseFloat(c.duration_mins) || 0,
        distance_km: c.distance_km ? parseFloat(c.distance_km) : null,
        avg_hr: c.avg_hr ? parseInt(c.avg_hr) : null,
        notes: c.notes || ''
      }));

      if (cardioToInsert.length > 0) {
        const { error } = await supabase.from('cardio_logs').insert(cardioToInsert);
        if (error) throw new Error(`Cardio Insert Error: ${error.message || JSON.stringify(error)}`);
      }

      // Flash green effect can be done by changing button state briefly
      setTimeout(() => {
        onClose();
      }, 500);
      
    } catch (err) {
      console.error(err);
      alert(err.message || 'Error saving session');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--accent-primary)]"></div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-[var(--bg-base)] overflow-y-auto">
      <div className="sticky top-0 z-10 bg-[var(--bg-surface)] border-b border-[var(--bg-border)] px-4 py-3 flex justify-between items-center">
        <button onClick={onClose} className="text-[var(--text-secondary)] flex items-center gap-1 font-mono uppercase text-xs tracking-wider">
          <ChevronLeft size={16} /> Back
        </button>
        <div className="flex flex-col items-center flex-1 text-center">
          <div className="font-bold uppercase tracking-widest text-sm text-[var(--text-primary)]">
            {workoutName || 'Session Log'}
          </div>
          <div className="relative mt-1">
            <button 
              onClick={() => setShowDatePicker(true)}
              className="bg-[var(--bg-elevated)] border border-[var(--bg-border)] rounded-full px-4 py-1 text-[10px] font-mono text-[var(--accent-primary)] uppercase flex items-center gap-2 hover:border-[var(--accent-primary)] transition-all shadow-sm active:scale-95"
            >
              <Calendar size={12} />
              {new Date(sessionDate).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
            </button>

            {showDatePicker && (
              <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowDatePicker(false)}>
                <div className="bg-[var(--bg-surface)] w-full max-w-sm rounded-3xl border border-[var(--bg-border)] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="m-0 text-lg font-bold uppercase tracking-widest">Select Date</h3>
                      <button onClick={() => setShowDatePicker(false)} className="p-2 hover:bg-[var(--bg-elevated)] rounded-full transition-colors">
                        <X size={20} />
                      </button>
                    </div>
                    
                    <div className="flex justify-between items-center mb-4">
                      <button 
                        onClick={() => {
                          const d = new Date(sessionDate);
                          d.setMonth(d.getMonth() - 1);
                          setSessionDate(d.toISOString().split('T')[0]);
                        }}
                        className="p-2 hover:bg-[var(--bg-elevated)] rounded-lg"
                      >
                        <ChevronLeft size={20} />
                      </button>
                      <div className="font-mono uppercase text-sm font-bold">
                        {new Date(sessionDate).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                      </div>
                      <button 
                        onClick={() => {
                          const d = new Date(sessionDate);
                          d.setMonth(d.getMonth() + 1);
                          setSessionDate(d.toISOString().split('T')[0]);
                        }}
                        className="p-2 hover:bg-[var(--bg-elevated)] rounded-lg"
                      >
                        <ChevronRight size={20} />
                      </button>
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                      {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
                        <div key={d} className="text-center text-[10px] font-mono text-[var(--text-tertiary)] py-2">{d}</div>
                      ))}
                      {(() => {
                        const d = new Date(sessionDate);
                        const firstDay = new Date(d.getFullYear(), d.getMonth(), 1).getDay();
                        const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
                        const cells = [];
                        for (let i = 0; i < firstDay; i++) cells.push(<div key={`pad-${i}`} />);
                        for (let i = 1; i <= daysInMonth; i++) {
                          const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
                          const isSelected = sessionDate === dateStr;
                          const isToday = new Date().toISOString().split('T')[0] === dateStr;
                          cells.push(
                            <button
                              key={i}
                              onClick={() => {
                                setSessionDate(dateStr);
                                setShowDatePicker(false);
                              }}
                              className={`h-10 w-10 rounded-xl flex items-center justify-center text-xs font-mono transition-all ${
                                isSelected ? 'bg-[var(--accent-primary)] text-white scale-110 shadow-lg' : 
                                isToday ? 'border border-[var(--accent-primary)] text-[var(--accent-primary)]' : 
                                'hover:bg-[var(--bg-elevated)]'
                              }`}
                            >
                              {i}
                            </button>
                          );
                        }
                        return cells;
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        <button 
          onClick={handleSaveSession} 
          disabled={saving}
          className="iron-button-primary py-1 px-3 flex items-center gap-1 text-sm"
        >
          <Save size={16} /> {saving ? '...' : 'Save'}
        </button>
      </div>

      <div className="max-w-3xl mx-auto p-4 pb-24">
        {/* Exercises */}
        <div className="space-y-6">
          {sessionExercises.map((ex, exIndex) => (
            <div key={ex.exercise_id + exIndex} className="iron-card border-l-4 border-l-[var(--chart-2)] p-0 overflow-hidden">
              <div className="bg-[var(--bg-elevated)] p-3 flex justify-between items-center border-b border-[var(--bg-border)]">
                <div>
                  <h3 className="font-bold tracking-wide m-0">{ex.exercise_name}</h3>
                  {(ex.muscle_group || ex.exercise_type) && (
                    <div className="flex gap-2 mt-1">
                      {ex.muscle_group && <span className="text-[10px] font-mono uppercase text-[var(--text-secondary)]">{ex.muscle_group}</span>}
                      {ex.exercise_type && <span className="text-[10px] font-mono uppercase text-[var(--accent-primary)]">{ex.exercise_type}</span>}
                    </div>
                  )}
                </div>
                <button onClick={() => removeExercise(exIndex)} className="text-[var(--text-secondary)] hover:text-[var(--accent-primary)]">
                  <X size={18} />
                </button>
              </div>
              
              <div className="p-2 sm:p-4">
                <div className="grid grid-cols-12 gap-2 text-[10px] font-mono uppercase text-[var(--text-secondary)] mb-2 px-1 text-center">
                  <div className="col-span-1 sm:col-span-2 text-left">Set</div>
                  {ex.tracking_type === 'Timed' ? (
                    <div className="col-span-6">Seconds</div>
                  ) : ex.tracking_type === 'Reps Only' ? (
                    <>
                      <div className="col-span-3">BW</div>
                      <div className="col-span-3">Reps</div>
                    </>
                  ) : (
                    <>
                      <div className="col-span-3">{localStorage.getItem('ironlog_unit') || 'kg'}</div>
                      <div className="col-span-3">Reps</div>
                    </>
                  )}
                  <div className="col-span-3">RPE</div>
                  <div className="col-span-2 sm:col-span-2"></div>
                </div>
                
                {ex.sets.map((set, setIndex) => (
                  <SetRow 
                    key={set.id}
                    set={set}
                    trackingType={ex.tracking_type}
                    isNewPR={prData[ex.exercise_id] && (set.weight * set.reps > prData[ex.exercise_id])}
                    onChange={(field, value) => updateSet(exIndex, setIndex, field, value)}
                    onRemove={() => removeSet(exIndex, setIndex)}
                  />
                ))}
                
                <button 
                  onClick={() => addSet(exIndex)}
                  className="w-full mt-3 py-2 border border-dashed border-[var(--bg-border)] text-[var(--text-secondary)] rounded font-mono text-xs uppercase hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] transition-colors"
                >
                  + Add Set
                </button>
              </div>
            </div>
          ))}
        </div>

        <button 
          onClick={() => setShowExerciseModal(true)}
          className="w-full mt-6 py-4 iron-button-ghost flex justify-center items-center gap-2"
        >
          <Plus size={20} /> ADD EXERCISE
        </button>

        {/* Cardio Section */}
        {cardioLogs.length > 0 && (
          <div className="mt-8 space-y-4">
            <h3 className="font-bold text-xl uppercase border-b border-[var(--bg-border)] pb-2 m-0 text-[var(--chart-3)]">Cardio</h3>
            {cardioLogs.map((cardio, index) => (
              <CardioBlock 
                key={cardio.id}
                cardio={cardio}
                onChange={(field, value) => updateCardio(index, field, value)}
                onRemove={() => removeCardio(index)}
              />
            ))}
          </div>
        )}
        
        <button 
          onClick={addCardio}
          className="w-full mt-4 py-4 border border-dashed border-[var(--bg-border)] text-[var(--text-secondary)] rounded flex justify-center items-center gap-2 hover:border-[var(--chart-3)] hover:text-[var(--chart-3)] transition-colors uppercase font-mono text-sm tracking-wider"
        >
          <Plus size={16} /> ADD CARDIO
        </button>

        {/* Notes */}
        <div className="mt-8">
          <label className="block text-[10px] text-[var(--text-secondary)] font-mono uppercase mb-2">Session Notes</label>
          <textarea 
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded p-3 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] min-h-[100px]"
            placeholder="How did it feel today?"
          />
        </div>

        {sessionId && (
          <button 
            onClick={handleDeleteSession}
            disabled={saving}
            className="w-full mt-12 py-4 flex justify-center items-center gap-2 text-[var(--error)] bg-[var(--error)]/5 border border-[var(--error)]/20 rounded-xl hover:bg-[var(--error)]/10 transition-colors uppercase font-mono text-xs tracking-[0.2em]"
          >
            <Trash2 size={16} /> Delete Entire Session
          </button>
        )}
      </div>

      {showExerciseModal && (
        <ExerciseSelector 
          session={session} 
          onSelect={addExercise} 
          onClose={() => setShowExerciseModal(false)} 
        />
      )}
    </div>
  );
}
