# REDO PLAN: Wrapboxd (Letterboxd analytics) + file-based API caching

## Current state / reality check

- The working tree currently only contains `README.md`. It references `WRAPBOXD_PLAN.md`, `index.html`, and an `example/` folder, but those files are not present in the repo at `HEAD`.
- The plan below assumes we are **rebuilding the project from scratch** in a clean, minimal, vanilla-JS way, while keeping the original idea: **client-side Letterboxd analytics** with optional TMDB enrichment.

## Goals

- **No backend** for user data ingestion and analytics (all local in the browser).
- **API response caching to a committed file** so repeated development/testing gradually eliminates network calls.
- **Vanilla JS** first (plain HTML + ES modules). Keep tooling optional/minimal.
- **Deterministic, reviewable cache**: small JSON files in the repo with stable keys, so diffs are meaningful in PRs.

## Non-goals (for now)

- Multi-user “shared cache” at runtime. Without a backend, a browser cache (IndexedDB/localStorage) is per-device and cannot be “cross-user”.
- Perfect parity with every Letterboxd export variant on day 1.
- Full UI polish; first ensure correctness and caching flow.

## Proposed architecture (no backend, optional Node scripts)

### Runtime (browser) components

- **Static site**: `index.html` + `src/` ES modules.
- **Data ingestion**: user uploads Letterboxd export ZIP (or selects CSV files).
  - Parse relevant CSVs (`diary.csv`, `ratings.csv`, `reviews.csv`, etc. depending on export contents).
  - Normalize into a single internal model (films, watches, ratings, dates).
- **Analytics engine**: pure functions producing aggregates for charts/tables.
- **UI**: simple components (vanilla DOM), D3 optional for charts if we want.

### API enrichment (TMDB) with “cache-first” flow

At runtime, enrichment should behave like:

1. Load committed cache file(s) from the repo (e.g. `cache/tmdb.v1.json`).
2. For each needed TMDB request, compute a **cache key** (stable, human-reviewable).
3. If cache hit: return cached payload, no network.
4. If cache miss:
   - If an API key is configured locally, fetch from TMDB, then store in an **in-memory + local persistent cache** for this browser session/device.
   - Mark the entry as “new” so it can be exported back into a file for committing.
5. Provide a **one-click “Export cache updates”** button that downloads a JSON file containing only new entries (or a merged full cache).
   - Dev workflow: run the app, click export, add the updated cache file to git.

This meets the requirement “cached into a file that we can add into GitHub” without a backend (browsers can’t silently write to the repo; they can only download a file the developer commits).

### Optional: “cache warmer” script (recommended)

To speed up cache growth and reduce manual browsing, add a Node script that:

- Reads a list of movies (Letterboxd IDs/IMDB IDs/TMDB IDs) from a local input file.
- Fetches TMDB data and writes/merges it into `cache/tmdb.v1.json`.
- Never runs as a server; it’s a one-shot command (`node scripts/warm-cache.mjs`).

This keeps the project “no backend” while still generating a committed cache deterministically.

## Caching design details

### What gets cached

Cache only responses that are:

- **Public and stable** enough to commit (e.g., movie metadata, credits, genres, runtime).
- Not user-specific and not secret-bearing.

Do **not** cache:

- Anything involving secrets, tokens, or personal user data.
- Full raw Letterboxd export contents (unless explicitly desired later).

### Cache key strategy

Use explicit versioned keys to prevent ambiguity and allow schema upgrades:

- Example key format:
  - `tmdb:v3:movie:{tmdbId}`
  - `tmdb:v3:movie:{tmdbId}:credits`
  - `tmdb:v3:configuration` (if needed)

Include a top-level cache schema version:

- `cacheSchemaVersion: 1`
- `generatedAt`, `source`, and minimal metadata

### File layout (committed)

- `cache/`
  - `tmdb.v1.json` (primary committed cache)
  - `tmdb.v1.delta.json` (optional, for incremental PRs; can be merged later)

Keep caches sorted by key so diffs are stable:

- Sort keys lexicographically on write/merge.
- Normalize JSON formatting (2 spaces, newline at EOF).

### Handling API keys safely

- **Never commit API keys**.
- Support local configuration via (choose one):
  - A local `config.local.json` ignored by git, or
  - An environment variable for Node scripts, and/or
  - A UI prompt that stores the key in `localStorage` only.

## Minimal repo structure to rebuild

Proposed:

```
/
  index.html
  src/
    app.js
    letterboxd/
      parseZip.js
      normalize.js
    analytics/
      computeStats.js
    tmdb/
      client.js
      cache.js
      keys.js
  cache/
    tmdb.v1.json
  scripts/               # optional (Node, no server)
    warm-cache.mjs
    merge-cache.mjs
  example/               # optional sample export for dev (small, non-sensitive)
  README.md
  REDO_PLAN.md
```

Tooling (optional):

- If we want zero tooling: open `index.html` directly.
- If we want a tiny dev server for imports/CORS convenience: `npm` + `vite` (still no backend). This is optional; the plan supports both.

## Implementation milestones (order of work)

1. **Repo cleanup + baseline**
   - Replace aspirational README claims with what exists.
   - Add a “run locally” section (file-open or small dev server).

2. **Letterboxd ingestion**
   - ZIP upload, safe extraction (only expected CSVs).
   - CSV parsing and normalization.
   - Show a basic table: total films, watches by month, rating histogram.

3. **Cache subsystem (core)**
   - Define cache schema v1 and key format.
   - Implement “read committed cache file” + “cache-first lookup”.
   - Implement “track new entries” + “export cache updates” download.

4. **TMDB integration (minimal endpoints)**
   - Movie details endpoint for runtime, genres, poster path, release year.
   - Credits endpoint for director.
   - Strict rate limiting + backoff; graceful failures.

5. **Charts + UX**
   - Director/genre/runtime analysis views.
   - Clear “cache status” UI: hits/misses, queued fetches, export button.

6. **Optional Node scripts**
   - `warm-cache.mjs`: fetch + merge into `cache/tmdb.v1.json`.
   - `merge-cache.mjs`: merge exported deltas into the main cache.

7. **Hardening**
   - Validate ZIP contents, file sizes, and CSV headers.
   - Ensure app works without TMDB (fully offline using committed cache only).

## Testing / verification plan

- **Unit tests (lightweight)** for:
  - Cache key generation
  - Cache merge behavior (stable sort, deterministic output)
  - Normalization of CSV rows into the internal model
- **Manual acceptance checks**:
  - Load example ZIP → stats render without network.
  - With TMDB key: first run shows misses + fetches, second run is cache hits.
  - Export cache updates → commit file → subsequent runs avoid those calls.

## Success criteria

- App runs as a static site with no backend.
- API enrichment is **cache-first** and can be reduced to **zero network calls** over time as `cache/tmdb.v1.json` grows.
- Cache files are deterministic, reviewable, and safe to commit (no secrets).

