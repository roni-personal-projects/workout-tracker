import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { Search, Plus, Trash2, Edit2, X, Check } from 'lucide-react';

const MUSCLE_GROUPS = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core', 'Full Body', 'Cardio'];
const EXERCISE_TYPES = ['Weighted', 'Bodyweight', 'Cardio', 'Timed'];

export default function ExerciseLibrary({ session }) {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filtering
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  // Form State
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ 
    name: '', 
    muscle_group: 'Chest', 
    exercise_type: 'Weighted',
    tracking_type: 'Weight & Reps'
  });

  useEffect(() => {
    fetchExercises();
  }, [session]);

  const fetchExercises = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .eq('user_id', session.user.id)
      .order('name');
    
    if (data) setExercises(data);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) return;

    const payload = {
      user_id: session.user.id,
      name: formData.name.trim(),
      muscle_group: formData.muscle_group,
      exercise_type: formData.exercise_type,
      tracking_type: formData.tracking_type
    };

    if (editingId) {
      await supabase.from('exercises').update(payload).eq('id', editingId);
    } else {
      await supabase.from('exercises').insert([payload]);
    }

    setFormData({ 
      name: '', 
      muscle_group: 'Chest', 
      exercise_type: 'Weighted',
      tracking_type: 'Weight & Reps'
    });
    setIsCreating(false);
    setEditingId(null);
    fetchExercises();
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this exercise? Historical logs will retain the name.')) {
      await supabase.from('exercises').delete().eq('id', id);
      fetchExercises();
    }
  };

  const startEdit = (ex) => {
    setEditingId(ex.id);
    setFormData({ 
      name: ex.name, 
      muscle_group: ex.muscle_group, 
      exercise_type: ex.exercise_type,
      tracking_type: ex.tracking_type || 'Weight & Reps'
    });
    setIsCreating(true);
  };

  const cancelEdit = () => {
    setIsCreating(false);
    setEditingId(null);
    setFormData({ 
      name: '', 
      muscle_group: 'Chest', 
      exercise_type: 'Weighted',
      tracking_type: 'Weight & Reps'
    });
  };

  const filtered = exercises.filter(ex => {
    const matchesSearch = ex.name.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = activeFilter === 'All' || ex.muscle_group === activeFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="max-w-4xl mx-auto pb-10">
      <div className="flex justify-between items-end mb-6 border-b border-[var(--bg-border)] pb-2">
        <div>
          <h2 className="text-3xl m-0">Library</h2>
          <p className="text-[var(--text-secondary)] font-mono text-sm mt-1">Manage your custom exercises.</p>
        </div>
        {!isCreating && (
          <button 
            onClick={() => setIsCreating(true)}
            className="iron-button-primary flex items-center gap-2"
          >
            <Plus size={18} />
            <span>New</span>
          </button>
        )}
      </div>

      {isCreating && (
        <div className="iron-card mb-6 border-[var(--accent-primary)]">
          <h3 className="font-bold uppercase tracking-wider mb-4">{editingId ? 'Edit Exercise' : 'New Exercise'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-[10px] text-[var(--text-secondary)] font-mono uppercase mb-1">Name</label>
              <input 
                type="text" 
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                placeholder="e.g. Barbell Bench Press"
                className="w-full bg-[var(--bg-base)] border border-[var(--bg-border)] rounded p-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-[10px] text-[var(--text-secondary)] font-mono uppercase mb-1">Muscle Group</label>
              <select 
                value={formData.muscle_group}
                onChange={e => setFormData({...formData, muscle_group: e.target.value})}
                className="w-full bg-[var(--bg-base)] border border-[var(--bg-border)] rounded p-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
              >
                {MUSCLE_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-[var(--text-secondary)] font-mono uppercase mb-1">Type</label>
              <select 
                value={formData.exercise_type}
                onChange={e => setFormData({...formData, exercise_type: e.target.value})}
                className="w-full bg-[var(--bg-base)] border border-[var(--bg-border)] rounded p-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
              >
                {EXERCISE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-[var(--text-secondary)] font-mono uppercase mb-1">Tracking</label>
              <select 
                value={formData.tracking_type}
                onChange={e => setFormData({...formData, tracking_type: e.target.value})}
                className="w-full bg-[var(--bg-base)] border border-[var(--bg-border)] rounded p-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
              >
                <option value="Weight & Reps">Weight & Reps</option>
                <option value="Timed">Timed</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={cancelEdit} className="iron-button-ghost flex items-center gap-1">
              <X size={16} /> Cancel
            </button>
            <button onClick={handleSave} className="iron-button-primary flex items-center gap-1" disabled={!formData.name.trim()}>
              <Check size={16} /> Save
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 text-[var(--text-secondary)]" size={18} />
          <input 
            type="text" 
            placeholder="Search exercises..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-3 py-2 bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
          />
        </div>
        <div className="flex overflow-x-auto pb-2 md:pb-0 gap-2 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {['All', ...MUSCLE_GROUPS].map(group => (
            <button
              key={group}
              onClick={() => setActiveFilter(group)}
              className={`px-3 py-1 rounded text-xs font-mono uppercase whitespace-nowrap border ${
                activeFilter === group 
                  ? 'bg-[var(--accent-dim)] border-[var(--accent-primary)] text-[var(--accent-primary)]' 
                  : 'bg-transparent border-[var(--bg-border)] text-[var(--text-secondary)] hover:border-[var(--text-secondary)]'
              }`}
            >
              {group}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[var(--accent-primary)]"></div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="iron-card text-center py-12">
          <p className="text-[var(--text-secondary)] font-mono mb-4">No exercises found.</p>
          <button onClick={() => setIsCreating(true)} className="iron-button-ghost">Create One</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map(ex => (
            <div key={ex.id} className="iron-card flex justify-between items-center group">
              <div>
                <div className="font-bold tracking-wide">{ex.name}</div>
                <div className="flex gap-2 mt-2">
                  <span className="text-[10px] font-mono uppercase bg-[var(--bg-elevated)] px-2 py-0.5 rounded text-[var(--text-secondary)]">
                    {ex.muscle_group}
                  </span>
                  <span className="text-[10px] font-mono uppercase bg-[var(--accent-dim)] px-2 py-0.5 rounded text-[var(--accent-primary)]">
                    {ex.exercise_type}
                  </span>
                  <span className="text-[10px] font-mono uppercase bg-[var(--info)]/10 px-2 py-0.5 rounded text-[var(--info)]">
                    {ex.tracking_type || 'Weight & Reps'}
                  </span>
                </div>
              </div>
              <div className="flex gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                <button onClick={() => startEdit(ex)} className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                  <Edit2 size={16} />
                </button>
                <button onClick={() => handleDelete(ex.id)} className="p-2 text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
