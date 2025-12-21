# Processing workflow (single presentation)

We’re focusing on making **one Reveal.js presentation** from:

- a **Letterboxd export zip** (input)
- the **TMDB API** (enrichment)

Folder flow:

1) `raw_data/` (original inputs)
2) `01_csvs_processed/` (parsed + normalized)
3) `02_tmdb_db_info/` (TMDB cache + enrichment outputs)
4) `build/presentation/` (final deck — **manual/frozen**)

---

## Prereqs

```bash
npm install
```

If you want TMDB enrichment, create `secrets.js` from `secrets.example.js` (or use env vars):

```bash
cp secrets.example.js secrets.js
# edit secrets.js and set TMDB_BEARER_TOKEN (preferred) or TMDB_API_KEY
```

---

## Step 0 — put the zip in place

Put your Letterboxd export zip here:

- `raw_data/letterboxd-export.zip`

This workflow intentionally does **not** support any other input format.

---

## Step 01 — parse the zip → JSON artifacts

Produces:

- `01_csvs_processed/parsed.json`
- `01_csvs_processed/films_normalized.json`
- `01_csvs_processed/summary.json`

Command:

```bash
node scripts/steps/01_parse_letterboxd_zip.js \
  --zip raw_data/letterboxd-export.zip \
  --out 01_csvs_processed
```

---

## Step 02 — TMDB enrichment (cached) → enrichment artifacts

Produces:

- `02_tmdb_db_info/cache.sqlite`
- `02_tmdb_db_info/enrichment_by_film.json`
- `02_tmdb_db_info/enriched_aggregates.json`
- `02_tmdb_db_info/tmdb_request_stats.json`
- `02_tmdb_db_info/tmdb_cache_stats.json`

Command:

```bash
node scripts/steps/02_enrich_tmdb.js \
  --in 01_csvs_processed/parsed.json \
  --cache-dir 02_tmdb_db_info \
  --out 02_tmdb_db_info \
  --concurrency 3
```

Notes:

- If you rerun step 02, most calls should become cache hits.
- You can set `TMDB_CACHE_TTL_DAYS=30` (or similar) to periodically refresh.

---

## Step 10 — presentation

The presentation in `build/presentation/` is now **manually edited and frozen**.

- Do **not** run any slide generators that overwrite `build/presentation/`.
- Open: `build/presentation/index.html`

---

## Optional: steps that can be done by another AI instead of code

- Write slide copy refinements directly in the frozen deck (`build/presentation/`).

