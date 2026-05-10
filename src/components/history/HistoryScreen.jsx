import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { Calendar as CalendarIcon, ChevronRight, ChevronLeft, Edit2, Search, Filter, Plus, Trash2 } from 'lucide-react';
import SessionLogger from '../logger/SessionLogger';

export default function HistoryScreen({ session }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'calendar'
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, [session]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select(`
          *,
          session_sets(count),
          cardio_logs(count)
        `)
        .eq('user_id', session.user.id)
        .order('session_date', { ascending: false });

      if (data) setSessions(data);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDelete = async () => {
    if (!confirmDeleteId) return;
    
    setIsDeleting(true);
    try {
      const { error } = await supabase.from('sessions').delete().eq('id', confirmDeleteId);
      if (error) {
        alert(`Delete failed: ${error.message}`);
      } else {
        setSessions(prev => prev.filter(s => s.id !== confirmDeleteId));
        setConfirmDeleteId(null);
      }
    } catch (err) {
      alert('An unexpected error occurred.');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredSessions = sessions.filter(s => 
    s.workout_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.session_date.includes(searchTerm)
  );

  // Calendar Logic
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getFullYear();
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    const days = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    return { firstDay, days };
  };

  const { firstDay, days } = getDaysInMonth(currentMonth);
  const calendarDays = [];
  // Fill empty spaces
  for (let i = 0; i < firstDay; i++) calendarDays.push(null);
  for (let i = 1; i <= days; i++) calendarDays.push(i);

  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));

  const sessionsByDate = sessions.reduce((acc, s) => {
    acc[s.session_date] = acc[s.session_date] || [];
    acc[s.session_date].push(s);
    return acc;
  }, {});

  if (editingSessionId) {
    return (
      <SessionLogger 
        session={session}
        existingSessionId={editingSessionId === 'new' ? null : editingSessionId}
        onClose={() => {
          setEditingSessionId(null);
          fetchHistory();
        }}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 border-b border-[var(--bg-border)] pb-6 px-4 md:px-0 gap-4">
        <div>
          <h2 className="text-3xl m-0 tracking-tight font-bold uppercase">Workout History</h2>
          <p className="text-[var(--text-secondary)] m-0 font-mono text-xs uppercase tracking-widest mt-1">Review your training progress</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* View Toggle */}
          <div className="bg-[var(--bg-elevated)] p-1 rounded-xl border border-[var(--bg-border)] flex">
            <button 
              onClick={() => setViewMode('list')}
              className={`px-4 py-1.5 rounded-lg text-xs font-mono uppercase tracking-widest transition-all ${viewMode === 'list' ? 'bg-[var(--accent-primary)] text-white shadow-lg' : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'}`}
            >
              List
            </button>
            <button 
              onClick={() => setViewMode('calendar')}
              className={`px-4 py-1.5 rounded-lg text-xs font-mono uppercase tracking-widest transition-all ${viewMode === 'calendar' ? 'bg-[var(--accent-primary)] text-white shadow-lg' : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'}`}
            >
              Calendar
            </button>
          </div>

          <div className="relative flex-1 md:flex-initial">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" size={16} />
            <input 
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-[var(--accent-primary)] w-full md:w-48 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200" onClick={() => setConfirmDeleteId(null)}>
          <div className="bg-[var(--bg-surface)] w-full max-w-xs rounded-3xl border border-[var(--bg-border)] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-[var(--error)]/10 text-[var(--error)] rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 size={32} />
              </div>
              <h3 className="text-xl font-bold uppercase tracking-tight mb-2">Delete Workout?</h3>
              <p className="text-[var(--text-secondary)] text-sm mb-8">This action cannot be undone. All sets and records will be removed.</p>
              
              <div className="flex flex-col gap-3">
                <button 
                  onClick={handleQuickDelete}
                  disabled={isDeleting}
                  className="w-full py-4 bg-[var(--error)] text-white rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-red-600 transition-colors shadow-lg shadow-red-900/20 active:scale-95 disabled:opacity-50"
                >
                  {isDeleting ? 'Deleting...' : 'Confirm Delete'}
                </button>
                <button 
                  onClick={() => setConfirmDeleteId(null)}
                  className="w-full py-3 text-[var(--text-secondary)] font-mono uppercase text-[10px] tracking-widest hover:text-[var(--text-primary)] transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--accent-primary)]"></div>
        </div>
      ) : viewMode === 'calendar' ? (
        <div className="px-4 md:px-0">
          <div className="iron-card p-6">
            <div className="flex justify-between items-center mb-8">
              <h3 className="m-0 text-xl font-bold uppercase tracking-widest flex items-center gap-3">
                {currentMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
              </h3>
              <div className="flex gap-2">
                <button onClick={prevMonth} className="p-2 hover:bg-[var(--bg-elevated)] rounded-lg transition-colors border border-[var(--bg-border)]"><ChevronLeft size={20} /></button>
                <button onClick={nextMonth} className="p-2 hover:bg-[var(--bg-elevated)] rounded-lg transition-colors border border-[var(--bg-border)]"><ChevronRight size={20} /></button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 md:gap-4">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} className="text-center text-[10px] font-mono uppercase text-[var(--text-tertiary)] mb-4">{d}</div>
              ))}
              {calendarDays.map((day, idx) => {
                if (!day) return <div key={`empty-${idx}`} className="h-16 md:h-24"></div>;
                
                const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const daySessions = sessionsByDate[dateStr] || [];
                const isToday = new Date().toISOString().split('T')[0] === dateStr;

                return (
                  <div 
                    key={day} 
                    onClick={() => {
                      if (daySessions.length > 0) {
                        setEditingSessionId(daySessions[0].id);
                      } else {
                        // Optional: Start a new session for this date?
                        // For now let's just show it's empty
                      }
                    }}
                    className={`h-16 md:h-24 border border-[var(--bg-border)] rounded-xl p-2 relative cursor-pointer transition-all hover:border-[var(--accent-primary)] hover:bg-[var(--bg-base)] group ${isToday ? 'bg-[var(--accent-dim)]/20 border-[var(--accent-primary)]' : 'bg-[var(--bg-surface)]'}`}
                  >
                    <span className={`text-[10px] font-mono ${isToday ? 'text-[var(--accent-primary)] font-bold' : 'text-[var(--text-tertiary)]'}`}>
                      {day}
                    </span>
                    
                    <div className="mt-1 space-y-1">
                      {daySessions.map(s => (
                        <div 
                          key={s.id}
                          className="flex items-center justify-between text-[8px] md:text-[10px] font-mono uppercase truncate px-1 rounded bg-[var(--accent-primary)] text-white py-0.5 shadow-sm group/tag"
                        >
                          <span className="truncate flex-1">{s.workout_name || 'Workout'}</span>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmDeleteId(s.id);
                            }}
                            className="ml-1 opacity-0 group-hover/tag:opacity-100 hover:text-red-200 transition-opacity"
                          >
                            <Trash2 size={10} />
                          </button>
                        </div>
                      ))}
                      {daySessions.length === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Plus size={16} className="text-[var(--text-tertiary)]" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="mt-6 flex flex-wrap gap-4 justify-center">
            <div className="flex items-center gap-2 text-[10px] font-mono uppercase text-[var(--text-secondary)]">
              <div className="w-3 h-3 bg-[var(--accent-primary)] rounded"></div> Worked Out
            </div>
            <div className="flex items-center gap-2 text-[10px] font-mono uppercase text-[var(--text-secondary)]">
              <div className="w-3 h-3 border border-[var(--accent-primary)] rounded bg-[var(--accent-dim)]/20"></div> Today
            </div>
          </div>
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="text-center py-20 bg-[var(--bg-surface)] rounded-2xl border border-dashed border-[var(--bg-border)] mx-4 md:mx-0">
          <CalendarIcon className="mx-auto text-[var(--text-tertiary)] mb-4 opacity-20" size={64} />
          <p className="text-[var(--text-secondary)] font-mono uppercase tracking-widest text-sm">No sessions found.</p>
          <button 
            onClick={() => setEditingSessionId('new')}
            className="mt-4 iron-button-primary py-2 px-6 uppercase text-xs tracking-widest"
          >
            Log First Session
          </button>
        </div>
      ) : (
        <div className="space-y-4 px-4 md:px-0">
          {filteredSessions.map(s => (
            <div 
              key={s.id}
              className="iron-card flex items-center justify-between p-6 hover:bg-[var(--bg-elevated)] transition-all border-l-4 group"
              style={{ borderLeftColor: s.cardio_logs[0].count > 0 ? 'var(--chart-3)' : 'var(--chart-2)' }}
            >
              <div 
                className="flex items-center gap-6 cursor-pointer flex-1"
                onClick={() => setEditingSessionId(s.id)}
              >
                <div className="bg-[var(--bg-base)] p-4 rounded-xl border border-[var(--bg-border)] text-[var(--accent-primary)] shadow-inner">
                  <CalendarIcon size={24} />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="m-0 text-xl uppercase tracking-wider font-bold">
                      {new Date(s.session_date).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                    </h3>
                    <span className="text-[10px] font-mono text-[var(--accent-primary)] bg-[var(--accent-dim)] px-2 py-0.5 rounded border border-[var(--accent-primary)]/20 uppercase tracking-widest">
                      {s.workout_name || 'Workout'}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-6 gap-y-2 mt-2 text-[11px] font-mono uppercase text-[var(--text-secondary)]">
                    <span className="flex items-center gap-1.5 hover:text-[var(--accent-primary)] transition-colors">
                      <CalendarIcon size={12} className="opacity-50" />
                      {new Date(s.session_date).toLocaleDateString(undefined, { weekday: 'long' })}
                      <Edit2 size={10} className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="text-[var(--text-primary)] font-bold">{s.session_sets[0].count}</span> Exercises
                    </span>
                    {s.cardio_logs[0].count > 0 && (
                      <span className="flex items-center gap-1.5">
                        <span className="text-[var(--info)] font-bold">{s.cardio_logs[0].count}</span> Cardio
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setConfirmDeleteId(s.id);
                  }}
                  className="p-3 text-[var(--text-tertiary)] hover:text-[var(--error)] hover:bg-[var(--error)]/10 rounded-xl transition-all sm:opacity-0 group-hover:opacity-100"
                  title="Delete Workout"
                >
                  <Trash2 size={20} />
                </button>
                <div 
                  className="flex items-center gap-3 text-[var(--text-tertiary)] group-hover:text-[var(--accent-primary)] transition-all group-hover:translate-x-1 cursor-pointer"
                  onClick={() => setEditingSessionId(s.id)}
                >
                  <span className="hidden sm:inline text-[10px] font-mono uppercase tracking-widest">View</span>
                  <ChevronRight size={20} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Add Button for Historical Logging */}
      <div className="fixed bottom-24 right-6 md:bottom-10 md:right-10 z-40 flex flex-col items-end gap-3">
        <button 
          onClick={() => setEditingSessionId('new')}
          className="w-16 h-16 bg-[var(--accent-primary)] text-white rounded-2xl shadow-2xl flex items-center justify-center hover:scale-110 transition-all active:scale-95 group relative overflow-hidden"
          title="Log Past Session"
        >
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
          <Plus size={32} className="relative z-10" />
        </button>
      </div>
    </div>
  );
}
