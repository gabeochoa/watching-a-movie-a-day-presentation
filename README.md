# Wrapboxd - Static Site Generator

Generate beautiful, interactive movie analytics from your Letterboxd data. **No servers, no uploads** - just a static HTML file that works offline.

## Quick Start

### 1. Export your Letterboxd data

1. Go to [Letterboxd Settings → Import & Export](https://letterboxd.com/settings/data/)
2. Click "Export your data"
3. Download the ZIP file when ready

### 2. Generate your site

```bash
# Install dependencies
npm install

# Generate your personal movie analytics site
npm run generate -- --zip path/to/your-letterboxd-export.zip

# Or specify custom output directory
npm run generate -- --zip my-data.zip --output my-site
```

### 3. View your analytics

Open `dist/index.html` in any web browser - works completely offline!

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
- Modern charts with Chart.js
- Clean, shareable interface

## How It Works

1. **Privacy-First**: Your data never leaves your computer
2. **Static Generation**: Creates a single HTML file with embedded data
3. **Offline-Ready**: Works without internet once generated
4. **Fast**: No server calls, instant loading

## Technical Details

- **Input**: Letterboxd export ZIP (diary.csv, reviews.csv, etc.)
- **Processing**: Node.js script parses CSV and generates charts
- **Output**: Single HTML file with embedded Chart.js visualizations
- **Dependencies**: Chart.js (CDN), no build tools required

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

## Future Enhancements

- TMDB integration for richer metadata
- More chart types (directors, actors, franchises)
- Advanced analytics (binge patterns, mood analysis)
- Custom time period filtering
- Social sharing features

## Development

```bash
# Test with sample data
npm run generate -- --zip example/letterboxd-choicehoney-2025-12-20-17-50-utc.zip

# Custom output directory
npm run generate -- --zip my-data.zip --output ./my-analytics

# Help
npm run generate -- --help
```

## Project Structure

```
wrapboxd/
├── scripts/generate.js    # Main generator script
├── example/              # Sample Letterboxd data
├── dist/                 # Generated site (created)
├── package.json          # Dependencies and scripts
└── README.md            # This file
```

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
