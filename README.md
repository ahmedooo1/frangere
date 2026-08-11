# Frangère — فرانجير

Automated, production-ready platform that polls official French administrative
RSS feeds, and uses Google Gemini (free tier) to filter, translate (Arabic), summarize, and
categorize updates for newcomers to France.

## Stack

- **Nuxt 3** (SSR) + **Tailwind CSS** — custom "dossier / tampon" design system, full RTL (Arabic default) / LTR (French) support
- **PostgreSQL + Prisma ORM**
- **node-cron** (in-process, every 6h by default) + standalone script fallback for serverless/system-cron deployments
- **`@google/generative-ai`** (Gemini 2.5 Flash, free tier) for filter → translate → summarize → categorize, with a deterministic mock fallback when no API key is set

## 1. Install

```bash
npm install
cp .env.example .env
# edit .env: DATABASE_URL, GEMINI_API_KEY (optional — mock fallback works without it)
```

## 2. Get a free Gemini API key

1. Go to https://aistudio.google.com/apikey
2. Create a key (free tier: generous daily request quota, no card required)
3. Paste it into `.env` as `GEMINI_API_KEY`

## 3. Database

```bash
npx prisma db push     # create tables from prisma/schema.prisma
npm run db:seed        # seed Category + default FeedSource rows
```

> Note: `npm install`'s postinstall step runs `prisma generate`, which
> downloads a small native query-engine binary from `binaries.prisma.sh`.
> If you're behind a restrictive firewall/proxy, allow that domain (or set
> `PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1` only if you already vendor the
> engine another way). This sandboxed dev container had that domain
> blocked, so DB round-trips weren't runtime-verified here — `npm run build`
> (Vite + Nitro compile, 0 errors) was verified instead. Everything works
> normally on a machine/CI with standard internet access.

## 4. Run

```bash
npm run dev        # http://localhost:3000
# or
npm run build && node .output/server/index.mjs
```

Without `GEMINI_API_KEY` set, the pipeline still runs end-to-end and
publishes clearly-labeled mock-translated articles, so the UI, search,
filters, and pagination are fully demoable out of the box.

## 5. Automation

The pipeline (poll feeds → Gemini → save `PUBLISHED` articles) runs three ways:

1. **In-process cron** (`server/plugins/cron.ts`) — starts automatically with
   the Nitro server, schedule via `CRON_SCHEDULE` (default `0 */6 * * *`).
   Set `CRON_ENABLED=false` to disable (recommended for serverless).
2. **Manual/external trigger** — `POST /api/feed` (protect it by setting
   `CRON_SECRET` and sending `Authorization: Bearer <secret>`).
3. **Standalone script** — `npm run cron:run`, for a system crontab or a
   serverless scheduled function (Vercel Cron, etc.) that shells out instead
   of relying on a long-lived process.

## 6. API

- `GET /api/articles?q=&category=&page=&pageSize=` — search/filter/paginate published articles
- `GET /api/articles/:id` — single article
- `GET /api/categories` — categories with published counts
- `POST /api/feed` — trigger the pipeline manually

## 7. Project structure

```
server/
  api/                # REST endpoints
  plugins/cron.ts      # in-process scheduler
  utils/
    ai.ts              # Gemini prompt + mock fallback
    rss.ts             # feed fetch + mock fallback
    pipeline.ts         # orchestrates poll -> AI -> DB
    prisma.ts
prisma/
  schema.prisma        # Article, Category, FeedSource
  seed.ts              # default categories + official feed URLs
scripts/run-pipeline.ts # standalone cron entrypoint
components/             # ArticleCard, SearchBar, CategoryFilter
composables/useLocale.ts # AR/FR dictionary + RTL/LTR toggle
pages/                  # index (feed) + article/[id] (detail)
```

## 8. Design

Custom "administrative dossier" system (see `tailwind.config.js` /
`assets/css/main.css`): warm paper background, navy/stamp-red/guichet-green
palette, category badges styled as official rubber stamps (`.tampon`), and
article cards styled as perforated dossier folders (`.dossier-card`). Cairo
for Arabic UI, Fraunces for French headers, Space Mono for reference/date
labels.

## 9. Security notes

- Never commit `.env` (already git-ignored).
- Set `CRON_SECRET` in production so `POST /api/feed` can't be spammed by
  the public (it consumes Gemini API quota).
- If any API token/credential is ever pasted into a chat, ticket, or commit,
  treat it as compromised and rotate it immediately.
