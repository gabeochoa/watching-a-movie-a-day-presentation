# Wrapboxd — one presentation workflow

This repo is optimized to generate **one Reveal.js presentation** (“my year in film”) from:

- a **Letterboxd export zip**
- optional **TMDB enrichment** (cached locally)

The workflow is folder-based and documented in `process_files.md`.

## Quick start (recommended)

```bash
npm install

# put your Letterboxd export zip at: raw_data/letterboxd-export.zip
cp secrets.example.js secrets.js   # optional, for TMDB

npm run make:presentation
```

Output:

- `10_produce_presentation/dist-reveal/index.html`

## Alternative: run steps manually

See `process_files.md`.

## What You Get

🎬 **Interactive Charts:**
- Rating distribution (1-5 stars)
- Decade breakdown (1920s, 1990s, etc.)
- Monthly viewing patterns
- Genre preferences
- Release year timeline
- Rewatch patterns

📊 **Key Stats:**
- Total films watched
- Average rating
- Number of rewatches
- Most watched genres

🎨 **Beautiful Design:**
- Responsive layout
- Modern charts with D3
- Clean, shareable interface

## How It Works

1. **Privacy-First**: Your data never leaves your computer
2. **Static Generation**: Creates a single HTML file with embedded data
3. **Offline-Ready**: Works without internet once generated
4. **Fast**: No server calls, instant loading

## Technical Details

- **Input**: Letterboxd export ZIP (diary.csv, reviews.csv, etc.)
- **Processing**: Node.js script parses CSV and generates charts
- **Output**: Static site (HTML + JS + embedded data in `data.js`)
- **Dependencies**: D3 (CDN), no build tools required

## Features

### Current Charts
- ⭐ **Rating Distribution**: See your rating patterns
- 📅 **Decade Analysis**: Which eras do you prefer?
- 📈 **Monthly Trends**: When do you watch the most?
- 🎭 **Genre Preferences**: Your favorite film categories
- 📊 **Year Timeline**: Recent releases vs. classics
- 🔄 **Rewatch Patterns**: Which films you return to

### Data Processing
- Handles missing ratings gracefully
- Merges diary and review data
- Extracts genres from tags
- Calculates viewing patterns and statistics

## Notes

- The files in `raw_data/`, `01_csvs_processed/`, and `02_tmdb_db_info/` are intended to be **local/private** (gitignored).
- The final presentation output embeds your data; be mindful before committing/sharing it.

## Development

```bash
# Custom output directory
npm run generate -- --zip my-data.zip --output ./my-analytics

# Help
npm run generate -- --help
```

## Project Structure

```
wrapboxd/
├── scripts/generate.js    # Main generator script
├── dist/                 # Generated site (created)
├── package.json          # Dependencies and scripts
└── README.md            # This file
```

## What’s included in the generated report

- **Core Letterboxd charts**:
  - ratings histogram
  - watches by month
  - release year distribution
  - average rating by month
  - cumulative watches
  - rewatches by month
  - watches by weekday
  - average rating by release year
  - top months / top years (by watches)
- **TMDB-enriched charts (optional)**:
  - top directors
  - genre distribution
  - runtime distribution
  - rating vs runtime (scatter)
  - rating vs release year (scatter)
- **Exports**:
  - analysis JSON
  - config JSON (placeholder)
  - cache stats JSON (generation-time)
  - “export all” ZIP bundle

## Repo layout (current)

```
/
  public/
    index.html
    src/
      app.js
      analytics/compute.js
      charts/d3charts.js
      letterboxd/parseZip.js
      ui/dom.js
  scripts/
    generate.js
    lib/
      db.js            # sqlite cache helpers
      tmdb.js          # cached TMDB client
      secrets.js       # secrets loader
  data/                # sqlite TMDB cache lives here (gitignored)
```

## TMDB attribution

If/when we ship a public UI, we will include required TMDB attribution per their terms.
