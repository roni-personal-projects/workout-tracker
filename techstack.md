# Tech Stack Document
## IronLog — Workout Tracker
**Version:** 1.0  
**Date:** May 2026

---

## 1. Stack Overview

```
Frontend (React SPA)
       ↕
Supabase Client SDK
       ↕
Supabase (Auth + PostgreSQL + RLS)
```

No custom backend. No server. No DevOps.

---

## 2. Frontend

| Concern | Choice | Rationale |
|---------|--------|-----------|
| Framework | **React 18** (JSX) | Component model fits dashboard + forms well |
| Styling | **Tailwind CSS** + custom CSS vars | Utility-first speed + full design token control |
| Charts | **Recharts** | Composable, React-native, no D3 complexity |
| State | **React Hooks** (`useState`, `useEffect`, `useContext`) | Sufficient for SPA without Redux overhead |
| Routing | **Single-page tab navigation** (no React Router) | Simpler for artifact deployment |
| Icons | **Lucide React** | Consistent, lightweight icon set |
| Fonts | **IBM Plex Mono** (data/numbers) + **Barlow Condensed** (headings) | Industrial aesthetic, strong contrast |

---

## 3. Backend — Supabase

| Concern | Choice |
|---------|--------|
| Database | **Supabase PostgreSQL** |
| Auth | **Supabase Auth** (email/password) |
| Security | **Row Level Security (RLS)** on all tables |
| Client | **@supabase/supabase-js** v2 |
| Hosting | Supabase cloud (free tier) |

### Supabase Free Tier Limits (as of 2026)
- 500 MB database storage
- 1 GB file storage
- 50,000 monthly active users
- Unlimited API requests
- **Sufficient for personal use indefinitely**

---

## 4. Database Schema

### Tables

```sql
-- Managed by Supabase Auth
-- auth.users (id, email, created_at)

-- User workout schedule
CREATE TABLE workout_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  day_of_week INT NOT NULL, -- 0=Sun, 1=Mon ... 6=Sat
  workout_name TEXT NOT NULL,
  category TEXT NOT NULL, -- 'strength' | 'calisthenics' | 'cardio' | 'hybrid' | 'rest'
  color TEXT NOT NULL, -- hex color
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Custom exercise library
CREATE TABLE exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  muscle_group TEXT NOT NULL,
  exercise_type TEXT NOT NULL, -- 'weighted' | 'bodyweight' | 'cardio' | 'timed'
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Training sessions (one per day logged)
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_date DATE NOT NULL,
  workout_name TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Individual sets within a session
CREATE TABLE session_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES exercises(id) ON DELETE SET NULL,
  exercise_name TEXT NOT NULL, -- denormalized for safety
  set_number INT NOT NULL,
  reps INT,
  weight NUMERIC(6,2),
  weight_unit TEXT DEFAULT 'kg', -- 'kg' | 'lbs'
  rpe INT, -- 1-10, nullable
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Cardio logs per session
CREATE TABLE cardio_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  cardio_type TEXT NOT NULL, -- 'run' | 'cycle' | 'row' | 'swim' | 'other'
  duration_mins NUMERIC(5,1) NOT NULL,
  distance_km NUMERIC(6,2),
  avg_hr INT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Row Level Security Policies

```sql
-- Enable RLS on all tables
ALTER TABLE workout_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE cardio_logs ENABLE ROW LEVEL SECURITY;

-- Policy pattern (repeat for each table)
CREATE POLICY "Users can only access their own data"
ON workout_days FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

---

## 5. Configuration

All Supabase credentials live in a single config file:

```javascript
// src/config/supabase.js
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'YOUR_SUPABASE_URL'
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
```

> ⚠️ Never commit real keys to a public repo. For production, use environment variables.

---

## 6. Project Structure

```
/src
  /config
    supabase.js          ← Supabase client init
  /components
    /auth
      LoginScreen.jsx
    /schedule
      WeeklySchedule.jsx
      DayEditor.jsx
    /exercises
      ExerciseLibrary.jsx
      ExerciseForm.jsx
    /logger
      SessionLogger.jsx
      SetRow.jsx
      CardioBlock.jsx
    /dashboard
      Dashboard.jsx
      VolumeChart.jsx
      PRTracker.jsx
      HeatmapChart.jsx
      CardioTrends.jsx
      MuscleGroupChart.jsx
    /settings
      Settings.jsx
    /shared
      Nav.jsx
      LoadingSpinner.jsx
      Modal.jsx
  /hooks
    useAuth.js
    useSessions.js
    useExercises.js
  /utils
    unitConversion.js
    dateHelpers.js
  App.jsx
```

---

## 7. Development & Deployment

| Phase | Tool |
|-------|------|
| Dev environment | Claude Artifact (JSX) or local Vite + React |
| Database setup | Supabase dashboard SQL editor |
| Deployment | Vercel / Netlify (static React build) |
| Version control | GitHub |

---

## 8. Key Dependencies

```json
{
  "dependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "@supabase/supabase-js": "^2.0.0",
    "recharts": "^2.x",
    "lucide-react": "^0.383.0"
  }
}
```
