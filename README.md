# Wrapboxd

Client-side Letterboxd analytics with a **portable, cross-user TMDB cache** (no backend).

Right now the repo contains a minimal working skeleton focused on the caching workflow. The full
analytics UI is planned in `REDO_PLAN.md`.

## Run locally

Most browsers block module + JSON fetches over `file://`. Run a tiny static server instead:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000/`.

## Cross-user TMDB caching (what we’re building around)

We support three cache sources in this order:

1. **Portable cache (imported file)**: cross-user sharing. You can send this file to someone else.
2. **Repo cache (committed)**: `cache/tmdb.v1.json` shipped with the app.
3. **Local cache (browser storage)**: convenience per-device.

When a TMDB request happens, the app checks caches first. If missing and you have a local TMDB key,
it fetches from TMDB, stores the response locally, and marks it as “new” so you can export it.

### Share a cache with someone

1. Person A sets a TMDB key in the UI (stored in browser only).
2. Person A clicks “Fetch movie details (cache-first)” a few times (or later: runs the app normally).
3. Person A clicks **Export cache updates (delta)** and sends the downloaded JSON to Person B.
4. Person B clicks **Import** to load the cache file and avoid those API calls.

## TMDB key handling

- Keys are **not committed**.
- The demo UI stores the key in `localStorage` on that device only.
- The client currently uses a bearer token header; it works with TMDB v4 read tokens.

## Repo layout (current)

```
/
  index.html
  src/
    app.js
    ui/dom.js
    tmdb/
      cache.js
      client.js
      keys.js
  cache/
    tmdb.v1.json
  REDO_PLAN.md
```

## TMDB attribution

If/when we ship a public UI, we will include required TMDB attribution per their terms.
