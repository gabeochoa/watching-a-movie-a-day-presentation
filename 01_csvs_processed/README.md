# 01_csvs_processed/

Outputs of **step 01**: parsing / normalizing the Letterboxd export zip into stable, script-friendly files.

Expected files:

- `parsed.json` — raw rows from `diary.csv` (+ optional `films.csv`, `ratings.csv`, `watched.csv`)
- `films_normalized.json` — unique film list derived from the diary (used for TMDB lookups)
- `summary.json` — small “what’s in here” counts for quick sanity checks

This folder usually contains personal data and should be treated as **local/private**.

