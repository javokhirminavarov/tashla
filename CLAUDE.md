# CLAUDE.md — TASHLA Project

## Project Overview

TASHLA ("Quit" in Uzbek) is a Telegram Mini App that helps Uzbek users track and quit three habits: sigaret (cigarettes), nos (nasvay), and alkogol (alcohol). The app consists of three parts:

1. **bot/** — Telegram bot (grammy). `/start` command, opens Mini App, sends push notifications.
2. **api/** — Express REST API. Auth, logging, stats, health milestones, quit plans, community groups, cron jobs.
3. **webapp/** — React Mini App (Vite + Tailwind). Opens inside Telegram. All user-facing UI lives here.

---

## Tech Stack

- **Language:** TypeScript everywhere (strict mode)
- **Bot:** grammy (not node-telegram-bot-api)
- **API:** Express + raw SQL (no ORM). Dual-driver DB layer: `better-sqlite3` for local dev, `pg` for production
- **Database:** SQLite locally (`tashla.db`), PostgreSQL on Railway for production
- **Webapp:** React 18 + Vite + Tailwind CSS + Recharts
- **i18n:** i18next + react-i18next (uz/ru locales)
- **Scheduling:** node-cron (notifications, quit plan transitions)
- **Icons:** Material Symbols Outlined (Google Fonts)
- **Typography:** Lexend (Google Fonts) — not system font stack
- **Auth:** Telegram WebApp initData HMAC validation

---

## Project Structure

```
tashla/
├── CLAUDE.md              # This file
│
├── bot/
│   ├── package.json
│   ├── tsconfig.json
│   ├── src/
│   │   └── index.ts       # Bot entry: /start command + webapp menu button
│   └── .env.example       # BOT_TOKEN, WEBAPP_URL
│
├── api/
│   ├── package.json
│   ├── tsconfig.json
│   ├── src/
│   │   ├── index.ts       # Express app entry, cors, json parsing
│   │   ├── db.ts          # Dual-driver DB abstraction (SQLite dev / PostgreSQL prod)
│   │   ├── auth.ts        # Telegram initData validation middleware
│   │   ├── migrate.ts     # Migration runner
│   │   ├── cron.ts        # Node-cron jobs: notifications + quit plan step transitions
│   │   ├── routes/
│   │   │   ├── auth.ts    # POST /api/auth — validate + upsert user
│   │   │   ├── profiles.ts # GET/POST/DELETE habit profiles
│   │   │   ├── logs.ts    # POST log, DELETE last, GET today, GET daily
│   │   │   ├── health.ts  # GET milestones with unlock status
│   │   │   ├── stats.ts   # GET money saved + streak
│   │   │   ├── groups.ts  # Community groups CRUD + member ops
│   │   │   └── quit-plan.ts # Quit plan CRUD + step transitions
│   │   └── migrations/
│   │       ├── 001_tables.sql     # Core tables (users, habit_profiles, usage_logs, health_milestones)
│   │       └── 002_seed.sql       # Health milestones data (22 rows)
│   └── .env.example       # DATABASE_URL, BOT_TOKEN
│
├── webapp/
│   ├── package.json
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── index.html
│   ├── src/
│   │   ├── main.tsx        # React entry
│   │   ├── App.tsx         # Router: /, /stats, /health, /community, /profile, /group/:id
│   │   ├── lib/
│   │   │   ├── api.ts      # Fetch wrapper — all API calls
│   │   │   ├── colors.ts   # Zone-based color utility (green/amber/red interpolation)
│   │   │   ├── telegram.ts # Telegram WebApp SDK helpers + dev mock
│   │   │   └── types.ts    # TypeScript interfaces + constant maps
│   │   ├── i18n/
│   │   │   ├── index.ts    # i18next setup (auto-detect from Telegram)
│   │   │   └── locales/
│   │   │       ├── uz.json # Uzbek strings
│   │   │       └── ru.json # Russian strings
│   │   ├── pages/
│   │   │   ├── Onboarding.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Stats.tsx
│   │   │   ├── Health.tsx
│   │   │   ├── Profile.tsx
│   │   │   ├── Community.tsx    # Groups list
│   │   │   └── GroupDetail.tsx  # Group view + member progress
│   │   ├── components/
│   │   │   ├── HabitCard.tsx      # Habit selector pill on dashboard
│   │   │   ├── ProgressBar.tsx    # Horizontal progress indicator
│   │   │   ├── CircularProgress.tsx # SVG circular progress ring (hero element)
│   │   │   ├── BottomSheet.tsx    # Slide-up modal for multi-habit logging
│   │   │   ├── WeeklyChart.tsx    # Recharts composite line/area chart
│   │   │   ├── HealthTimeline.tsx # Vertical milestone timeline (3 states)
│   │   │   ├── MoneySaved.tsx     # Savings display card
│   │   │   ├── Navigation.tsx     # Bottom tab bar (4 items)
│   │   │   ├── Layout.tsx         # Page wrapper with nav
│   │   │   ├── QuitPlanSheet.tsx  # Quit plan display sheet
│   │   │   ├── CreateGroupSheet.tsx # Group creation modal
│   │   │   └── JoinGroupSheet.tsx   # Group join modal
│   │   └── hooks/
│   │       ├── useAuth.ts         # Auth + user state
│   │       ├── useLogs.ts         # Logging actions + today's data
│   │       └── useProfiles.ts     # Habit profiles
│   └── .env.example        # VITE_API_URL
│
└── shared/                 # Shared constants (copy, not linked)
    └── milestones.ts       # Health milestone data
```

---

## Critical Conventions

### TypeScript
- Use `strict: true` in all tsconfig.json files
- No `any` types — define interfaces for everything
- Use interfaces, not type aliases, for object shapes

### Database
- Dual-driver: `better-sqlite3` for local dev (DATABASE_URL starts with `sqlite:`), `pg` Pool for production
- Use parameterized queries (`$1, $2` for pg — db.ts auto-converts to `?` for SQLite)
- db.ts handles SQL dialect differences: `NOW()` → `datetime('now')`, strips `::type` casts, etc.
- NEVER use string concatenation for SQL
- NEVER use an ORM (no Prisma, no Drizzle, no Sequelize)
- Pool connection from `DATABASE_URL` environment variable
- All timestamps in UTC (TIMESTAMPTZ in pg, `datetime('now')` in SQLite)
- SQLite uses WAL mode + foreign keys enabled

### API
- All routes return JSON: `{ data: ... }` on success, `{ error: "message" }` on failure
- HTTP status codes: 200 OK, 201 Created, 400 Bad Request, 401 Unauthorized, 500 Server Error
- Auth middleware extracts `telegram_id` from validated initData and attaches `req.user`
- CORS: allow the webapp origin only

### Telegram Auth
The Mini App sends `window.Telegram.WebApp.initData` as a header (`X-Telegram-Init-Data`).
The API validates it using HMAC-SHA256:
```
secret_key = HMAC-SHA256("WebAppData", BOT_TOKEN)
hash = HMAC-SHA256(secret_key, data_check_string)
compare hash with the hash in initData
```
data_check_string is all initData params (except hash) sorted alphabetically, joined with `\n`.

### Webapp
- Use React Router v6 with `HashRouter` (required for Telegram WebView compatibility)
- Tailwind only — no custom CSS files, no CSS modules (minimal exceptions in index.css for scrollbar/timeline utilities)
- Mobile-first design — max-width 100vw, no horizontal scroll
- Use Telegram theme colors via CSS variables: `var(--tg-theme-bg-color)`, `var(--tg-theme-text-color)`, etc.
- Call `window.Telegram.WebApp.ready()` on app mount
- Call `window.Telegram.WebApp.expand()` to use full screen
- Haptic feedback on tap: `window.Telegram.WebApp.HapticFeedback.impactOccurred('light')`
- Telegram BackButton integration on sub-pages (e.g., Profile)
- Material Symbols Outlined for all icons; filled variant via `.material-symbols-filled` CSS class
- Lexend font (Google Fonts) — loaded in index.html

### Language & i18n
- Two languages supported: Uzbek (uz) and Russian (ru)
- i18next + react-i18next for translation; locale files at `webapp/src/i18n/locales/{uz,ru}.json`
- Auto-detects language from Telegram user settings; manual selector in Profile page
- Use standard Uzbek Latin: o', g', sh, ch (with apostrophes for o' and g')
- Common terms:
  - Sigaret = Cigarette
  - Nos / Nasvay = Nasvay (smokeless tobacco)
  - Alkogol = Alcohol (spirits)
  - Qayd etish = Log / Record
  - Tashlash = Quit
  - Salomatlik = Health
  - Statistika = Statistics
  - Bugun = Today
  - Hafta = Week
  - Oy = Month
  - So'm = Uzbek sum (currency)
  - Dona = Pieces (unit)

---

## Database Schema

9 tables. Core schema in `api/src/migrations/001_tables.sql`. Post-MVP additions via subsequent migrations.

**Core tables:**
- **users** — telegram_id, first_name, username, language ('uz'|'ru'), notifications_enabled, notification_time, timezone, weekly_summary, created_at
- **habit_profiles** — user_id, habit_type ('sigaret'|'nos'|'alkogol'), daily_baseline, daily_limit, cost_per_unit (UZS), target_quit_date, is_active
- **usage_logs** — user_id, habit_type, quantity (default 1), logged_at
- **health_milestones** — habit_type, hours_after, title_uz, description_uz, title_ru, description_ru, icon (seeded, read-only)

**Post-MVP tables:**
- **quit_plans** — user_id, habit_type, speed ('slow'|'medium'|'fast'), created_at
- **quit_plan_steps** — plan_id, step_number, step_name, daily_limit, start_date, end_date, status
- **groups** — invite_code, name, created_by, created_at
- **group_members** — group_id, user_id, hide_alkogol, joined_at

**Migrations:** 001_tables.sql → 002_seed.sql → 003_i18n.sql → 004_notifications.sql → 005_quit_plans.sql → 006_community.sql

Key constraint: UNIQUE(user_id, habit_type) on habit_profiles.
Key index: (user_id, habit_type, logged_at DESC) on usage_logs.

---

## API Endpoints Reference

```
POST   /api/auth              Body: { initData: string }
                               → Validate, upsert user, return { data: { user, profiles } }

GET    /api/profiles           → { data: HabitProfile[] }
POST   /api/profiles           Body: { habit_type, daily_baseline, daily_limit?, cost_per_unit? }
                               → Upsert profile, return { data: HabitProfile }
DELETE /api/profiles/:habitType → Soft delete (is_active=false)

POST   /api/logs               Body: { habit_type, quantity?: number }
                               → Insert log, return { data: { today_count } }
DELETE /api/logs/last           Body: { habit_type }
                               → Delete most recent log for this habit today
GET    /api/logs/today         → { data: { sigaret: 8, nos: 3, alkogol: 0 } }
GET    /api/logs/daily?days=7  → { data: [ { date, sigaret: 12, nos: 5, alkogol: 1 }, ... ] }

GET    /api/health/:habitType  → { data: { last_log_at, hours_since, milestones: [...] } }

GET    /api/stats/money        → { data: { today: {...}, total: {...} } }
GET    /api/stats/streak       → { data: { sigaret: 3, nos: 7, alkogol: 0 } }  (consecutive zero-use days)

POST   /api/quit-plan          Body: { habit_type, speed }  → Create adaptive quit plan
GET    /api/quit-plan/:habitType → Get plan with steps
PUT    /api/quit-plan/:habitType → Update plan
DELETE /api/quit-plan/:habitType → Delete plan

POST   /api/groups             Body: { name }  → Create group with invite code
GET    /api/groups             → List user's groups
POST   /api/groups/join        Body: { invite_code }  → Join group
GET    /api/groups/:groupId    → Group details + member progress
DELETE /api/groups/:groupId    → Leave/delete group
PUT    /api/groups/:groupId/privacy  Body: { hide_alkogol }  → Toggle privacy

GET    /api/ping               → { status: "ok" }  (health check, no auth)
```

Money calculation:
- today_saved = (daily_baseline - today_count) × cost_per_unit (if positive)
- total_saved = sum over all days of max(0, daily_baseline - day_count) × cost_per_unit

---

## Health Milestones Data

Seeded into health_milestones table (22 rows: 9 sigaret + 6 nos + 7 alkogol). Bilingual titles/descriptions (uz + ru).

Unlock logic: a milestone is unlocked if the time since the user's last usage_log for that habit_type >= hours_after. If no logs exist and profile was created > hours_after ago, also unlocked.

---

## Development Order

### Steps 1–7: COMPLETED
All core MVP features built: project setup, database, API (all endpoints), bot, webapp shell, all pages.

### Post-MVP Features: COMPLETED
- i18n (uz/ru) with i18next
- Streak counter (API + Dashboard display)
- Bot push notifications (4 types, node-cron scheduling, settings UI)
- Adaptive quit plans (3 speed presets, step progression, cron transitions)
- Community/friends (groups, invite codes, member progress, privacy)

### Step 8: Deploy (REMAINING)
- API → Railway with PostgreSQL
- Bot → Railway
- Webapp → Railway (or Vercel/Netlify for static hosting)
- Set Mini App URL in BotFather
- End-to-end testing in real Telegram client

---

## Common Patterns

### API route pattern
```typescript
router.get('/today', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT habit_type, COALESCE(SUM(quantity), 0)::int as count
       FROM usage_logs
       WHERE user_id = $1 AND logged_at::date = CURRENT_DATE
       GROUP BY habit_type`,
      [req.user.id]
    );
    const counts: Record<string, number> = {};
    for (const row of result.rows) {
      counts[row.habit_type] = row.count;
    }
    res.json({ data: counts });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});
```

### Webapp API call pattern
```typescript
const API_URL = import.meta.env.VITE_API_URL;

async function apiCall<T>(path: string, options?: RequestInit): Promise<T> {
  const initData = window.Telegram.WebApp.initData;
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Telegram-Init-Data': initData,
      ...options?.headers,
    },
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const json = await res.json();
  return json.data;
}
```

### Telegram WebApp init pattern
```typescript
import { useEffect } from 'react';
import { tg } from './lib/telegram';

function App() {
  useEffect(() => {
    tg.ready();
    tg.expand();
    tg.setHeaderColor('#1a2c22');
    tg.setBackgroundColor('#122017');
  }, []);
  // ...
}
```

---

## Environment Variables

### bot/.env
```
BOT_TOKEN=your_bot_token_from_botfather
WEBAPP_URL=https://tashla-webapp.up.railway.app
```

### api/.env
```
DATABASE_URL=sqlite:tashla.db          # Local dev (SQLite)
# DATABASE_URL=postgresql://user:pass@host:5432/tashla  # Production (PostgreSQL)
BOT_TOKEN=your_bot_token_from_botfather
PORT=3000
WEBAPP_URL=http://localhost:5173
DEV_MODE=true                          # Skips Telegram initData validation
DEV_TELEGRAM_ID=123456789              # Fake user ID for dev mode
```

### webapp/.env
```
VITE_API_URL=http://localhost:3000                 # Local dev
# VITE_API_URL=https://tashla-api.up.railway.app   # Production
```

---

## Design System (COMPLETE REFERENCE)

This is not a suggestion list — it is the **single source of truth** for every visual decision. Claude Code MUST consult this section before writing or modifying any UI code. The goal: every screen should feel like a **premium health app designed by a top-tier studio**, not an AI-generated prototype.

### Brand Identity & Mood

TASHLA is a **digital sanctuary** — calm, confident, and empowering. Think: a luxurious dark wellness app that makes quitting feel like a rewarding journey, not punishment. Visual references: Apple Health dark mode, Headspace's warmth, Oura Ring's sophistication.

**Design Tone Keywords:** Organic · Nocturnal · Supportive · Premium · Alive (not sterile)

---

### Color Palette (EXACT VALUES — use tailwind.config.js tokens)

**Background layers (darkest → lightest):**
```
--deep:     #0d1a12    ← page-level background, absolute depth
--base:     #122017    ← default page bg (var(--tg-theme-bg-color) fallback)
--card:     #1a2c22    ← card surfaces, elevated panels
--surface:  #23352b    ← input fields, secondary surfaces, inset areas
--raised:   #2d4436    ← hover states on cards, tertiary surfaces
```

**Brand accent:**
```
--brand:        #1fc762    ← primary CTA, progress, active indicators
--brand-light:  #34d876    ← hover/highlight state of brand
--brand-dark:   #17a34a    ← pressed state, gradient end
--brand-glow:   rgba(31, 199, 98, 0.25)  ← box-shadow glow on hero elements
--brand-subtle: rgba(31, 199, 98, 0.08)  ← faint brand-tinted backgrounds
```

**Habit-specific accents (ONLY for habit-associated elements):**
```
sigaret:  #F97316  (orange-500)  — glow: rgba(249,115,22,0.20)
nos:      #8B5CF6  (violet-500)  — glow: rgba(139,92,246,0.20)
alkogol:  #3B82F6  (blue-500)    — glow: rgba(59,130,246,0.20)
```

**Text colors:**
```
--text-primary:   #F1F5F2    ← headings, hero numbers, important text
--text-secondary: #94A3A1    ← body text, descriptions, supporting info
--text-tertiary:  #5C716A    ← timestamps, metadata, disabled text
--text-on-brand:  #0d1a12    ← text on brand-colored buttons
```

**Semantic:**
```
success: #1fc762  (same as brand)
warning: #FBBF24  (amber-400)
error:   #EF4444  (red-500)
```

**RULES:**
- NEVER use pure `#000000` or `#ffffff` — always green-tinted
- NEVER use `text-white` — use `text-[#F1F5F2]` or `text-[#94A3A1]`
- NEVER use `bg-gray-*` — use the custom palette above
- White overlays: `bg-white/5`, `bg-white/8`, `bg-white/10` (never above /15)
- Brand overlays: `bg-[#1fc762]/5`, `bg-[#1fc762]/8`, `bg-[#1fc762]/10`

---

### Typography System

**Font:** Lexend (Google Fonts) — ONLY font. No fallback to system fonts in rendered UI.

**Scale (use these exact combinations):**

| Role | Size | Weight | Tracking | Color | Example |
|------|------|--------|----------|-------|---------|
| Hero stat | text-5xl / text-4xl | font-light (300) | tracking-tight | text-primary | "0 / 15" on dashboard |
| Page title | text-2xl | font-semibold (600) | tracking-tight | text-primary | "Statistika" |
| Section heading | text-lg | font-semibold (600) | normal | text-primary | "Haftalik trend" |
| Card title | text-base | font-medium (500) | normal | text-primary | "Bugungi tejamkor" |
| Body | text-sm | font-normal (400) | normal | text-secondary | descriptions, explanations |
| Caption | text-xs | font-medium (500) | tracking-wide uppercase | text-tertiary | "SO'M", "DONA", timestamps |
| Button label | text-sm | font-semibold (600) | tracking-wide | depends on variant | "Qayd etish" |
| Nav label | text-[11px] | font-medium (500) | normal | text-tertiary / text-brand | tab labels |

**RULES:**
- Hero numbers MUST be `font-light` (300) — this creates the premium feel. Heavy numbers = amateur.
- Captions and unit labels: ALWAYS uppercase + `tracking-wide` + `text-xs` + `text-tertiary`
- Section headings: ALWAYS have `mb-3` or `mb-4` below them
- Never use `font-bold` (700) for body text — reserve for hero stats only if font-light doesn't fit

---

### Spacing & Layout System

**Page-level:**
```
Page background:     bg-[#122017] min-h-screen
Page padding:        px-5 pt-4 pb-28 (pb-28 accounts for bottom nav + safe area)
Content max-width:   max-w-md mx-auto (optional, for ultra-wide screens)
Section gap:         space-y-6 between major sections
```

**Card-level:**
```
Card container:      bg-[#1a2c22] rounded-2xl p-5 border border-white/[0.06]
Card with glow:      + shadow-[0_0_30px_rgba(31,199,98,0.12)]
Card inner gap:      space-y-3 or space-y-4 between card's child elements
Card tight:          p-4 (for smaller cards like stat boxes)
Card hero:           p-6 (for primary dashboard card, hero sections)
```

**Component spacing rhythm (STICK TO THESE):**
```
Between sections:    space-y-6 or gap-6
Between cards:       space-y-4 or gap-4
Between card items:  space-y-3 or gap-3
Between label+value: space-y-1 (tight coupling)
Inline spacing:      gap-2 or gap-3
Icon + text:         gap-2
```

**Touch targets:**
```
Primary CTA button:  min-h-[56px] rounded-2xl
Secondary button:    min-h-[48px] rounded-xl
Tap area (icon btn): min-w-[44px] min-h-[44px]
Pill / chip:         min-h-[40px] px-4 rounded-full
Bottom nav item:     flex-1 py-2 (full-width tap)
```

**RULES:**
- NEVER use `p-2` on a card — minimum is `p-4`, prefer `p-5`
- NEVER mix `p-3` and `p-5` on sibling cards — keep them uniform
- Horizontal padding `px-5` is the page standard (not px-4) — this gives breathing room
- Bottom padding MUST account for bottom nav: `pb-28` minimum

---

### Component Patterns (COPY-PASTE READY)

#### Primary CTA Button
```jsx
<button className="
  w-full min-h-[56px] rounded-2xl
  bg-[#1fc762] text-[#0d1a12]
  font-semibold text-sm tracking-wide
  active:scale-[0.97] active:bg-[#17a34a]
  transition-all duration-150 ease-out
  shadow-[0_0_20px_rgba(31,199,98,0.3)]
">
  + Qayd etish
</button>
```

#### Card Container (standard)
```jsx
<div className="
  bg-[#1a2c22] rounded-2xl p-5
  border border-white/[0.06]
">
  {/* content */}
