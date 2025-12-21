<!-- a3ccd323-b8a6-4145-bb9e-0c86bd572a3d 71907ed6-f5f6-4b9f-8e59-3e3defbcd8a2 -->
# Wrapboxd: Editorial Presentation Build

## Goal

Editorial, magazine-style "Gen Z" deck with ~50 punchy slides about your 2025 movie year.

## Key Constraints

- Filter to 2025 only
- Re-runnable from JSON data
- Reveal.js with Gen Z CSS theme

## Data Analysis Features

### Five-Star Deep Dive

- Directors/genres/decades in 5-stars
- "What makes a perfect movie for me" pattern

### Controversy Analysis

Scrape Letterboxd for each controversial film:

- Average rating (compare to yours)
- Top 5 popular reviews (what people are saying)
- Your review snippet (from reviews.csv)

Creates slides like:

- **Film: The French Connection (1971)**
- **Me: ★ | Letterboxd: ★★★★**
- **I said:** "boring car chase, didn't get it"
- **They said:** [top review snippets]

## Implementation Steps

### Step 1: Extract Insights

`scripts/extract_insights.js`

- Filter to 2025
- Five-star analysis
- Include your reviews from reviews.csv

### Step 2: Scrape Letterboxd

`scripts/scrape_letterboxd_ratings.js`

- For each film (especially controversial ones):
  - Get average rating
  - Get top 5 popular reviews (short excerpts)
- Output: `build/data/controversy.json`

### Step 3: Generate Presentation

`scripts/build_presentation.js`

- Reads all JSON data
- Generates Reveal.js HTML

## Slide Structure (~50 slides)

### Opening (5)

1-5. Title, hook, numbers, time, setup

### The Numbers (8)

6-13. Stats, streaks, patterns

### How I Rate (6)

14-19. Distribution, personality

### Five-Star Deep Dive (6)

20-25. Perfect movie analysis

### Hot Takes / Controversy (8) - ENHANCED

26. "MY HOT TAKES" intro
27. Most underrated pick #1 (your review + their reviews)
28. Most underrated pick #2
29. Most overrated pick #1 (your review + their reviews)
30. Most overrated pick #2
31. Biggest single disagreement (full breakdown)
32. Pattern: "What I value that others don't"
33. Controversy summary

### My Taste DNA (6)

34-39. Genres, directors, decades

### Temporal Patterns (5)

40-44. Monthly, weekly, seasonal

### Fun Facts (3)

45-47. Oldest, longest, rewatched

### Closing (3)

48. TL;DR
49. "THAT'S A WRAP"
50. Questions

## Data Files

```
build/data/
  insights.json      # Main analysis + your reviews
  controversy.json   # Avg ratings + top reviews from others
```

## Scraping Details

For each controversial film, fetch:

- `https://letterboxd.com/film/{slug}/` → average rating
- `https://letterboxd.com/film/{slug}/reviews/by/activity/` → top reviews

Extract from HTML:

- Average rating (the big number on film page)
- Review text snippets (first ~100 chars of top 5)
- Review author usernames

Ready to implement?

### To-dos

- [x] Update enrichment.js to capture TMDB poster_path and backdrop_path
- [x] Build poster URL helper and create curated poster lists by category
- [ ] Redesign slides.js with ~50 curated slides organized into story arcs
- [ ] Add controversy analysis (your rating vs TMDB average) slides
- [ ] Create poster gallery slides using real TMDB images
- [ ] Update genz-theme.css for bolder typography and better layouts
- [ ] Add annotation callouts to charts, simplify styling