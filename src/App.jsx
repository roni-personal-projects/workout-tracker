import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import AuthScreen from './components/auth/AuthScreen';
import AppShell from './components/shared/AppShell';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/auth/ProtectedRoute';

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const isMissingConfig = 
    !import.meta.env.VITE_SUPABASE_URL || 
    import.meta.env.VITE_SUPABASE_URL === 'YOUR_SUPABASE_URL' ||
    !import.meta.env.VITE_SUPABASE_ANON_KEY || 
    import.meta.env.VITE_SUPABASE_ANON_KEY === 'YOUR_SUPABASE_ANON_KEY';

  useEffect(() => {
    if (isMissingConfig) {
      setLoading(false);
      return;
    }
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription?.unsubscribe();
  }, [isMissingConfig]);

  if (isMissingConfig) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 text-center">
        <div className="iron-card border-l-4 border-l-[var(--accent-primary)] max-w-md">
          <h2 className="text-2xl font-bold uppercase tracking-widest text-[var(--accent-primary)] mb-4">Configuration Missing</h2>
          <p className="text-[var(--text-secondary)] mb-4">
            It looks like you haven't added your Supabase credentials yet. The app cannot run without them.
          </p>
          <div className="text-left bg-[var(--bg-elevated)] p-4 rounded font-mono text-xs text-[var(--text-primary)]">
            <p>1. Open the <span className="text-[var(--info)]">.env</span> file in your project root.</p>
            <p className="mt-2">2. Replace the placeholder values with your actual Supabase project URL and Anon Key.</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--accent-primary)]"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route 
        path="/login" 
        element={!session ? <AuthScreen /> : <Navigate to="/" replace />} 
      />
      <Route 
        path="/*" 
        element={
          <ProtectedRoute session={session}>
            <AppShell session={session} />
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
}

export default App;
