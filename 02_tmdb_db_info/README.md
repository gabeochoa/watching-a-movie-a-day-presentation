# 02_tmdb_db_info/

Outputs of **step 02**: TMDB enrichment + a local cache.

Expected files:

- `cache.sqlite` — SQLite cache of TMDB API responses (so reruns are fast and don’t spam TMDB)
- `enrichment_by_film.json` — mapping of `"<Title> (<Year>)" -> { tmdbId, runtime, releaseYear, genres[], directors[] }`
- `enriched_aggregates.json` — deck-ready aggregates (top genres, top directors, runtime bins, etc.)
- `tmdb_request_stats.json` — how many cache hits/misses happened during enrichment
- `tmdb_cache_stats.json` — cache entry counts + oldest/newest fetch timestamps

This folder is usually local/private.

