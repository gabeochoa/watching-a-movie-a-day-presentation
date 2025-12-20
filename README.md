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

### Minify for deployment

```bash
npm run generate -- --zip my-data.zip --output dist --minify
```

You can also generate the committed example output:

```bash
npm run generate -- --example --output dist
```

### 2b. (Optional) Enable TMDB enrichment + caching

TMDB enrichment runs **during generation** (never in the browser) and is cached locally so repeated generator runs don’t spam the API.

```bash
cp secrets.example.js secrets.js
# edit secrets.js and set either TMDB_BEARER_TOKEN or TMDB_API_KEY
```

Cache details:

- **SQLite cache**: `data/cache.sqlite` (gitignored)
- **Cache keys**: stable per TMDB endpoint + sorted query params
- **TTL**: optional via `TMDB_CACHE_TTL_DAYS` (default: never expire)

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

## Future Enhancements

- TMDB integration for richer metadata
- More chart types (directors, actors, franchises)
- Advanced analytics (binge patterns, mood analysis)
- Custom time period filtering
- Social sharing features

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
