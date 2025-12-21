# Wrapboxd - 2025 Movie Year Presentation

## Goal
Transform data into an editorial, magazine-style "Gen Z" deck with ~50 punchy slides about your 2025 movie year.

## Key Constraints
- **Filter to 2025 only** (calendar year)
- **Re-runnable** - presentation generates from JSON data
- **Reveal.js** with Gen Z CSS theme
- **Time stats in raw hours/days** (no work-week comparisons)

---

## Data Analysis Features

### Five-Star Deep Dive
- Directors/genres/decades that appear in your 5-stars
- "What makes a perfect movie for me" pattern analysis

### Controversy Analysis
Scrape Letterboxd for each controversial film:
- Average rating (compare to yours)
- Top 5 popular reviews (what people are saying)
- Your review snippet (from reviews.csv)

Creates slides like:
```
Film: The French Connection (1971)
Me: ★ | Letterboxd: ★★★★
I said: "boring car chase, didn't get it"
They said: [top review snippets]
```

---

## Implementation Steps

### Step 1: Extract Insights
`scripts/extract_insights.js`
- Filter diary to 2025 only
- Five-star analysis (directors, genres, decades)
- Include your reviews from reviews.csv

### Step 2: Scrape Letterboxd
`scripts/scrape_letterboxd_ratings.js`
- For each film (especially controversial ones):
  - Get average rating from film page
  - Get top 5 popular reviews (short excerpts)
- Output: `build/data/controversy.json`

### Step 3: Generate Presentation
`scripts/build_presentation.js`
- Reads all JSON data
- Generates Reveal.js HTML with ~50 slides
- Uses Gen Z CSS theme

---

## Run Order
```bash
node scripts/extract_insights.js
node scripts/scrape_letterboxd_ratings.js  # needs network
node scripts/build_presentation.js
open build/presentation/index.html
```

---

## Slide Structure (~50 slides)

### Opening (5 slides)
1. Title slide
2. Hook: "MORE MOVIES THAN DAYS"
3. The big number
4. Time investment (hours/days)
5. Setup

### The Numbers (8 slides)
6. Total films breakdown
7. Hours = days calculation
8. Films per week pace
9. Busiest month
10. Quietest month
11. Longest streak
12. Longest gap
13. Favorite weekday

### How I Rate (6 slides)
14. Rating distribution chart
15. Most common rating
16. Average rating personality
17. Five-star intro
18. One-star intro
19. Rating summary

### Five-Star Deep Dive (6 slides)
20. "WHAT MAKES A PERFECT MOVIE"
21. Five-star showcase
22. Directors in 5-stars
23. Genres that deliver
24. The pattern summary
25. Near misses

### Hot Takes / Controversy (8 slides)
26. "MY HOT TAKES" intro
27. Underrated pick #1 (your review + their reviews)
28. Underrated pick #2
29. Overrated pick #1 (your review + their reviews)
30. Overrated pick #2
31. Biggest disagreement breakdown
32. Pattern: "What I value that others don't"
33. Controversy summary

### My Taste DNA (6 slides)
34. Genre breakdown
35. Top genre callout
36. Top directors
37. #1 director deep dive
38. Decade breakdown
39. Dominant decade

### Temporal Patterns (5 slides)
40. Monthly viewing chart
41. The spike months
42. Weekend vs weekday
43. First watch of year
44. Most recent watch

### Fun Facts (3 slides)
45. Oldest film watched
46. Longest runtime
47. Most rewatched

### Closing (3 slides)
48. TL;DR summary
49. "THAT'S A WRAP"
50. Questions

---

## Data Files
```
build/data/
  insights.json      # Main analysis + your reviews
  controversy.json   # Avg ratings + top reviews from others
  films.json         # All 2025 films with metadata

build/presentation/
  index.html         # Generated Reveal.js deck
  css/theme.css      # Gen Z theme
```

---

## Scraping Details

For each controversial film, fetch:
- `https://letterboxd.com/film/{slug}/` → average rating
- `https://letterboxd.com/film/{slug}/reviews/by/activity/` → top reviews

Extract from HTML:
- Average rating (the big number on film page)
- Review text snippets (first ~150 chars of top 5)
- Review author usernames
