# Wrapboxd

Letterboxd analytics with a **server-side, cross-user TMDB cache** backed by **SQLite**, plus a
vanilla JS + D3 client for charts.

The server is what makes the cache cross-user: once anyone hits a TMDB endpoint, the response is
stored in `data/cache.sqlite` and shared for all users of that server.

## Run locally

### 1) Install dependencies

```bash
npm install
```

### 2) Set TMDB credentials (server-side)

Pick one:

- **Preferred**: `TMDB_BEARER_TOKEN` (TMDB v4 read token)
- **Alternative**: `TMDB_API_KEY` (v3 key)

Example:

```bash
export TMDB_BEARER_TOKEN="...your token..."
```

Or, for local development, create `app/secrets.js` (gitignored) by copying `app/secrets.example.js`.

### 3) Start the server

```bash
npm run dev
```

Open `http://localhost:3000/`.

## What’s implemented right now

- **Server** (`server/`):
  - Serves static client from `public/`
  - Cached TMDB endpoints (SQLite):
    - `/api/tmdb/movie/:id`
    - `/api/tmdb/movie/:id/credits`
    - `/api/tmdb/search/movie?query=...&year=...`
    - `/api/tmdb/find/imdb/:imdbId`
  - Adds `X-Wrapboxd-Cache: HIT|MISS` header to show caching behavior
  - `/api/cache/stats` shows SQLite cache size
- **Client** (`public/`):
  - Upload a Letterboxd export `.zip` and render D3 charts:
    - ratings histogram
    - watches by month
    - release year distribution
    - average rating by month
    - cumulative watches
    - rewatches by month
    - watches by weekday
    - average rating by release year
    - top months / top years (by watches)
  - “Enrich with TMDB” to populate additional charts (via cached server calls):
    - top directors
    - genre distribution
    - runtime distribution
    - rating vs runtime (scatter)
    - rating vs release year (scatter)
  - Export buttons:
    - analysis JSON
    - config JSON (placeholder for now)
    - cache stats JSON
    - export all (ZIP bundle)

## Repo layout (current)

```
/
  server/
    index.js
    db.js
    tmdb.js
  public/
    index.html
    src/
      app.js
      api/tmdb.js
      analytics/compute.js
      charts/d3charts.js
      letterboxd/parseZip.js
      ui/dom.js
  data/                # runtime sqlite db lives here (gitignored)
  REDO_PLAN.md
```

## TMDB attribution

If/when we ship a public UI, we will include required TMDB attribution per their terms.
