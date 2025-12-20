# AI Prompts for Wrapboxd Insights

These prompts can be passed to an AI to generate additional insights for the presentation.
Copy each prompt and ask your favorite AI model.

## Data availability (so the AI doesn’t hallucinate)
- TMDB enrichment enabled: false
- TMDB genres available: false
- TMDB directors available: false
- TMDB runtimes available: false
- Letterboxd tags available: false

## Extra context (from --extras)
```json
{
  "_comment": "Optional manual inputs / presentation context for Wrapboxd. Pass with: node scripts/generate.js --zip export.zip --extras extras.json -o dist-reveal",
  "presentation": {
    "audience": "coworkers",
    "context": "An end-of-year fun show-and-tell: my Letterboxd year in review."
  },
  "voice": {
    "vibe": "punchy, Gen-Z, self-aware",
    "boundaries": [
      "keep it playful, not mean",
      "no spoilers"
    ]
  },
  "manual": {
    "favoriteGenre": "Drama",
    "topDirector": {
      "name": "Greta Gerwig",
      "filmsWatched": 3
    },
    "hotTakes": [
      "I’m a 3.5-star maximalist.",
      "Long movies have to earn it."
    ],
    "superlatives": [
      "Most Likely to Cry at a Coming-of-Age",
      "Certified Rewatch Enjoyer"
    ]
  }
}
```


---

## Personality & Taste Analysis

### Prompt 1: Movie Personality Profile
Based on these movie watching stats, write a fun, Gen-Z style "movie personality profile" in 2-3 sentences:
- Total watches: 12
- Total unique films: 12
- Average rating: 3.75
- Most common rating: 4 stars
- Rewatches: 1 (8%)
- Busiest month: 2025-03 (4)
- Favorite weekday: Fri (4)
- Weekend share: 33%
- Longest streak: 1 days
- Biggest gap: 18 days

- Top director (manual): Greta Gerwig

---

### Prompt 2: Watching Pattern Insight
Analyze my watching patterns and give me one surprising insight in a punchy, social-media-ready sentence:
- Films by month: [{"yearMonth":"2025-01","count":3},{"yearMonth":"2025-02","count":2},{"yearMonth":"2025-03","count":4},{"yearMonth":"2025-04","count":3}]
- Films by weekday: [{"weekday":"Sun","count":2},{"weekday":"Mon","count":0},{"weekday":"Tue","count":1},{"weekday":"Wed","count":1},{"weekday":"Thu","count":2},{"weekday":"Fri","count":4},{"weekday":"Sat","count":2}]
- Busiest month had 4 films
- Quietest month: 2025-02 (2)
- Longest streak: 1 days
- Biggest gap: 18 days
- Weekend share: 33%
- Top rewatches: []

---

### Prompt 3: Rating Style Analysis
Based on this rating distribution, describe my rating style in one memorable phrase (like "the generous critic" or "hard to impress"):
[{"rating":2,"count":1},{"rating":3,"count":3},{"rating":4,"count":6},{"rating":5,"count":2}]

---


## Genre & Director Analysis

### Prompt 4: Genre Identity
Based on these genre stats, give me a fun "genre identity" (like "certified drama queen" or "action junkie"):
{"note":"No TMDB genre data and no Letterboxd tags found. Use --extras manual.favoriteGenre to provide a favorite genre."}

Manual favorite genre (extras): Drama

---

### Prompt 5: Director Relationship
Describe my relationship with my top director in one sentence, as if they were a person I'm dating:
Top director: Greta Gerwig
Films watched: 3

Note: Directors require TMDB enrichment. To enable: set TMDB_BEARER_TOKEN (or TMDB_API_KEY) and rerun without --no-tmdb, or provide --extras manual.topDirector.

---

### Prompt 6: Hot Takes
Based on the general perception of these genres and my watch counts, write 2-3 "hot takes" I might have about movies:
{"note":"No genre inputs available. Use --extras manual.hotTakes to provide seed takes."}

Manual hot takes (extras):
- I’m a 3.5-star maximalist.
- Long movies have to earn it.

---


## Fun Comparisons

### Prompt 7: Time Equivalents
I watched approximately 22 hours of movies. Write 5 fun comparisons of what else I could have done with that time (keep it playful, not judgmental).

---

### Prompt 8: Movie Superlatives
Based on all this data, give me 5 fun "superlatives" like yearbook awards (e.g., "Most Likely to Cry at Pixar", "Champion of 3-Hour Movies"):
{"avgRating":3.75,"totalFilms":12,"rewatchPct":8,"busiestMonth":"2025-03","topWeekday":"Fri","longestStreakDays":1}

Manual superlatives (extras):
- Most Likely to Cry at a Coming-of-Age
- Certified Rewatch Enjoyer

---

### Prompt 9: Next Year Predictions
Based on my 2025 watching patterns, make 3 predictions for next year in a fun, horoscope-style format:
- This year: 12 films
- Favorite genre: Drama
- Rating tendency: 3.8 average

---

### Prompt 10: Presentation Opener
Write a punchy, confident 2-sentence opener I can use when presenting this to coworkers. Make it self-aware and slightly self-deprecating about being a movie nerd.

Audience: coworkers

Context: An end-of-year fun show-and-tell: my Letterboxd year in review.

---

## Specific Film Insights

### Prompt 11: Five-Star Analysis
I gave these films 5 stars: 
- Example Movie C (1982)
- Example Movie I (1995)

What do these films have in common? Give me one insight about my taste.

---

### Prompt 12: Controversial Picks
Write a "controversial opinion" style statement about my movie taste that I could use in the presentation, based on:
- Top genre: Drama
- Average rating: 3.8
- Total films: 12

---
