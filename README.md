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
- **Collapsible card library** with categories: Personal, Activity, Fitness, Study, Location, Transport, Chores, Social
- **Show/Hide top panels** for Mood Starter and Today's Look selectors

### 🎭 Starting Mood Selector
Choose your starting emotional state: Motivated, Hopeful, Happy, Anxious, Exhausted, Calm, Excited, Stressed

### 👗 Today's Look Selector
Multi-select outfits: Casual, Athletic Wear, Business, Pajamas, Uniform, Bathing Suit, and more — Claude factors this into every simulation

### ⚡ Simulate Day — Full AI Day Prediction
- One click sends **all events** to Claude in a single holistic prompt
- Claude returns a **complete day narrative**: emotional arc, event-by-event insights, momentum, end-of-day feel, identity statement, 30-day projection
- **Live loading screen** with animated neural orb and progress percentage bar
- Results auto-expand to **fullscreen** after simulation completes

### 🔮 AI Prediction Fullscreen View
- **Day title** with gradient headline ("The Morning Architect's Rise")
- **Event flow timeline** — each activity's insight in context of the full day
- **Day Scores panel** — Energy 🔋, Mood 😊, Focus 🎯, Social 🤝 with animated bars + overall score pill
- **Momentum & End of Day** sections
- **Identity statement** — who you're becoming
- **30-Day Projection** — who you become if you repeat this pattern
- **Draggable/minimizable** results panel

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

### 🌐 Onboarding
- Full-screen split-layout with motivational photo carousel (10s transitions)
- Collects: name, city (Nominatim autocomplete), age group, gender identity, mood, energy
- **Skip Setup** available at every step

---

## 🃏 Activity Card Library — 100+ Activities

| Category | Examples |
|---|---|
| 🏠 **Personal** | Morning Prayers, Watch YouTube, Wake Up, Go to Bed, Pray |
| 🏃 **Fitness** | Morning Run, Gym, Yoga, Swim Laps, Cycling |
| 📚 **Study** | Study, Read, Language Practice, Online Course, Duolingo |
| 🌍 **Location** | Coffee Shop, Library, Park, Restaurant, Bathhouse, Spa |
| 🚗 **Transport** | Drive, Take Train, Walk, Go to Airport, Travel |
| 🎨 **Activity** | Cook Dinner, Date Night, Play Instrument, DJ/Mix Music |
| 🧹 **Chores** | Clean, Laundry, Grocery Shopping, Meal Prep |
| 👥 **Social** | Spend Time with Friend, Get Drinks, Cook New Recipe |
| 💇 **Self-Care** | Get Nails Done, Blowout, Hair Colored, Self Maintenance, Wax |

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
| **AI** | Anthropic Claude claude-sonnet-4-5 |
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
│   │   ├── canvas/          # DayCanvas, EventBlock, CardLibrary, ParallelDaysView
│   │   ├── prediction/      # PredictionPanel, DayPredictionFullscreen, DayComparisonFullscreen
│   │   ├── tree/            # BranchTreeView, DecisionNode, OutcomeEdge
│   │   ├── onboarding/      # OnboardingForm, MotivationalCarousel, CityAutocomplete
│   │   ├── account/         # AuthModal, HistoryCalendar
│   │   ├── simulation/      # SimulationLoadingScreen
│   │   └── profile/         # IdentityPanel
│   ├── hooks/
│   │   └── useTimeline.js   # Event-based timeline state (useReducer)
│   ├── data/
│   │   └── decisionCards.js # 100+ activity cards with categories & metadata
│   └── utils/
│       ├── claudeClient.js  # simulateDay, compareDays, simulateTree, simulateDecision
│       └── accountClient.js # Auth + saved days HTTP client
├── server/
│   ├── index.js             # Express app (serves frontend in production)
│   ├── routes/
│   │   ├── simulate.js      # /day, /compare, /tree, /decision, /summary
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
| `POST /api/simulate/summary` | End-of-day "Who You're Becoming" summary |

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

---

## 📄 License

MIT © Rebecca Tolpin

---

<div align="center">

**Built with ❤️ and Claude AI**

### 🌐 [future-you-predictions-app.up.railway.app](https://future-you-predictions-app.up.railway.app)

[📦 GitHub Repo](https://github.com/rtolpin/Future-You-Predictions-App) &nbsp;·&nbsp; [🐛 Report Issue](https://github.com/rtolpin/Future-You-Predictions-App/issues) &nbsp;·&nbsp; [⭐ Star on GitHub](https://github.com/rtolpin/Future-You-Predictions-App)

</div>
