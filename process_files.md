# Processing workflow (single presentation)

We’re focusing on making **one Reveal.js presentation** from:

- a **Letterboxd export zip** (input)
- the **TMDB API** (enrichment)

Folder flow:

1) `raw_data/` (original inputs)
2) `01_csvs_processed/` (parsed + normalized)
3) `02_tmdb_db_info/` (TMDB cache + enrichment outputs)
4) `10_produce_presentation/` (final deck)

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

## Step 10 — produce the presentation (Reveal.js)

Produces:

- `10_produce_presentation/dist-reveal/index.html`
- `10_produce_presentation/dist-reveal/css/*`
- `10_produce_presentation/dist-reveal/js/*`
- `10_produce_presentation/dist-reveal/prompts.md`

Command:

```bash
node scripts/steps/10_produce_presentation.js \
  --parsed 01_csvs_processed/parsed.json \
  --enrichment 02_tmdb_db_info/enrichment_by_film.json \
  --enriched 02_tmdb_db_info/enriched_aggregates.json \
  --out 10_produce_presentation/dist-reveal \
  --title "My Year in Film"
```

Open:

- `10_produce_presentation/dist-reveal/index.html`

---

## Optional: steps that can be done by another AI instead of code

- Write slide copy refinements: use `10_produce_presentation/dist-reveal/prompts.md` as the “brief”.
- Decide which slides to delete/merge: `scripts/lib/slides.js` is very long and currently includes some placeholder slides (we can tighten it once the data pipeline is stable).

