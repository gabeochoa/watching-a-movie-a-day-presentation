# REDO PLAN: Wrapboxd (Letterboxd analytics) + server-side SQLite cache

## What changed (new direction)

We are intentionally moving from “no backend + file cache” to a **server + client** model so the
TMDB cache is **cross-user by default**.

- **Client**: vanilla JS + D3 charts, Letterboxd ZIP parsing in-browser.
- **Server**: Express + SQLite cache for TMDB responses.

## Goals

- **Cross-user TMDB caching**: if any user fetches TMDB data once, all users of the same server get cache hits.
- **Vanilla client**: ES modules, no React/Vue, use D3 for charts.
- **Keep/restore charts** (at least):
  - Ratings histogram
  - Watches by month (timeline)
  - Release year distribution
  - Follow-ups: director/genre/runtime (from TMDB)
- **Minimal server surface**: not a generic proxy; only the endpoints we need.

## Non-goals (for now)

- Perfect handling of every Letterboxd export variant on day 1.
- High-end UI polish before correctness.
- Turning this into a hosted multi-tenant service (auth, accounts, etc.).

## Architecture

### Server (shared cache)

- Node + Express serves:
  - static client from `public/`
  - `/api/tmdb/...` endpoints that:
    - compute a stable cache key (path + sorted query)
    - check SQLite
    - fetch TMDB on miss
    - store `status`, `fetched_at`, and `payload_json`
    - return payload with `X-Wrapboxd-Cache: HIT|MISS`

Credentials:

- `TMDB_BEARER_TOKEN` (preferred) or `TMDB_API_KEY`
- never committed; env vars only

SQLite:

- `data/cache.sqlite` (gitignored)
- table `tmdb_cache(cache_key TEXT PRIMARY KEY, status INTEGER, fetched_at TEXT, payload_json TEXT)`

### Client (analytics + charts)

- Upload Letterboxd export `.zip` in browser.
- Parse CSVs (`diary.csv`, `films.csv`, etc.) with PapaParse.
- Compute aggregates in pure functions (testable).
- Render charts with D3.
- When enrichment is needed (director/genre/runtime), call server endpoints (never TMDB directly).

## “Keeping all the charts”

We will implement charts in two phases:

1. **Letterboxd-only** (no TMDB required):
   - ratings histogram
   - watches-by-month
   - release-year distribution
2. **TMDB-enriched** (uses SQLite cached server calls):
   - genre distribution (TMDB genres)
   - director leaderboard (credits)
   - runtime distribution (movie details)

## Implementation milestones

1. **Server baseline**
   - Static hosting + `/api/health`
   - `/api/tmdb/movie/:id` + `/api/tmdb/movie/:id/credits` cached in SQLite
2. **Client baseline**
   - ZIP upload + parse (safe-ish probing of expected CSV files)
   - Compute aggregates
   - Render the 3 core D3 charts
3. **Enrichment plumbing**
   - Map Letterboxd rows → TMDB IDs (via IMDb ID if present, or search endpoint later)
   - Add enriched charts
4. **Hardening**
   - ZIP size and file allowlist limits
   - Server rate limiting/backoff + error handling
   - Optional cache export/import CLI for seeding across environments

## Success criteria

- Running `npm install && npm run dev` starts a server that serves the app.
- TMDB calls become **HITs** after the first request for a given resource.
- Charts render correctly from a Letterboxd export ZIP.

