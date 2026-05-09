import { Trash2 } from 'lucide-react';

export default function CardioBlock({ cardio, onChange, onRemove }) {
  return (
    <div className="iron-card border-l-4 border-l-[var(--chart-3)] p-4 flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <select 
          value={cardio.cardio_type}
          onChange={(e) => onChange('cardio_type', e.target.value)}
          className="bg-[var(--bg-base)] border border-[var(--bg-border)] rounded p-2 text-sm font-bold uppercase tracking-wider text-[var(--text-primary)] focus:outline-none focus:border-[var(--chart-3)]"
        >
          <option value="Run">Run</option>
          <option value="Cycle">Cycle</option>
          <option value="Row">Row</option>
          <option value="Swim">Swim</option>
          <option value="Other">Other</option>
        </select>
        
        <button onClick={onRemove} className="text-[var(--text-secondary)] hover:text-[var(--accent-primary)] p-1">
          <Trash2 size={18} />
        </button>
      </div>
      
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-[10px] text-[var(--text-secondary)] font-mono uppercase mb-1">Mins</label>
          <input 
            type="number" 
            inputMode="decimal"
            value={cardio.duration_mins}
            onChange={(e) => onChange('duration_mins', e.target.value)}
            placeholder="0"
            className="w-full bg-[var(--bg-base)] border border-[var(--bg-border)] rounded p-3 text-center font-mono text-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--chart-3)]"
          />
        </div>
        <div>
          <label className="block text-[10px] text-[var(--text-secondary)] font-mono uppercase mb-1">km</label>
          <input 
            type="number" 
            inputMode="decimal"
            value={cardio.distance_km}
            onChange={(e) => onChange('distance_km', e.target.value)}
            placeholder="0.0"
            className="w-full bg-[var(--bg-base)] border border-[var(--bg-border)] rounded p-3 text-center font-mono text-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--chart-3)]"
          />
        </div>
        <div>
          <label className="block text-[10px] text-[var(--text-secondary)] font-mono uppercase mb-1">Avg HR</label>
          <input 
            type="number" 
            inputMode="numeric"
            value={cardio.avg_hr}
            onChange={(e) => onChange('avg_hr', e.target.value)}
            placeholder="-"
            className="w-full bg-[var(--bg-base)] border border-[var(--bg-border)] rounded p-3 text-center font-mono text-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--chart-3)]"
          />
        </div>
      </div>
    </div>
  );
}
