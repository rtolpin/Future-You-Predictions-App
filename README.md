# 🔮 Future You — AI Life Simulator

<div align="center">

### 🌐 **LIVE APP: [https://future-you-predictions-app-production.up.railway.app/](https://future-you-predictions-app-production.up.railway.app/)**

*Simulate your future. Build your identity. Decide who you become.*

[![Powered by Claude](https://img.shields.io/badge/Powered%20by-Claude%20AI-00d4b1?style=for-the-badge&logo=anthropic&logoColor=white)](https://anthropic.com)
[![Built with React](https://img.shields.io/badge/Built%20with-React%2019-61dafb?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Express Backend](https://img.shields.io/badge/Backend-Express%205-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com)
[![Deployed on Railway](https://img.shields.io/badge/Deployed%20on-Railway-8B5CF6?style=for-the-badge&logo=railway&logoColor=white)](https://railway.app)

</div>

---

## ✨ What is Future You?

**Future You** is an immersive, AI-powered life simulation app that lets you build out your day activity by activity and instantly see how each decision shapes your emotional state, social environment, energy, productivity, and long-term identity — all powered by **Claude AI** (Anthropic).

> *"What kind of person does a morning run + focused work block + cooking dinner make you after 30 days?"*

Future You answers that question with vivid, psychologically-grounded simulations drawn from behavioral science, sociology, and life coaching principles.

---

## 🚀 Core Features

### 🗓️ Day Canvas — Interactive Daily Planner
- **Drag & drop** activity cards from a rich library onto a visual timeline calendar
- **15-minute snap grid** with live time badge showing exactly where an event will land
- **Click to open Event Detail Modal** — edit name, color, start/end time, notes, location, all-day toggle
- **Adjust Time** resize handle at the bottom of every event to change duration
- **16-color palette** per event for visual organization
- **Hold-to-accelerate +/− buttons** to quickly adjust day start/end hours
- **AM/PM ↔ 24h toggle** for time format preference
- **Fullscreen calendar mode** — press Escape or click the exit button to return to Day Canvas
- **Collapsible card library** with search (fuzzy matching + close suggestions) and 10+ categories

### 🔍 Card Library Search
- Live search across all 120+ activity cards
- **Fuzzy close-match suggestions** — finds "run" even if you type "runn" or "jog"
- Results highlight the matched term; click any suggestion to add it instantly
- Filtered by category when a tab is selected

### 🎭 Starting Mood Selector
- Choose your starting emotional state: Motivated, Hopeful, Happy, Anxious, Exhausted, Calm, Excited, Stressed, **Sad** — or type your own **custom mood**
- Compact panel that auto-hides on scroll and reappears on scroll-up

### 👗 Today's Outfit Selector
- Multi-select outfits across categories: **Casual, Active, At Home, Going Out, Professional**
- Full-screen wide modal with two-column layout — professional and spacious
- **Custom outfit input** at the bottom of the modal (scroll to reveal)
- Selected outfits display as pills in the compact bar — full names shown, no truncation
- Claude factors your outfit into every simulation

### 🎯 Today's Goals
- Set **Good Habits to Build** and **Bad Habits to Break** before your day starts
- **Custom goals** with full emoji picker (40 emojis + paste your own) — tap the icon to change it
- Quick-pick goal templates for common habits (exercise, screen time, hydration, etc.)
- Goals appear as a **right-side panel** on the main canvas — collapsible per category
- **Check off goals** as you complete them — good habits turn teal ✅, bad habits turn red ❌

### 📋 Day Retrospective
- After planning, do a **structured end-of-day reflection**:
  - Rate each goal: Hit It / Partial / Missed
  - Free-text reflection on what happened
  - Log actual events that differed from your plan
  - Rate your overall mood and energy
- **Asymptotic loading bar** (never gets stuck) while Claude analyzes
- Claude returns: overall score, wins, things to work on with strategies, tomorrow's focus, closing message
- Results automatically appear in the **AI Predictions side panel** for quick reference

### ⚡ Simulate Day — Full AI Day Prediction
- One click sends **all events** to Claude in a single holistic prompt
- Claude returns a **complete day narrative**: emotional arc, event-by-event insights, momentum, end-of-day feel, identity statement, 30-day projection
- **Live loading screen** with animated neural orb and asymptotic progress percentage bar (never gets stuck)
- Results auto-expand to **fullscreen** after simulation completes

### 🔮 AI Predictions Side Panel
A collapsible right-side panel with two tabs:

**AI Predictions tab:**
- Shows the full day simulation results inline
- **Daily Summary insights** card — score, trend, summary, today's win, watch-for, 30-day projection (shown after generating a Daily Summary)
- **Day Retrospective insights** card — score bar, wins, to-work-on items, tomorrow's focus (shown after completing a retrospective)
- Both insight cards are collapsible and dismissible with ✕

**Today's Goals tab:**
- Live view of all goals with check-off controls
- Scrollable when goals exceed the panel height

### ✨ Daily Summary — "Who You're Becoming"
- **Full-screen immersive view** (not a modal) with the app's deep-space background and ambient gradients
- **Header bar** with "← Back to Day Canvas" button and ✕ close button — always visible
- **Asymptotic progress bar** while generating
- Results displayed in a wide, spacious layout:
  - **Hero row** — large score ring (score/10), trend badge, 34px headline, full summary text
  - **Two-column details** — Day Scores (Energy, Mood, Focus, Social) on the left; 30-Day Projection + Today's Win + Watch For on the right
- Results also appear in the **AI Predictions side panel** after closing, for at-a-glance reference
- Available to all users — no account required

### 🔀 Parallel Days Comparison
Build two completely different days side-by-side:
- **Single shared card library** — drag cards to either Path A (teal) or Path B (purple)
- Each path has its own Day Duration controls, event grid, and individual Simulate button
- **Simulate & Compare Days** — one button sends BOTH days to Claude simultaneously
- Claude returns full simulations for each path PLUS a **head-to-head comparison**:
  - 🏆 Winner declaration with reasoning
  - 5-dimension comparison table (Energy, Focus, Mood, Social, Long-term Identity)
  - Per-path strengths bullets
  - "Who should choose which?" recommendation
- **Full comparison fullscreen view** — scrollable with side-by-side path details

### 🌿 Day Decisions Tree Builder
A fully interactive **decision tree builder** powered by ReactFlow:
- **Three ways to populate**: Day Canvas events auto-appear; Parallel Days simulations generate branches; or build from scratch with the card picker
- **+ Add Activity** button with searchable, categorized card panel (Personal shown first)
- **Click OR drag & drop** cards onto the canvas — place nodes at any position
- **Auto-connect** — dropped cards link to the currently selected node
- **Draw connections** by dragging between node handles
- **Remove Activity** deletes selected nodes and their edges
- **Simulate Decision Tree** — Claude analyzes every path and returns:
  - Per-path narrative, scores, and identity statement
  - Winner path with detailed reasoning
  - Per-node activity insights injected back into tree visually
  - Suggested next activities for each branch
- **Floating analysis panel** — draggable, resizable, minimizable with resize handle
- **Click any tree node** to inspect its full Claude-generated insight with score bar
- **Zoom in/out** via Controls panel; full minimap navigation

### 👤 User Accounts & History
- **Register / Sign In** with email + password
- **Save Day** (requires sign-in) with 3-second auto-save debounce
- **History Calendar** — browse and review all previously saved days
- **Forgot Password / Reset** with 6-digit code flow
- **Guest mode** — full simulation, Daily Summary, Goals, and Retrospective without an account

### 🌐 Onboarding
- Full-screen split-layout with motivational photo carousel (10s transitions)
- Collects: name, city (Nominatim autocomplete), age group, gender identity, mood, energy
- **Skip Setup** available at every step — prominently highlighted

---

## 🃏 Activity Card Library — 120+ Activities

| Category | Examples |
|---|---|
| 🍽️ **Food** | Sleep, Eat, Eat Breakfast, Eat Lunch, Eat Dinner, Eat Lunch at Coffee Shop |
| 🏠 **Personal** | Morning Prayers, Watch YouTube, Wake Up, Go to Bed, Pray |
| 🏃 **Fitness** | Morning Run, Gym, Yoga, Swim Laps, Cycling |
| 📚 **Study** | Study, Read, Language Practice, Online Course, Duolingo, Jewish Learning Class, Bible Study Class |
| 🌍 **Location** | Coffee Shop, Library, Park, Restaurant, Bathhouse, Spa |
| 🚗 **Transport** | Drive, Train, Bus, Walk, Subway, Uber, Lyft, Taxi, Ferry, Take a Flight |
| 🎨 **Activity** | Cook Dinner, Date Night, Play Instrument, DJ/Mix Music |
| 🧹 **Chores** | Clean, Laundry, Grocery Shopping, Meal Prep |
| 👥 **Social** | Spend Time with Friend, Get Drinks, Cook New Recipe |
| 💇 **Self-Care** | Get Nails Done, Blowout, Hair Colored, Self Maintenance, Wax |
| ✡️ **Faith** | Shabbat Services, Shabbat Dinner, Jewish Learning Class, Bible Study Class |
| ✏️ **Custom** | Add any activity not in the library — name it yourself |

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Vite 8, Tailwind CSS v4 |
| **Animations** | Framer Motion (spring physics, AnimatePresence, drag controls) |
| **Drag & Drop Calendar** | @dnd-kit/core (closestCenter collision, PointerSensor + TouchSensor) |
| **Decision Tree** | ReactFlow v11 (custom nodes, animated SVG edges with flowing dots) |
| **Backend** | Express 5, Node.js 20 |
| **Database** | SQLite via better-sqlite3 (WAL mode, foreign keys) |
| **AI** | Anthropic Claude claude-sonnet-4-6 |
| **Auth** | JWT (30-day expiry), bcryptjs (12 rounds) |
| **Deployment** | Railway (full-stack Node.js) |

---

## 🖥️ Local Development

### Prerequisites
- Node.js 18+
- An [Anthropic API key](https://console.anthropic.com)

### Setup

```bash
# Clone
git clone https://github.com/rtolpin/Future-You-Predictions-App.git
cd Future-You-Predictions-App

# Install
npm install

# Configure environment
cp .env.example .env
# Edit .env → add your ANTHROPIC_API_KEY

# Terminal 1 — backend (port 3001)
npm run server

# Terminal 2 — frontend (port 5173)
npm run dev
```

Open **[http://localhost:5173](http://localhost:5173)**

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | ✅ Yes | Your Anthropic API key |
| `PORT` | optional | Server port (default: 3001) |
| `NODE_ENV` | optional | Set to `production` to serve frontend from Express |

---

## 🚢 Deploy to Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

# Authenticate
railway login

# Deploy from project root
railway init
railway up

# Set your API key as an environment variable
railway variables set ANTHROPIC_API_KEY=sk-ant-api03-...
```

Or one-click deploy:

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template?template=https://github.com/rtolpin/Future-You-Predictions-App)

---

## 📁 Project Structure

```
future-you-app/
├── src/
│   ├── components/
│   │   ├── canvas/          # DayCanvas, EventBlock, CardLibrary, MoodPickerModal, OutfitPickerModal, ParallelDaysView
│   │   ├── prediction/      # PredictionPanel, FutureScoreBar, DayPredictionFullscreen, DayComparisonFullscreen
│   │   ├── goals/           # DayGoals, DayRetrospective
│   │   ├── summary/         # DailySummary (full-screen), FutureSelfCard
│   │   ├── tree/            # BranchTreeView, DecisionNode, OutcomeEdge
│   │   ├── onboarding/      # OnboardingForm, MotivationalCarousel, CityAutocomplete
│   │   ├── account/         # AuthModal, HistoryCalendar
│   │   ├── simulation/      # SimulationLoadingScreen
│   │   └── profile/         # IdentityPanel
│   ├── hooks/
│   │   └── useTimeline.js   # Event-based timeline state (useReducer)
│   ├── data/
│   │   └── decisionCards.js # 120+ activity cards with categories & metadata
│   └── utils/
│       ├── claudeClient.js  # simulateDay, compareDays, simulateTree, simulateDecision, generateDailySummary, generateRetrospective
│       └── accountClient.js # Auth + saved days HTTP client
├── server/
│   ├── index.js             # Express app (serves frontend in production)
│   ├── routes/
│   │   ├── simulate.js      # /day, /compare, /tree, /decision, /summary, /retrospective
│   │   ├── auth.js          # register, login, me, forgot-password, reset-password
│   │   └── days.js          # save, list, load saved days
│   └── services/
│       ├── claudeService.js # All Claude AI prompt builders
│       └── db.js            # SQLite: users, saved_days, password_resets tables
├── railway.toml             # Railway deployment config
└── .env.example             # Environment variable template
```

---

## 🤖 AI Simulation Endpoints

| Endpoint | Description |
|---|---|
| `POST /api/simulate/day` | Full day — all events → unified narrative + scores |
| `POST /api/simulate/compare` | Two paths → dual simulation + head-to-head analysis |
| `POST /api/simulate/tree` | Decision tree → all paths → per-path + node insights |
| `POST /api/simulate/decision` | Single event simulation |
| `POST /api/simulate/summary` | End-of-day "Who You're Becoming" full summary |
| `POST /api/simulate/retrospective` | Structured day reflection → score, wins, growth areas, tomorrow's focus |

---

## 🎨 Design System

| Token | Value |
|---|---|
| Background | `#09090f` deep space |
| Primary accent | `#00d4b1` teal |
| Secondary accent | `#a78bfa` purple |
| Tertiary accent | `#f59e0b` amber |
| Heading font | Space Grotesk |
| Body font | DM Sans |
| Data/times font | JetBrains Mono |
| Glass panels | `rgba(255,255,255,0.04)` + `blur(20px)` |
| Progress bars | Asymptotic formula: `99 × (1 − e^(−t/τ))` — always moving, never stuck |

---

## 📄 License

MIT © Rebecca Tolpin

---

<div align="center">

**Built with ❤️ and Claude AI**

### 🌐 [https://future-you-predictions-app-production.up.railway.app/](https://future-you-predictions-app-production.up.railway.app/)

[📦 GitHub Repo](https://github.com/rtolpin/Future-You-Predictions-App) &nbsp;·&nbsp; [🐛 Report Issue](https://github.com/rtolpin/Future-You-Predictions-App/issues) &nbsp;·&nbsp; [⭐ Star on GitHub](https://github.com/rtolpin/Future-You-Predictions-App)

</div>