</div>
```

#### Card Container (hero / glowing)
```jsx
<div className="
  bg-gradient-to-br from-[#1a2c22] to-[#1a2c22]/80
  rounded-2xl p-6
  border border-[#1fc762]/[0.12]
  shadow-[0_0_40px_rgba(31,199,98,0.1)]
">
  {/* hero content */}
</div>
```

#### Card Container (habit-colored)
```jsx
{/* Example for sigaret (orange) */}
<div className="
  bg-[#1a2c22] rounded-2xl p-5
  border border-[#F97316]/[0.15]
  shadow-[0_0_20px_rgba(249,115,22,0.08)]
">
  {/* habit-specific content */}
</div>
```

#### Stat Value Display (hero number + label)
```jsx
<div className="text-center">
  <span className="text-5xl font-light tracking-tight text-[#F1F5F2]">
    12,500
  </span>
  <span className="block text-xs font-medium tracking-wide uppercase text-[#5C716A] mt-1">
    so'm tejalgan
  </span>
</div>
```

#### Section Header
```jsx
<div className="flex items-center justify-between mb-4">
  <h2 className="text-lg font-semibold text-[#F1F5F2]">Haftalik trend</h2>
  <span className="text-xs font-medium text-[#5C716A]">7 kun</span>
</div>
```

#### Pill / Chip (e.g., habit selector)
```jsx
{/* Active state */}
<button className="
  min-h-[40px] px-4 rounded-full
  bg-[#F97316]/15 text-[#F97316]
  border border-[#F97316]/25
  text-sm font-medium
  transition-all duration-150
">
  🚬 Sigaret
</button>

{/* Inactive state */}
<button className="
  min-h-[40px] px-4 rounded-full
  bg-white/5 text-[#94A3A1]
  border border-white/[0.06]
  text-sm font-medium
  transition-all duration-150
">
  🍺 Alkogol
</button>
```

#### Bottom Navigation
```jsx
<nav className="
  fixed bottom-0 left-0 right-0
  bg-[#0d1a12]/90 backdrop-blur-xl
  border-t border-white/[0.06]
  px-2 pb-[env(safe-area-inset-bottom)]
">
  <div className="flex items-center justify-around py-2">
    {/* Active tab */}
    <button className="flex flex-col items-center gap-0.5 py-1 px-4 min-w-[64px]">
      <span className="material-symbols-filled text-[22px] text-[#1fc762]">home</span>
      <span className="text-[11px] font-medium text-[#1fc762]">Asosiy</span>
    </button>
    {/* Inactive tab */}
    <button className="flex flex-col items-center gap-0.5 py-1 px-4 min-w-[64px]">
      <span className="material-symbols-outlined text-[22px] text-[#5C716A]">bar_chart</span>
      <span className="text-[11px] font-medium text-[#5C716A]">Statistika</span>
    </button>
  </div>
</nav>
```

#### Empty State
```jsx
<div className="flex flex-col items-center justify-center py-16 text-center">
  <div className="
    w-16 h-16 rounded-full mb-4
    bg-white/5 flex items-center justify-center
  ">
    <span className="material-symbols-outlined text-[28px] text-[#5C716A]">
      smoke_free
    </span>
  </div>
  <p className="text-sm text-[#94A3A1] mb-1">Hali qayd yo'q</p>
  <p className="text-xs text-[#5C716A]">Birinchi qaydingizni qo'shing</p>
</div>
```

#### Skeleton Loading (shimmer)
```jsx
<div className="animate-pulse">
  <div className="h-4 bg-white/5 rounded-lg w-3/4 mb-3" />
  <div className="h-10 bg-white/5 rounded-xl w-1/2 mb-2" />
  <div className="h-3 bg-white/5 rounded-lg w-2/3" />
</div>
```

---

### Motion & Animation System

**Page entrance (staggered reveal):**
```css
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}

.animate-fade-in-up {
  animation: fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
}
```
Apply with stagger: first child `delay-[0ms]`, second `delay-[80ms]`, third `delay-[160ms]`, etc.
Max 5 staggered items. Beyond that, animate as a group.

**Tap feedback (EVERY interactive element):**
```
active:scale-[0.97] transition-transform duration-100 ease-out
```
Plus haptic: `window.Telegram.WebApp.HapticFeedback.impactOccurred('light')`

**Value transitions (numbers, progress bars):**
```
transition-all duration-500 ease-out
```
For SVG progress rings: animate `stroke-dashoffset` with CSS transition.

**Bottom sheet:**
```css
@keyframes slideUp {
  from { transform: translateY(100%); }
  to   { transform: translateY(0); }
}
.animate-slide-up {
  animation: slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) both;
}
```
Backdrop: `bg-black/50 backdrop-blur-sm` with `animate-fade-in` (opacity 0→1, 200ms).

**RULES:**
- Easing: ALWAYS `cubic-bezier(0.16, 1, 0.3, 1)` for entrances (fast out, slow in)
- NEVER use `ease-in` for UI entrances — it feels sluggish
- NEVER animate more than `transform` + `opacity` on mobile (avoid layout thrashing)
- Tap feedback is NON-NEGOTIABLE: every button, card, pill, or clickable element MUST have `active:scale-[0.97]`
- Don't animate decorative elements — animate meaningful state changes only

---

### Shadows & Depth

```
Card shadow:     shadow-[0_2px_12px_rgba(0,0,0,0.25)]
Elevated:        shadow-[0_4px_24px_rgba(0,0,0,0.35)]
Brand glow:      shadow-[0_0_30px_rgba(31,199,98,0.15)]
Strong glow:     shadow-[0_0_40px_rgba(31,199,98,0.25)]
Habit glow:      shadow-[0_0_20px_rgba(HABIT_R,HABIT_G,HABIT_B,0.15)]
Inset:           shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)]
Bottom nav:      shadow-[0_-4px_20px_rgba(0,0,0,0.3)]
```

**Depth ordering (lowest → highest):**
```
1. Page background     → bg-[#122017]
2. Inset surfaces      → bg-[#0d1a12] + inset shadow  (input fields, recessed areas)
3. Cards               → bg-[#1a2c22] + card shadow
4. Elevated elements   → bg-[#23352b] + elevated shadow  (dropdowns, tooltips)
5. Overlays            → bg-black/50 + backdrop-blur     (bottom sheet backdrop)
6. Modal surfaces      → bg-[#1a2c22] + elevated shadow  (bottom sheet content)
7. FABs / toasts       → bg-[#1fc762] + brand glow       (floating actions)
```

---

### Borders & Dividers

```
Card border:         border border-white/[0.06]
Active card border:  border border-[#1fc762]/20
Habit card border:   border border-[HABIT_COLOR]/15
Input border:        border border-white/10  →  focus:border-[#1fc762]/40
Divider:             border-t border-white/[0.04]
```

**RULES:**
- Border opacity NEVER above 0.15 on cards (too heavy = amateur)
- Prefer `border-white/[0.06]` as the default — barely visible, but adds definition
- NEVER use `border-gray-*` — always white with low opacity
- Inputs get slightly stronger border: `border-white/10`, brighter on focus

---

### Icons

**System:** Material Symbols Outlined (Google Fonts), 400 weight, GRAD 0, opsz 24

```html
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,0" rel="stylesheet" />
```

**Sizes:**
```
Nav icons:     text-[22px]
Card icons:    text-[20px]
Hero icons:    text-[28px]
Badge icons:   text-[16px]
```

**States:**
- Default: `FILL: 0` (outlined)
- Active/selected: `FILL: 1` via `.material-symbols-filled { font-variation-settings: 'FILL' 1; }`
- Disabled: `text-[#5C716A]`

**Icon + text alignment:** Always use `flex items-center gap-2`

---

### Specific Screen Guidelines

#### Dashboard (Main screen)
- **Hero element:** Circular SVG progress ring — large (200-220px), centered, with brand glow
- Inside the ring: current count / daily limit as `text-5xl font-light`
- Below ring: habit name in small caps + "bugungi" label
- Habit selector pills: horizontally scrollable, active pill has habit-colored bg + border
- Quick-log button: fixed or prominent, brand-colored, full-width, with `+ Qayd etish` and plus icon
- Money saved card: below progress, shows today's savings with animated number counting up
- Stagger animation: ring → pills → stats → button (80ms delays)

#### Stats Screen
- **Hero element:** Gradient hero card at top with total savings number (`text-4xl font-light`)
- Weekly chart: Recharts area chart, smooth curves (`type="monotone"`), no gridlines, subtle gradient fill
- Chart area fill: habit-colored with 0.15 opacity gradient to transparent
- Chart line: habit-colored, `strokeWidth={2.5}`, with active dot on current day
- Period selector (7 kun / 30 kun): pill-style toggle
- Summary cards below chart: 3-column grid with daily average, best day, total

#### Health Screen
- **Hero element:** Top card showing hours since last use — large timer-style display
- Timeline: vertical line (dashed, `border-[#1fc762]/20`), milestone nodes along it
- 3 milestone states:
  - **Unlocked:** brand-colored icon circle + brand glow, filled icon, white title
  - **In-progress:** pulsing brand-colored ring (animation), outlined icon, brand-colored title
  - **Locked:** dim circle (`bg-white/5`), gray icon, gray title + "X soat qoldi" label
- Milestone cards: connected to timeline line via small horizontal connector
- Progress between milestones: thin brand-colored fill on the timeline line segment

#### Profile Screen
- Accessed from header avatar button (not bottom nav)
- User info card: avatar circle (first letter, brand gradient bg) + name + username
- Habit profile cards: one per active habit, showing baseline, limit, cost settings
- Edit mode: inputs appear inline within cards, smooth height transition
- Danger zone: "Profilni o'chirish" in red, requires confirmation bottom sheet
- BackButton: Telegram `BackButton.show()` + `BackButton.onClick()` to navigate back

#### Onboarding
- Multi-step wizard, swipeable or next-button driven
- Step indicator: dots at top (`bg-[#1fc762]` active, `bg-white/10` inactive)
- Large illustrative icons per step (Material Symbols at 48px, brand-colored)
- Habit selection: big tappable cards (not small checkboxes)
- Number inputs (baseline, cost): styled with custom stepper (−/+ buttons flanking a number)
- Final step: encouraging message + animated check mark → auto-redirect to Dashboard

---

### Gradient Recipes

**Hero card gradient:**
```
bg-gradient-to-br from-[#1a2c22] via-[#1a2c22] to-[#122017]
```

**Brand gradient (for avatars, accent fills):**
```
bg-gradient-to-br from-[#1fc762] to-[#17a34a]
```

**Habit gradient fill (for chart areas):**
```jsx
<defs>
  <linearGradient id="sigaret-fill" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stopColor="#F97316" stopOpacity={0.2} />
    <stop offset="100%" stopColor="#F97316" stopOpacity={0} />
  </linearGradient>
</defs>
```

**Glass effect (bottom sheet, overlays):**
```
bg-[#1a2c22]/95 backdrop-blur-xl border-t border-white/[0.08]
```

---

### Anti-Patterns (HARD RULES — violating these = regression)

**Claude Code MUST NOT generate ANY of these:**

| ❌ BAD | ✅ CORRECT | Why |
|--------|-----------|-----|
| `bg-black`, `bg-gray-900` | `bg-[#122017]`, `bg-[#0d1a12]` | Green-tinted darks are the brand |
| `text-white` | `text-[#F1F5F2]` | Pure white is too harsh |
| `text-gray-400` | `text-[#94A3A1]` | Custom palette, not Tailwind grays |
| `rounded-md`, `rounded-lg` on cards | `rounded-2xl` | Cards are always large-radius |
| `p-2`, `p-3` on cards | `p-4`, `p-5`, `p-6` | Cards need generous padding |
| `border-gray-700` | `border-white/[0.06]` | Subtle white opacity borders |
| `font-bold` on hero numbers | `font-light` (300) | Light weight = premium |
| No active state on buttons | `active:scale-[0.97]` | Every button needs tap feedback |
| `ease-in` on entrances | `cubic-bezier(0.16, 1, 0.3, 1)` | Physics-based easing |
| `animate-spin` for loading | Skeleton shimmer (`animate-pulse`) | Skeletons feel more polished |
| Solid separators `border-b` | `border-b border-white/[0.04]` | Barely-there dividers |
| System font stack | `font-['Lexend']` | Lexend is non-negotiable |
| Using any Tailwind `gray-*` | Custom green-tinted palette | Brand consistency |
| `shadow-md`, `shadow-lg` | Custom shadow values | Tailwind default shadows are wrong color |
| Fixed pixel sizes for icons | Material Symbols with text-[Npx] | Consistent icon system |

---

### Component Quality Checklist (APPLY TO EVERY COMPONENT)

Before committing any UI code, verify ALL of these:

- [ ] All colors from the palette — no hardcoded one-off hex values
- [ ] Text uses correct scale row (hero/heading/body/caption)
- [ ] Cards have `rounded-2xl` + `p-5` + `border border-white/[0.06]`
- [ ] All buttons have `active:scale-[0.97]` + transition
- [ ] Interactive elements have `min-h-[44px]` touch target
- [ ] CTAs have `min-h-[56px]` + brand color + glow shadow
- [ ] Page has `pb-28` to clear bottom nav
- [ ] Loading state: skeleton shimmer, not spinner
- [ ] Empty state: icon + message + suggested action
- [ ] Error state: subtle red accent, retry button
- [ ] Spacing matches the rhythm (space-y-4 or space-y-6, not mixed)
- [ ] Numbers use `font-light tracking-tight` for premium feel
- [ ] Labels/units use `text-xs uppercase tracking-wide text-tertiary`
- [ ] Icons are Material Symbols with correct size and fill state
- [ ] Animations use `cubic-bezier(0.16, 1, 0.3, 1)` for entrances
- [ ] No Tailwind gray-* classes anywhere — all custom palette
- [ ] Works in Telegram WebView (test: no `position: fixed` conflicts with TG header)

---

## Current Project Status (as of 2026-03-09)

### Completed
- All project scaffolding, TypeScript configs, and dependencies installed
- Database: 6 migration files, 9 tables, SQLite dev DB operational
- API: all endpoints implemented (auth, profiles, logs, health, stats, streak, quit-plan, groups, ping)
- API: cron.ts handles push notifications (4 types) + quit plan step transitions
- Bot: grammy with /start + WebApp menu button + notification sending
- Webapp: 7 pages (Onboarding, Dashboard, Stats, Health, Profile, Community, GroupDetail)
- Webapp: 12 components, 3 hooks, 4 lib modules, i18n (uz/ru)
- Dev mode with SQLite + bypassed auth for local testing

### Post-MVP Features Implemented
1. **i18n** — uz/ru locales, auto-detect from Telegram, language selector in Profile
2. **Streak counter** — consecutive zero-use days, displayed on Dashboard
3. **Push notifications** — 4 types via grammy + node-cron, settings in Profile
4. **Adaptive quit plans** — 3 speed presets, step progression, Dashboard progress card
5. **Community/friends** — groups with invite codes, member progress, alkogol privacy toggle, 4th nav tab

### Remaining (Deployment)
- Deploy API to Railway with PostgreSQL
- Deploy bot to Railway
- Deploy webapp (Railway / Vercel / Netlify)
- Configure BotFather Mini App URL
- End-to-end testing in real Telegram client
