# Design Document
## IronLog — Workout Tracker
**Version:** 1.0  
**Date:** May 2026

---

## 1. Design Philosophy

**Theme: Industrial Dark**  
The aesthetic draws from gym culture — raw iron, chalk dust, worn rubber floors. No pastel gradients. No rounded friendly cards. This is a tool built for discipline, and it looks like it.

**Core Principles:**
- **Speed over beauty** — logging a set should feel like marking a tally, not filling a form
- **Data density** — charts and numbers should communicate at a glance
- **Restraint with tension** — dark backgrounds, tight typography, sharp accents that only fire on action
- **Zero decorative noise** — every visual element earns its place

---

## 2. Color System

```css
:root {
  /* Backgrounds */
  --bg-base:        #0A0A0A;   /* near-black canvas */
  --bg-surface:     #111111;   /* card / panel surface */
  --bg-elevated:    #1A1A1A;   /* inputs, hover states */
  --bg-border:      #2A2A2A;   /* dividers, borders */

  /* Typography */
  --text-primary:   #F0EDE8;   /* warm off-white — easier on eyes than pure white */
  --text-secondary: #8A8580;   /* muted labels, metadata */
  --text-tertiary:  #4A4845;   /* placeholder text, disabled */

  /* Accent — Red Iron */
  --accent-primary: #E53E3E;   /* PRs, active states, CTAs */
  --accent-hover:   #FC4E4E;   /* hover on accent elements */
  --accent-dim:     #2D1515;   /* accent background wash */

  /* Status */
  --success:        #48BB78;   /* logged, saved, complete */
  --warning:        #ECC94B;   /* RPE high, approaching max */
  --info:           #4299E1;   /* cardio, informational */

  /* Chart Palette */
  --chart-1:        #E53E3E;   /* primary series — red */
  --chart-2:        #4299E1;   /* secondary series — steel blue */
  --chart-3:        #48BB78;   /* tertiary series — green */
  --chart-4:        #ECC94B;   /* quaternary — amber */
  --chart-5:        #9F7AEA;   /* quinary — purple */
}
```

---

## 3. Typography

| Role | Font | Weight | Size |
|------|------|--------|------|
| Display / Page titles | **Barlow Condensed** | 700 | 28–36px |
| Section headings | **Barlow Condensed** | 600 | 18–22px |
| Body / Labels | **IBM Plex Sans** | 400 | 14–15px |
| Numbers / Data | **IBM Plex Mono** | 500 | 13–16px |
| Micro labels | **IBM Plex Sans** | 400 | 11–12px, uppercase, tracked |

**Rules:**
- Numbers (reps, weight, volume) always use IBM Plex Mono — they must feel precise
- All-caps micro-labels use `letter-spacing: 0.1em`
- No italic except for timestamps and placeholder text

---

## 4. Layout System

### Grid
- Base unit: `8px`
- Page max-width: `1100px`, centered
- Mobile breakpoint: `< 768px` (single column)
- Sidebar (desktop): `220px` fixed left nav
- Main content: fluid

### Spacing Scale
```
4px   — tight internal padding (badge, tag)
8px   — component internal padding
16px  — card padding, row gaps
24px  — section padding
32px  — between major sections
48px  — page-level breathing room
```

### Card Style
```css
.card {
  background: var(--bg-surface);
  border: 1px solid var(--bg-border);
  border-radius: 4px; /* intentionally tight — not rounded */
  padding: 16px;
}
```
> No shadows. No glow. Borders only. Industrial, not soft.

---

## 5. Component Specifications

### 5.1 Navigation
- Left sidebar on desktop, bottom tab bar on mobile
- Icons (Lucide) + labels
- Active state: left red border-bar + accent text color
- Items: Today, Schedule, Exercises, Dashboard, Settings

### 5.2 Set Row (Logger)
```
[ Set # ] [ Reps _____ ] [ Weight _____ kg ] [ RPE _____ ] [ × ]
```
- Minimal height: 40px
- Inline editing — no modals
- Tab key moves between fields
- Weight field shows unit based on user preference
- Delete button (×) appears on hover only

### 5.3 Exercise Card (Library)
```
┌─────────────────────────────────┐
│ BENCH PRESS          WEIGHTED   │
│ Chest · Triceps                 │
│                      [Edit] [×] │
└─────────────────────────────────┘
```
- Category tag uses `--accent-dim` background
- Muscle groups in `--text-secondary`

### 5.4 Day Schedule Card (Week View)
```
┌──────────────────────────────┐
│ MON                          │
│ PUSH CALISTHENICS  ██ GREEN  │
│ [Edit]                       │
└──────────────────────────────┘
```
- Color swatch left border (4px) in user-chosen color
- Rest days: dimmed, italic label "Rest Day"

### 5.5 Charts

**Volume Chart (Line)**
- X-axis: weeks
- Y-axis: total volume (kg)
- Single line per exercise, color from chart palette
- Dot on data points, tooltip on hover
- Grid lines: `--bg-border` color, subtle

**PR Tracker (Horizontal Bar or Table)**
- Exercise name + heaviest set + date achieved
- Red accent on latest PR row

**Heatmap**
- GitHub-style grid: 52 columns × 7 rows
- Empty: `--bg-elevated`
- Light activity: `#2D1515`
- Medium: `#7B1D1D`
- High: `#E53E3E`

**Cardio Trends (Area Chart)**
- Filled area, low opacity (0.15)
- Dual axis: duration (left) + distance (right)
- Steel blue color series

**Muscle Group Donut**
- Donut chart, center shows dominant muscle group
- Legend below with percentages

---

## 6. Interaction Patterns

| Action | Feedback |
|--------|----------|
| Save session | Green flash on save button → "Saved" text for 2s |
| New PR detected | Red badge "🔴 NEW PR" appears inline on set row |
| Delete exercise | Confirmation modal (simple — no animation) |
| Empty state | Minimal text + one action button, no illustrations |
| Loading | Single-line skeleton bars, no spinners |
| Error | Red inline text below field, no toast spam |

---

## 7. Mobile Considerations
- Set logger designed mobile-first: large tap targets (min 44px)
- Bottom nav on mobile (Today / Schedule / Dashboard / More)
- Charts scrollable horizontally on small screens
- Weight/reps inputs: `inputmode="numeric"` for numeric keyboard on mobile
- No hover-dependent interactions on critical paths

---

## 8. Screen Map

```
App
├── /auth          — Login / Signup
├── /today         — Today's session logger (default landing)
├── /schedule      — Weekly schedule builder
├── /exercises     — Exercise library + create/edit
├── /dashboard
│   ├── Overview   — Heatmap + weekly volume
│   ├── Strength   — Per-exercise volume + PRs
│   └── Cardio     — Cardio trends
└── /settings      — Units, account info
```

---

## 9. Build Phases

| Phase | Scope | Deliverable |
|-------|-------|-------------|
| **Phase 1** | Auth + Supabase config + schema SQL | Login/signup screen + DB ready |
| **Phase 2** | Schedule builder + Exercise library | Full setup flow working |
| **Phase 3** | Session logger (strength + cardio) | Core daily use working |
| **Phase 4** | Dashboard + all 5 chart types | Full progress visibility |
| **Phase 5** | Polish — PRs auto-detection, unit toggle, mobile | Production-ready |

---

## 10. Accessibility Baseline
- All form inputs have visible labels
- Color is never the sole indicator of state (icons/text always accompany color)
- Focus rings preserved (outline, not removed)
- ARIA labels on icon-only buttons
- Contrast ratio ≥ 4.5:1 for body text on all backgrounds
