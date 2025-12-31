# AI Prompts for Wrapboxd Insights

These prompts can be passed to an AI to generate additional insights for the presentation.
Copy each prompt and ask your favorite AI model.

## Data availability (so the AI doesn’t hallucinate)
- TMDB enrichment enabled: true
- TMDB genres available: true
- TMDB directors available: true
- TMDB runtimes available: true
- Letterboxd tags available: false



---

## Personality & Taste Analysis

### Prompt 1: Movie Personality Profile
Based on these movie watching stats, write a fun, Gen-Z style "movie personality profile" in 2-3 sentences:
- Total watches: 509
- Total unique films: 498
- Average rating: 3.36
- Most common rating: 3 stars
- Rewatches: 50 (10%)
- Busiest month: 2025-11 (66)
- Favorite weekday: Sun (110)
- Weekend share: 41%
- Longest streak: 11 days
- Biggest gap: 43 days
- Top genres (TMDB): Drama, Comedy, Romance, Thriller, Action
- Top directors (TMDB): Wes Anderson, Steven Spielberg, Hayao Miyazaki, Paul Thomas Anderson, Steven Soderbergh

---

### Prompt 2: Watching Pattern Insight
Analyze my watching patterns and give me one surprising insight in a punchy, social-media-ready sentence:
- Films by month: [{"yearMonth":"2025-07","count":30},{"yearMonth":"2025-08","count":30},{"yearMonth":"2025-09","count":25},{"yearMonth":"2025-10","count":29},{"yearMonth":"2025-11","count":66},{"yearMonth":"2025-12","count":54}]
- Films by weekday: [{"weekday":"Sun","count":110},{"weekday":"Mon","count":66},{"weekday":"Tue","count":51},{"weekday":"Wed","count":62},{"weekday":"Thu","count":51},{"weekday":"Fri","count":70},{"weekday":"Sat","count":99}]
- Busiest month had 66 films
- Quietest month: 2024-09 (11)
- Longest streak: 11 days
- Biggest gap: 43 days
- Weekend share: 41%
- Top rewatches: [{"film":"A Charlie Brown Christmas (1965)","count":2},{"film":"A Few Good Men (1992)","count":2},{"film":"Love Actually (2003)","count":2},{"film":"The Sound of Music (1965)","count":2},{"film":"13 Hours: The Secret Soldiers of Benghazi (2016)","count":1},{"film":"27 Dresses (2008)","count":1},{"film":"Arrival (2016)","count":1},{"film":"Bridge of Spies (2015)","count":1},{"film":"Challengers (2024)","count":1},{"film":"Crazy Rich Asians (2018)","count":1}]

---

### Prompt 3: Rating Style Analysis
Based on this rating distribution, describe my rating style in one memorable phrase (like "the generous critic" or "hard to impress"):
[{"rating":1,"count":12},{"rating":2,"count":64},{"rating":3,"count":207},{"rating":4,"count":168},{"rating":5,"count":50}]

---


## Genre & Director Analysis

### Prompt 4: Genre Identity
Based on these genre stats, give me a fun "genre identity" (like "certified drama queen" or "action junkie"):
[{"name":"Drama","count":239},{"name":"Comedy","count":224},{"name":"Romance","count":125},{"name":"Thriller","count":93},{"name":"Action","count":77},{"name":"Crime","count":63},{"name":"Adventure","count":53},{"name":"Family","count":38},{"name":"Science Fiction","count":37},{"name":"Mystery","count":33}]


---

### Prompt 5: Director Relationship
Describe my relationship with my top director in one sentence, as if they were a person I'm dating:
Top director: Wes Anderson
Films watched: 10


---

### Prompt 6: Hot Takes
Based on the general perception of these genres and my watch counts, write 2-3 "hot takes" I might have about movies:
[{"name":"Drama","count":239},{"name":"Comedy","count":224},{"name":"Romance","count":125},{"name":"Thriller","count":93},{"name":"Action","count":77},{"name":"Crime","count":63},{"name":"Adventure","count":53},{"name":"Family","count":38}]


---


## Fun Comparisons

### Prompt 7: Time Equivalents
I watched approximately 950 hours of movies. Write 5 fun comparisons of what else I could have done with that time (keep it playful, not judgmental).

---

### Prompt 8: Movie Superlatives
Based on all this data, give me 5 fun "superlatives" like yearbook awards (e.g., "Most Likely to Cry at Pixar", "Champion of 3-Hour Movies"):
{"avgRating":3.3592814371257487,"totalFilms":498,"rewatchPct":10,"topGenres":["Drama","Comedy","Romance"],"avgRuntime":112,"busiestMonth":"2025-11","topWeekday":"Sun","longestStreakDays":11}


---

### Prompt 9: Next Year Predictions
Based on my 2025 watching patterns, make 3 predictions for next year in a fun, horoscope-style format:
- This year: 498 films
- Favorite genre: Drama
- Rating tendency: 3.4 average

---

### Prompt 10: Presentation Opener
Write a punchy, confident 2-sentence opener I can use when presenting this to coworkers. Make it self-aware and slightly self-deprecating about being a movie nerd.



---

## Specific Film Insights

### Prompt 11: Five-Star Analysis
I gave these films 5 stars: 
- Spirited Away (2001)
- School of Rock (2003)
- (500) Days of Summer (2009)
- Top Gun: Maverick (2022)
- A Few Good Men (1992)
- Dead Poets Society (1989)
- The Sound of Music (1965)
- Good Will Hunting (1997)
- tick, tick... BOOM! (2021)
- A Charlie Brown Christmas (1965)
- Grease (1978)
- La La Land (2016)
- Superbad (2007)
- Ferris Bueller's Day Off (1986)
- One Week (1920)
- Big (1988)
- Fire of Love (2022)
- Ocean's Eleven (2001)
- Monsters, Inc. (2001)
- Freedom Writers (2007)
- The Double (2013)
- The Ballad of Wallis Island (2025)
- Arrival (2016)
- Scott Pilgrim vs. the World (2010)
- Rushmore (1998)

What do these films have in common? Give me one insight about my taste.

---

### Prompt 12: Controversial Picks
Write a "controversial opinion" style statement about my movie taste that I could use in the presentation, based on:
- Top genre: Drama
- Average rating: 3.4
- Total films: 498

---
