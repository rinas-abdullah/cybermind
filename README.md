# رِسَاق | Risaq

Adaptive cybersecurity training platform: hands-on scenarios, an AI mentor, gamified progress tracking, and institutional analytics — built on Node.js/Express with PostgreSQL (or a zero-setup in-memory mode for a quick trial).

## Quick start

```bash
npm install
cp .env.example .env
npm start
# open http://127.0.0.1:3001
```

By default `DB_TYPE=in-memory` — nothing to install, but data (accounts, progress, mentor history) doesn't persist across restarts, and features that need real relational storage (the paths/modules/tasks admin system, institution-level accuracy reports, AI-generated technical résumés) return a clear "needs PostgreSQL" response instead of working.

Two demo accounts are seeded in in-memory mode:

| Username | Email | Password |
|---|---|---|
| `admin` | admin@risaq.local | `Risaq@Demo123!` |
| `demo` | demo@risaq.local | `Risaq@Demo123!` |

### Running against real PostgreSQL

```bash
# .env
DB_TYPE=postgresql
DATABASE_URL=postgresql://user:pass@host:5432/risaq
```

The schema (18 tables) is created automatically on boot — see `backend/db.js#createTables()`, mirrored for manual setup in `setup_db.sql`.

### AI mentor

Set a real `OPENAI_API_KEY` in `.env` to use OpenAI (`backend/services/aiMentorEngine.js`). Without one, the mentor runs on a built-in bilingual (EN/AR) mock/knowledge-base engine (`backend/services/ai/mockAiService.js`) — same API shape, so nothing else changes.

## What's actually implemented

- **Auth** — JWT + bcrypt, working in both in-memory and PostgreSQL modes.
- **Interactive labs** — a hand-authored attack-scenario library (`backend/services/attackSimulator.js`) plus AI-generated dynamic scenarios, served through a terminal-style UI (`/terminal`, `/practice`).
- **AI mentor** — Socratic-style hints (not direct answers), real OpenAI integration with a genuine knowledge-base fallback.
- **Adaptive difficulty** — scenario difficulty adjusts from submitted attempts (`backend/services/adaptiveLearningEngine.js`).
- **Gamification** — points, levels, streaks, achievements, leaderboard.
- **Paths / modules / tasks** — an admin-authorable structured curriculum (requires PostgreSQL).
- **Analytics** — institution/compliance/engagement reports (in-memory demo data) and per-institution accuracy reports (requires PostgreSQL).
- **i18n** — Arabic/English with RTL support.

## Project structure

```
backend/
  server.js            Express app, static/page serving
  db.js                Connection + schema (createTables, both DB modes)
  routes/              api.js (main), authRoutes, aiRoutes, scenarioRoutes, ...
  services/            attackSimulator, aiMentorEngine, adaptiveLearningEngine,
                        pathService, aiCoreService, risk/behavior analysis, ...
  data/                in-memory stores (progress, ai logs, demo users, courses)
  middleware/          auth, validation (zod), rate limiting, requirePostgres
frontend/pages/        one HTML file per screen (dashboard, terminal, admin, ...)
js/, css/              vanilla frontend — no bundler, served as-is
docs/                  product scope, environments/CI, architecture decisions (ADRs)
setup_db.sql           manual PostgreSQL schema (mirrors backend/db.js)
```

## Development

```bash
npm run dev              # nodemon
npm test                 # unit tests (constants + environment parsing)
npm run build             # produce dist/ (mirrors this layout, ready to deploy)
npm run serve:dist        # cd dist && npm install && npm start
```

CI (`.github/workflows/ci.yml`) runs `npm ci`, syntax checks, a production build, and the test suite on every push/PR.

## Known limitations

- Test coverage is limited to config/constants — no automated tests exercise routes, auth, or the DB layer yet.
- In-memory mode is for local trial only: single-process, non-persistent.
- The `/attempts/submit` → adaptive-difficulty pipeline expects scenario ids from the static scenario library (slugs like `network-scanning`), not the numeric ids in the AI-generated `scenarios` table — these are two separate scenario catalogs today.

See `docs/01-product-and-boundaries.md` for product scope and what's explicitly out of scope for v1, and `docs/decisions/` for architecture decisions.

## License

ISC
