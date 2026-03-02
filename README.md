# Curio

A collection of interactive micro-experiences that make you think, reflect, and see the world differently. Built with care.

## What Is This?

Curio is a single-page hub of 18 mini-apps. Each one is a small, self-contained experience — a moral dilemma, a life visualization, a piece of ancient wisdom, a patience test. You tap in, spend a minute or two, and come away with something: a new perspective, a number that surprises you, a question you can't shake.

The apps range from data-driven introspection (life calendars, birth-year snapshots) to AI-powered generation (fake careers, demotivational posters, wisdom context) to community-driven participation (voting, reflections, last words).

## The Apps

| # | App | Description |
|---|-----|-------------|
| 1 | **One Decision** | A moral dilemma. Pick a side, see how the world voted in real time. |
| 2 | **This Career Does Not Exist** | AI-generated jobs that sound real but aren't — title, salary, skills, and all. |
| 3 | **Parallel You** | Pick a country. See what your life would look like if you'd been born there. |
| 4 | **Your Life Stats** | Your age in heartbeats, breaths, blinks, dreams, and other strange units. |
| 5 | **The Void** | AI-generated demotivational posters. Cynically funny, shareable, downloadable. |
| 6 | **What You'll See** | Future events you're statistically likely to witness in your lifetime. |
| 7 | **Life Calendar** | Your entire life as a grid of weeks. Lived weeks in color, remaining in gray. |
| 8 | **Pick One to Delete** | Two things. Erase one forever. See what everyone else chose. |
| 9 | **Sound of Your Birth** | The #1 song, top movie, and prices from the year you were born. |
| 10 | **4,160 Saturdays** | How many of your ~4,160 lifetime Saturdays have you already spent? |
| 11 | **While You Were Here** | Real-time counters: births, deaths, emails, pizzas — all since you opened the page. |
| 12 | **The Grand Dao** | Ancient cultivation wisdom. Discover your Dao Name, hear AI-spoken cosmic paths, and collect quotes. |
| 13 | **Your Last Words** | Write what you'd leave behind. AI reflects it back to you. Read what others wrote in the memorial. |
| 14 | **Hikmah (حكمة)** | A daily piece of wisdom from cultures around the world, with AI-generated historical context and community reflections. |
| 15 | **Dead App** | The app that doesn't want to be opened. Stay for five minutes. If you can. |
| 16 | **The Rewind** | Witness a random moment in human history, revealed line by line. |
| 17 | **The Auction** | 100 tokens. 10 desires. Bid on abstract life experiences and let AI reveal what your choices say about you. |
| 18 | **Don't Move** | Predators home in on your cursor. Stay perfectly still or die. Near-misses build your score multiplier. |

## Tech Stack

- **Framework:** Next.js 16 (App Router, React 19)
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4 + shadcn/ui primitives
- **Animations:** Framer Motion
- **Database:** PostgreSQL (Neon) via Prisma ORM
- **AI:** OpenAI GPT-4o (text generation, context, TTS)
- **Image Export:** html-to-image
- **Runtime:** Node.js / Bun

## Architecture

```
src/
├── app/
│   ├── page.tsx                 # Hub + app routing shell
│   ├── layout.tsx               # Root layout, fonts, metadata
│   ├── globals.css              # Theme variables, utilities
│   └── api/
│       ├── dilemma/             # GET daily dilemma
│       │   └── vote/            # POST vote
│       ├── delete-choice/       # GET random choice pair
│       │   └── vote/            # POST vote
│       ├── dao-debate/          # POST AI Dao debate
│       ├── generate/
│       │   ├── career/          # POST AI career
│       │   ├── demotivational/  # POST AI poster quote
│       │   ├── grand-dao/       # POST AI Dao wisdom
│       │   └── dao-tts/         # POST text-to-speech
│       ├── last-words/
│       │   ├── submit/          # POST submit last words
│       │   ├── gallery/         # GET paginated memorial
│       │   └── upvote/          # POST upvote
│       ├── wisdom/
│       │   ├── daily/           # GET today's saying
│       │   ├── browse/          # GET filtered archive
│       │   ├── context/         # GET/generate AI context
│       │   ├── reflections/     # GET/POST reflections
│       │   │   └── upvote/      # POST upvote reflection
│       │   └── generate/        # POST AI-generate new sayings
│       └── global-stats/        # GET/POST visitor stats
├── components/
│   ├── apps/                    # One file per app (14 total)
│   ├── share-button.tsx         # Native share / clipboard fallback
│   └── ui/                      # shadcn/ui primitives
├── data/                        # Externalized data — no inline constants
│   ├── apps.ts                  # App definitions (id, name, icon, color)
│   ├── countries.ts             # 60+ countries with stats
│   ├── future-events.ts         # Future predictions with scores
│   ├── global-rates.ts          # Real-time stat rates
│   ├── careers.ts               # Fallback career templates
│   ├── demotivational.ts        # Fallback poster quotes
│   ├── life-stats.ts            # Life stat definitions
│   ├── wisdom.ts                # 146 proverbs + region/category constants
│   └── seed.ts                  # Seed dilemmas & delete choices
├── hooks/
│   └── use-mobile.ts            # useIsMobile hook
└── lib/
    ├── db.ts                    # Prisma client singleton
    ├── openai.ts                # OpenAI client singleton
    ├── hooks.ts                 # useFetchOnMount generic hook
    ├── session.ts               # getSessionId helper
    ├── types.ts                 # Shared interfaces
    ├── utils.ts                 # cn() helper
    └── validation.ts            # Zod schemas for API validation
```

## Data Models (Prisma / PostgreSQL)

- **Dilemma** — moral dilemmas with A/B options and vote counts
- **Vote** — individual votes linked to a dilemma + session ID
- **DeleteChoice** — "pick one to erase" pairs with vote counts
- **DeleteVote** — individual votes for delete choices
- **LastWord** — user-submitted last words with AI mirror text
- **WisdomSaying** — proverbs and sayings from around the world, with AI-generated context
- **WisdomReflection** — community reflections on sayings, with tags and upvotes
- **SiteStats** — aggregate counters (total visitors)
- **VisitorSession** — anonymous session tracking

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# → Set DATABASE_URL (PostgreSQL) and OPENAI_API_KEY

# Push database schema
npx prisma db push

# Generate Prisma client
npx prisma generate

# Seed the database
npm run db:seed

# Start dev server
npm run dev
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `OPENAI_API_KEY` | OpenAI API key (GPT-4o, TTS) |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server (port 3000) |
| `npm run build` | Production build |
| `npm run start` | Run production server |
| `npm run lint` | ESLint |
| `npm run db:push` | Push Prisma schema |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:seed` | Seed database |

## License

Private project.
