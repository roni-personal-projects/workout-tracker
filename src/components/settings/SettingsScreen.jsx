import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { LogOut, User, Scale } from 'lucide-react';

export default function SettingsScreen({ session }) {
  const [unit, setUnit] = useState(localStorage.getItem('ironlog_unit') || 'kg');

  const handleUnitChange = (newUnit) => {
    setUnit(newUnit);
    localStorage.setItem('ironlog_unit', newUnit);
    // Reload to apply globally across all components reading from localStorage
    window.location.reload(); 
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="max-w-2xl mx-auto pb-10">
      <div className="mb-6 border-b border-[var(--bg-border)] pb-2">
        <h2 className="text-3xl m-0">Settings</h2>
        <p className="text-[var(--text-secondary)] font-mono text-sm mt-1">Configure your app preferences.</p>
      </div>

      <div className="space-y-6">
        <div className="iron-card">
          <h3 className="font-bold uppercase tracking-wider mb-4 text-[var(--text-secondary)] flex items-center gap-2">
            <User size={18} /> Account
          </h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-mono uppercase text-[var(--text-secondary)]">Logged in as</p>
              <p className="font-bold">{session.user.email}</p>
            </div>
            <button 
              onClick={handleSignOut}
              className="iron-button-ghost flex items-center gap-2 text-sm uppercase tracking-wider"
            >
              <LogOut size={16} /> Sign Out
            </button>
          </div>
        </div>

        <div className="iron-card">
          <h3 className="font-bold uppercase tracking-wider mb-4 text-[var(--text-secondary)] flex items-center gap-2">
            <Scale size={18} /> Preferences
          </h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold">Weight Unit</p>
              <p className="text-xs text-[var(--text-secondary)] font-mono mt-1">
                Choose between kilograms and pounds.
              </p>
            </div>
            <div className="flex bg-[var(--bg-elevated)] p-1 rounded">
              <button 
                onClick={() => handleUnitChange('kg')}
                className={`px-4 py-2 text-xs font-mono uppercase rounded font-bold ${unit === 'kg' ? 'bg-[var(--accent-primary)] text-white' : 'text-[var(--text-secondary)]'}`}
              >
                KG
              </button>
              <button 
                onClick={() => handleUnitChange('lbs')}
                className={`px-4 py-2 text-xs font-mono uppercase rounded font-bold ${unit === 'lbs' ? 'bg-[var(--accent-primary)] text-white' : 'text-[var(--text-secondary)]'}`}
              >
                LBS
              </button>
            </div>
          </div>
          <p className="text-[10px] text-[var(--warning)] font-mono mt-4 italic">
            Note: Changing units will not convert your past entries. Ensure you log consistently.
          </p>
        </div>
      </div>
    </div>
  );
}
