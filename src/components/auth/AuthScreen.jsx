import { useState } from 'react';
import { supabase } from '../../supabaseClient';
import { Dumbbell } from 'lucide-react';

export default function AuthScreen({ onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const cleanEmail = email.trim();
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
        });
        if (error) throw error;
      }
      if (onAuthSuccess) onAuthSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="iron-card w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <Dumbbell className="w-12 h-12 text-[var(--accent-primary)] mb-4" />
          <h1 className="text-4xl text-center m-0">IronLog</h1>
          <p className="text-[var(--text-secondary)] mt-2 font-mono text-sm uppercase tracking-widest">Discipline. Data. Progress.</p>
        </div>

        {error && (
          <div className="bg-[var(--accent-dim)] border border-[var(--accent-primary)] text-[var(--accent-hover)] p-3 rounded mb-4 text-sm font-mono">
            {error}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-1 font-mono uppercase">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[var(--bg-base)] border border-[var(--bg-border)] rounded p-3 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] transition-colors"
              placeholder="athlete@example.com"
            />
          </div>
          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-1 font-mono uppercase">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[var(--bg-base)] border border-[var(--bg-border)] rounded p-3 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] transition-colors"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full iron-button-primary mt-6 py-3 text-lg tracking-wider uppercase font-bold"
          >
            {loading ? 'Processing...' : (isLogin ? 'Enter' : 'Commit')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-sm transition-colors"
          >
            {isLogin ? "Need an account? Sign up" : "Already registered? Log in"}
          </button>
        </div>
      </div>
    </div>
  );
}
