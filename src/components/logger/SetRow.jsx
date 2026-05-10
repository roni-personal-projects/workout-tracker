import { Trash2 } from 'lucide-react';

export default function SetRow({ set, isNewPR, trackingType, onChange, onRemove }) {
  const isTimed = trackingType === 'Timed';
  const isRepsOnly = trackingType === 'Reps Only';

  return (
    <div className={`grid grid-cols-12 gap-1 sm:gap-2 items-center mb-2 px-1 py-1 rounded relative ${isNewPR ? 'bg-[var(--accent-dim)] border border-[var(--accent-primary)]' : ''}`}>
      <div className="col-span-1 sm:col-span-2 text-center sm:text-left font-mono text-xs text-[var(--text-secondary)]">
        {set.set_number}
      </div>
      
      {isTimed ? (
        <div className="col-span-6">
          <div className="relative">
            <input 
              type="number" 
              inputMode="numeric"
              value={set.reps} // Use reps field for seconds
              onChange={(e) => onChange('reps', e.target.value)}
              placeholder="0"
              className="w-full bg-[var(--bg-base)] border border-[var(--bg-border)] rounded p-2 sm:p-3 text-center font-mono text-sm sm:text-base text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] pr-10"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-[var(--text-secondary)] uppercase">Secs</span>
          </div>
        </div>
      ) : isRepsOnly ? (
        <>
          <div className="col-span-3">
            <div className="w-full bg-[var(--bg-elevated)] border border-[var(--bg-border)] rounded p-2 sm:p-3 text-center font-mono text-xs sm:text-sm text-[var(--text-tertiary)] uppercase flex items-center justify-center h-[38px] sm:h-[46px]">
              BW
            </div>
          </div>
          
          <div className="col-span-3">
            <input 
              type="number" 
              inputMode="numeric"
              value={set.reps}
              onChange={(e) => onChange('reps', e.target.value)}
              placeholder="0"
              className="w-full bg-[var(--bg-base)] border border-[var(--bg-border)] rounded p-2 sm:p-3 text-center font-mono text-sm sm:text-base text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
            />
          </div>
        </>
      ) : (
        <>
          <div className="col-span-3">
            <input 
              type="number" 
              inputMode="numeric"
              value={set.weight}
              onChange={(e) => onChange('weight', e.target.value)}
              placeholder="0"
              className="w-full bg-[var(--bg-base)] border border-[var(--bg-border)] rounded p-2 sm:p-3 text-center font-mono text-sm sm:text-base text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
            />
          </div>
          
          <div className="col-span-3">
            <input 
              type="number" 
              inputMode="numeric"
              value={set.reps}
              onChange={(e) => onChange('reps', e.target.value)}
              placeholder="0"
              className="w-full bg-[var(--bg-base)] border border-[var(--bg-border)] rounded p-2 sm:p-3 text-center font-mono text-sm sm:text-base text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
            />
          </div>
        </>
      )}
      
      <div className="col-span-3">
        <input 
          type="number" 
          inputMode="numeric"
          value={set.rpe}
          onChange={(e) => onChange('rpe', e.target.value)}
          placeholder="-"
          className="w-full bg-[var(--bg-base)] border border-[var(--bg-border)] rounded p-2 sm:p-3 text-center font-mono text-sm sm:text-base text-[var(--text-secondary)] focus:outline-none focus:border-[var(--info)]"
        />
      </div>
      
      <div className="col-span-2 sm:col-span-2 flex justify-end">
        <button onClick={onRemove} className="text-[var(--text-secondary)] hover:text-[var(--accent-primary)] p-2">
          <Trash2 size={16} />
        </button>
      </div>
      
      {isNewPR && (
        <div className="absolute -top-2 -right-2 bg-[var(--accent-primary)] text-white text-[8px] font-bold uppercase px-1.5 py-0.5 rounded shadow">
          NEW PR 🔴
        </div>
      )}
    </div>
  );
}
