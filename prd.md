# Product Requirements Document (PRD)
## IronLog — Workout Tracker
**Version:** 1.0  
**Date:** May 2026  
**Status:** Draft

---

## 1. Overview

### 1.1 Product Summary
IronLog is a personal workout tracking web application that allows users to plan weekly training schedules, log strength and cardio sessions, create custom exercises, and visualize progress over time through charts and analytics. Data is persisted in Supabase (PostgreSQL) with full authentication and row-level security.

### 1.2 Problem Statement
Generic fitness apps are bloated, require subscriptions, and don't support fully custom workflows. Athletes who follow structured programs (e.g., push/pull/legs, calisthenics, hybrid cardio) need a tracker that matches *their* system — not a pre-packaged one.

### 1.3 Target User
- Solo athletes training 3–6x/week
- Users following custom split programs (Push/Pull/Legs, Upper/Lower, etc.)
- People tracking both strength progression and cardio volume
- Technically comfortable users (can paste a Supabase URL into a config file)

---

## 2. Goals & Success Metrics

| Goal | Metric |
|------|--------|
| Fast daily logging | Session log completed in < 60 seconds |
| Progress visibility | User can view PR history and volume trends in 2 clicks |
| Flexibility | 100% custom exercises and workout labels |
| Data safety | All data per-user via Supabase RLS |
| Cross-device | Works on mobile browser + desktop |

---

## 3. Features & Requirements

### 3.1 Authentication
- **F-AUTH-1:** Email/password signup and login via Supabase Auth
- **F-AUTH-2:** Session persistence (stay logged in across browser sessions)
- **F-AUTH-3:** Logout button accessible from main nav

### 3.2 Weekly Schedule Builder
- **F-SCHED-1:** User can assign a named workout to each day of the week (Mon–Sun)
- **F-SCHED-2:** Workout entries have: name, category (Strength / Calisthenics / Cardio / Hybrid / Rest), color label
- **F-SCHED-3:** Days can be marked as Rest (no logging required)
- **F-SCHED-4:** Schedule persists per user and is editable at any time

### 3.3 Exercise Library
- **F-EX-1:** User can create custom exercises with: name, muscle group, exercise type (Weighted / Bodyweight / Cardio / Timed)
- **F-EX-2:** Exercises are scoped to the authenticated user
- **F-EX-3:** User can edit or delete existing exercises
- **F-EX-4:** Exercise list is searchable and filterable by muscle group

### 3.4 Session Logger
- **F-LOG-1:** Daily log screen auto-loads today's scheduled workout
- **F-LOG-2:** User can add exercises from their library to a session
- **F-LOG-3:** For each exercise: log N sets with reps, weight (kg/lbs), and optional RPE (1–10)
- **F-LOG-4:** Cardio block per session: type (run/cycle/row/etc.), duration (mins), distance (km), optional avg HR
- **F-LOG-5:** Sessions are date-stamped and stored per user
- **F-LOG-6:** Past sessions are viewable and editable

### 3.5 Progress Dashboard & Charts
- **F-CHART-1:** Volume over time per exercise (total volume = sets × reps × weight, plotted weekly)
- **F-CHART-2:** Personal Records (PR) tracker — auto-detects heaviest single set per exercise
- **F-CHART-3:** Weekly training volume heatmap (GitHub-style, showing active days)
- **F-CHART-4:** Cardio trends — distance and duration plotted over time
- **F-CHART-5:** Muscle group frequency pie/donut chart (last 30 days)
- **F-CHART-6:** Total weekly volume bar chart (all sessions combined)

### 3.6 Settings
- **F-SET-1:** Unit preference (kg vs lbs) — applied globally across app
- **F-SET-2:** Account info display (email)
- **F-SET-3:** Supabase config constants (URL + anon key) defined in a single config file

---

## 4. Out of Scope (v1.0)
- Social features / sharing
- Pre-built workout program templates
- Wearable/Apple Health integration
- Push notifications
- AI workout recommendations
- Video exercise guides

---

## 5. User Flows

### Primary Flow: Daily Logging
```
Login → Home (shows today's workout) → Open Session → 
Add Exercises → Log Sets → Add Cardio → Save Session → 
View Summary
```

### Secondary Flow: Track Progress
```
Login → Dashboard → Select Exercise → View Volume Chart + PRs
```

### Setup Flow (First Time)
```
Signup → Schedule Builder → Create Exercises → Ready to Log
```

---

## 6. Constraints & Assumptions
- Single user per account (no teams)
- Browser-based only (no native app)
- Requires user to supply Supabase project credentials
- Supabase free tier sufficient for personal use (~500MB storage, 50k MAU)
- Internet connection required (no offline mode in v1)
