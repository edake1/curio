# Curio

A collection of 10 thought-provoking, viral-ready mini-apps—all in one place. Built to spark curiosity, debate, and self-reflection.

## What Is This?

Curio is a single-page hub of interactive micro-experiences. Users land on a grid of 10 mini-apps, tap into any one, and get drawn into something that makes them think, share, or feel something unexpected. Each app is designed to be instantly engaging, mobile-first, and inherently shareable.

## The 10 Mini-Apps

| # | App | What It Does |
|---|-----|-------------|
| 1 | **One Decision** | A daily moral dilemma with real-time crowd voting. "A train is heading toward 5 people…" — pick a side and see how the world voted. |
| 2 | **This Career Does Not Exist** | AI generates fake-but-plausible job titles, descriptions, salary ranges, and required skills. Hit refresh for another. |
| 3 | **Parallel You** | Enter your birth year, pick a country, and see what your life would statistically look like if you'd been born there — income, work hours, life expectancy, and a fun fact. |
| 4 | **Your Life Stats** | Enter your birthday and see your life quantified in heartbeats, breaths, blinks, dreams, and more. |
| 5 | **Anti-Motivational** | AI-generated demotivational posters — cynically funny quotes styled as classic motivational art. |
| 6 | **What You'll See** | Enter your age and see a timeline of future world events you're statistically likely to witness, each with a likelihood score. |
| 7 | **Life Calendar** | Your entire life rendered as a grid of weeks — lived weeks in color, remaining weeks in gray. A visceral mortality visualization. |
| 8 | **Pick One to Delete** | Two things. You must erase one from existence forever. Real-time voting shows what others chose. |
| 9 | **Don't Move** | A patience game — hold your mouse/device perfectly still. Animated distractions try to make you flinch. |
| 10 | **While You Were Here** | Real-time counters showing what happened globally while you've been on the page — births, deaths, emails sent, pizzas ordered. |

## Tech Stack

- **Framework:** Next.js 16 (App Router, React 19)
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4 + shadcn/ui components
- **Animations:** Framer Motion
- **Database:** SQLite via Prisma ORM
- **AI Generation:** z-ai-web-dev-sdk (powers career generator, demotivational quotes, new dilemmas, and new delete-choices)
- **Runtime:** Bun (standalone output)

## Architecture

```
src/
├── app/
│   ├── page.tsx               # Hub page + routing shell (~130 lines)
│   ├── layout.tsx             # Root layout, fonts, metadata
│   ├── globals.css            # Theme variables, custom utilities
│   └── api/
│       ├── dilemma/           # GET daily/random dilemma, POST AI-generated
│       │   └── vote/          # POST vote, GET stats
│       ├── delete-choice/     # GET random choice, POST AI-generated
│       │   └── vote/          # POST vote, GET stats
│       ├── generate/
│       │   ├── career/        # POST → AI or fallback fake career
│       │   └── demotivational/# POST → AI or fallback quote
│       └── global-stats/      # GET real-time stats, POST visitor tracking
├── components/
│   ├── apps/                  # One file per mini-app
│   │   ├── one-decision.tsx
│   │   ├── this-career.tsx
│   │   ├── parallel-you.tsx
│   │   ├── life-stats.tsx
│   │   ├── anti-motivational.tsx
│   │   ├── what-youll-see.tsx
│   │   ├── life-calendar.tsx
│   │   ├── pick-one-delete.tsx
│   │   ├── dont-move.tsx
│   │   └── while-here.tsx
│   ├── share-button.tsx       # Native share / clipboard fallback
│   └── ui/                    # shadcn/ui primitives (Button, Input, Badge)
├── data/                      # All externalized data (zero inline constants)
│   ├── apps.ts                # App definitions (id, name, icon, color)
│   ├── countries.ts           # 60+ countries with life expectancy & stats
│   ├── future-events.ts       # 19 future predictions with certainty scores
│   ├── global-rates.ts        # Real-time stat rates + computation helper
│   ├── careers.ts             # Fallback career templates & skills
│   ├── demotivational.ts      # Fallback demotivational quotes
│   └── seed.ts                # Seed dilemmas & delete choices
├── hooks/
│   └── use-mobile.ts          # useIsMobile hook
└── lib/
    ├── db.ts                  # Prisma client singleton
    ├── hooks.ts               # useFetchOnMount generic hook
    ├── session.ts             # getSessionId helper
    ├── types.ts               # Shared interfaces (Dilemma, DeleteChoice)
    ├── utils.ts               # cn() helper
    └── validation.ts          # Zod schemas for API input validation
```

The app is a client-rendered SPA. The hub page shows all 10 app cards; tapping one renders the corresponding component with a back button. Two apps (One Decision, Pick One to Delete) persist and aggregate votes via SQLite. Three AI-powered apps (Career, Anti-Motivational, Dilemma, Delete-Choice) use server-side generation with hardcoded fallbacks. All data is externalized into `src/data/` — zero inline constants in components or API routes.

## Data Models (Prisma/SQLite)

- **Dilemma** — moral questions with A/B options, vote counts, daily-feature flag
- **Vote** — individual votes linked to a dilemma + anonymous session ID
- **DeleteChoice** — "pick one to delete" pairs with vote counts
- **DeleteVote** — individual votes for delete choices
- **SiteStats** — aggregate counters (total votes, visitors)
- **VisitorSession** — anonymous session tracking

## Getting Started

```bash
# Install dependencies
bun install

# Set up environment
cp .env.example .env

# Push database schema
bun run db:push

# Generate Prisma client
bun run db:generate

# Start dev server
bun run dev
```

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | SQLite database file path | `file:./dev.db` |

## Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start development server on port 3000 |
| `bun run build` | Production build (standalone output) |
| `bun run start` | Run production server |
| `bun run lint` | Run ESLint |
| `bun run db:push` | Push Prisma schema to database |
| `bun run db:generate` | Generate Prisma client |
| `bun run db:migrate` | Run Prisma migrations |
| `bun run db:reset` | Reset database |
| `bun run db:seed` | Seed database with initial data |

## License

Private project.
