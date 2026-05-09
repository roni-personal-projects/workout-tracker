import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { Search, X } from 'lucide-react';

export default function ExerciseSelector({ session, onSelect, onClose }) {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchExercises();
  }, []);

  const fetchExercises = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('exercises')
      .select('*')
      .eq('user_id', session.user.id)
      .order('name');
    
    if (data) setExercises(data);
    setLoading(false);
  };

  const filtered = exercises.filter(ex => 
    ex.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4">
      <div className="bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-lg w-full max-w-md max-h-[80vh] flex flex-col">
        <div className="p-4 border-b border-[var(--bg-border)] flex justify-between items-center">
          <h3 className="font-bold text-xl uppercase m-0">Add Exercise</h3>
          <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-white">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4 border-b border-[var(--bg-border)]">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-[var(--text-secondary)]" size={18} />
            <input 
              type="text" 
              placeholder="Search exercises..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-3 py-2.5 bg-[var(--bg-base)] border border-[var(--bg-border)] rounded text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
              autoFocus
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2">
          {loading ? (
            <div className="text-center py-8 text-[var(--text-secondary)] font-mono text-sm animate-pulse">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 text-[var(--text-secondary)] font-mono text-sm">No exercises found.</div>
          ) : (
            <div className="space-y-1">
              {filtered.map(ex => (
                <button
                  key={ex.id}
                  onClick={() => onSelect(ex)}
                  className="w-full text-left p-3 hover:bg-[var(--bg-elevated)] rounded flex justify-between items-center transition-colors"
                >
                  <span className="font-bold">{ex.name}</span>
                  <span className="text-[10px] font-mono uppercase text-[var(--text-secondary)]">{ex.muscle_group}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
