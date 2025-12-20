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

### 3) Start the server

```bash
npm run dev
```

Open `http://localhost:3000/`.

## What’s implemented right now

- **Server** (`server/`):
  - Serves static client from `public/`
  - `/api/tmdb/movie/:id` and `/api/tmdb/movie/:id/credits` cached in SQLite
  - Adds `X-Wrapboxd-Cache: HIT|MISS` header to show caching behavior
- **Client** (`public/`):
  - Upload a Letterboxd export `.zip` and render 3 D3 charts:
    - ratings histogram
    - watches by month
    - release year distribution
  - Demo TMDB fetch to exercise server cache

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
