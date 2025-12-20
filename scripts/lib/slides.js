/**
 * Wrapboxd Slide Generator
 * 
 * Generates reveal.js slide HTML from Letterboxd/TMDB data.
 * Follows the Gen Z presentation style guidelines.
 * First-person voice for presenting to others.
 */

// Placeholder poster images by genre (using picsum for variety)
const POSTER_PLACEHOLDERS = {
  default: 'https://picsum.photos/seed/movie/400/600',
  drama: 'https://picsum.photos/seed/drama/400/600',
  comedy: 'https://picsum.photos/seed/comedy/400/600',
  action: 'https://picsum.photos/seed/action/400/600',
  horror: 'https://picsum.photos/seed/horror/400/600',
  scifi: 'https://picsum.photos/seed/scifi/400/600',
  romance: 'https://picsum.photos/seed/romance/400/600',
  thriller: 'https://picsum.photos/seed/thriller/400/600',
};

// Per STYLE_GUIDE.md: mostly black/white, one accent moment per slide.
const SECTION_BG_COLORS = ["black", "black", "black", "accent", "black", "black", "black", "black"];
let sectionBgIndex = 0;

/**
 * Generate all slides for the presentation
 * @param {Object} data - The computed data payload
 * @returns {string} HTML string of all slides
 */
export function generateSlides(data) {
  const slides = [];
  const year = new Date().getFullYear();
  
  // ==========================================
  // INTRO SECTION
  // ==========================================
  slides.push(titleSlide(data));
  slides.push(introSlide(data));
  
  // ==========================================
  // THE NUMBERS - Overview Stats
  // ==========================================
  slides.push(sectionDivider('THE NUMBERS'));
  slides.push(totalFilmsSlide(data));
  slides.push(totalWatchesSlide(data));
  slides.push(avgRatingSlide(data));
  slides.push(rewatchesSlide(data));
  slides.push(uniqueVsRewatchSlide(data));
  slides.push(estimatedHoursSlide(data));
  slides.push(filmsPerWeekSlide(data));
  slides.push(filmsPerMonthSlide(data));
  
  // ==========================================
  // HOW I RATE - Rating Analysis
  // ==========================================
  slides.push(sectionDivider('HOW I RATE'));
  slides.push(ratingsChartSlide(data));
  slides.push(ratingPersonalitySlide(data));
  slides.push(ratingDistributionBreakdownSlide(data));
  slides.push(fiveStarFilmsSlide(data));
  slides.push(oneStarFilmsSlide(data));
  slides.push(ratingConsistencySlide(data));
  slides.push(avgRatingByMonthSlide(data));
  slides.push(ratingByWeekdaySlide(data));
  
  // ==========================================
  // WHEN I WATCH - Temporal Patterns
  // ==========================================
  slides.push(sectionDivider('WHEN I WATCH'));
  slides.push(watchesByMonthSlide(data));
  slides.push(busiestMonthSlide(data));
  slides.push(quietestMonthSlide(data));
  slides.push(weekdaySlide(data));
  slides.push(weekendVsWeekdaySlide(data));
  slides.push(cumulativeSlide(data));
  slides.push(watchingStreaksSlide(data));
  slides.push(biggestGapSlide(data));
  slides.push(seasonalPatternSlide(data));
  
  // ==========================================
  // WHAT I WATCH - Content Analysis
  // ==========================================
  slides.push(sectionDivider('WHAT I WATCH'));
  slides.push(releaseYearsSlide(data));
  slides.push(dominantDecadeSlide(data));
  slides.push(oldestFilmSlide(data));
  slides.push(newestFilmSlide(data));
  slides.push(newReleasesVsCatalogSlide(data));
  slides.push(releaseYearTrendSlide(data));
  
  // ==========================================
  // MY TASTE - TMDB-enriched slides
  // ==========================================
  if (data.enrichedAll) {
    slides.push(sectionDivider('MY TASTE'));
    
    // Genres
    if (data.enrichedAll.topGenres?.length) {
      slides.push(genresSlide(data));
      slides.push(topGenreSlide(data));
      slides.push(genreBreakdownSlide(data));
      slides.push(genreRatingsSlide(data));
      slides.push(unexpectedGenresSlide(data));
    }
    
    // Directors
    if (data.enrichedAll.topDirectors?.length) {
      slides.push(sectionDivider('MY DIRECTORS'));
      slides.push(topDirectorSlide(data));
      slides.push(directorsSlide(data));
      slides.push(directorLoyaltySlide(data));
      slides.push(oneHitDirectorsSlide(data));
      slides.push(directorDiscoverySlide(data));
    }
    
    // Runtime
    if (data.enrichedAll.runtimeBins?.length) {
      slides.push(sectionDivider('MY ATTENTION SPAN'));
      slides.push(runtimeSlide(data));
      slides.push(avgRuntimeSlide(data));
      slides.push(longestFilmsSlide(data));
      slides.push(shortestFilmsSlide(data));
      slides.push(runtimeByRatingSlide(data));
    }
  }
  
  // ==========================================
  // DEEP DIVES - Interesting Analysis
  // ==========================================
  slides.push(sectionDivider('DEEP DIVES'));
  slides.push(firstWatchSlide(data));
  slides.push(lastWatchSlide(data));
  slides.push(mostRatedSlide(data));
  slides.push(ratingTrendsSlide(data));
  slides.push(monthlyRatingsHeatmapSlide(data));
  
  // TMDB comparison slides
  if (data.enrichedAll) {
    slides.push(sectionDivider('HOT TAKES'));
    slides.push(controversialRatingsSlide(data));
    slides.push(underratedPicksSlide(data));
    slides.push(overratedPicksSlide(data));
    slides.push(agreementScoreSlide(data));
  }
  
  // ==========================================
  // FUN FACTS
  // ==========================================
  slides.push(sectionDivider('FUN FACTS'));
  slides.push(randomFactsSlide(data));
  slides.push(movieMathSlide(data));
  slides.push(ifIWatchedSlide(data));
  slides.push(equivalentToSlide(data));
  
  // ==========================================
  // TOP PICKS - Poster Gallery
  // ==========================================
  slides.push(sectionDivider('TOP PICKS'));
  slides.push(topRatedGallerySlide(data));
  slides.push(recentFavoritesSlide(data));
  
  // ==========================================
  // LOOKING AHEAD
  // ==========================================
  slides.push(sectionDivider('LOOKING AHEAD'));
  slides.push(predictionsSlide(data));
  slides.push(goalsSlide(data));
  
  // ==========================================
  // CLOSING
  // ==========================================
  slides.push(summarySlide(data));
  slides.push(closingSlide(data));
  
  return slides.join('\n');
}

/**
 * Generate AI prompts for deeper insights
 */
export function generateAIPrompts(data) {
  const prompts = [];
  const counts = data.computedAll?.counts || {};
  const series = data.computedAll?.series || {};
  const diary = data.parsed?.diary || [];
  const enriched = data.enrichedAll || null;
  const extras = data.extras || null;

  const hasGenres = Boolean(enriched?.topGenres?.length);
  const hasDirectors = Boolean(enriched?.topDirectors?.length);
  const hasRuntime = Boolean(enriched?.runtimeBins?.some((b) => (b?.count || 0) > 0));

  const topTags = getTopTags(diary, 10);
  const hasTags = topTags.length > 0;

  const busiestMonth = getBusiestMonth(series.watchesByMonth || []);
  const quietestMonth = getQuietestMonth(series.watchesByMonth || []);
  const topWeekday = getTopWeekday(series.watchesByWeekday || []);
  const weekendSharePct = getWeekendSharePct(series.watchesByWeekday || []);
  const longestStreakDays = calculateLongestStreak(diary);
  const biggestGapDays = calculateBiggestGap(diary);
  const topRewatches = getTopRewatchedFilms(diary, 10);
  
  prompts.push(`# AI Prompts for Wrapboxd Insights

These prompts can be passed to an AI to generate additional insights for the presentation.
Copy each prompt and ask your favorite AI model.

## Data availability (so the AI doesn’t hallucinate)
- TMDB enrichment enabled: ${Boolean(data?.meta?.tmdbEnabled)}
- TMDB genres available: ${hasGenres}
- TMDB directors available: ${hasDirectors}
- TMDB runtimes available: ${hasRuntime}
- Letterboxd tags available: ${hasTags}

${extras ? `## Extra context (from --extras)
\`\`\`json
${JSON.stringify(extras, null, 2)}
\`\`\`
` : ''}

---

## Personality & Taste Analysis

### Prompt 1: Movie Personality Profile
Based on these movie watching stats, write a fun, Gen-Z style "movie personality profile" in 2-3 sentences:
- Total watches: ${counts.watches || 0}
- Total unique films: ${counts.uniqueFilms || 0}
- Average rating: ${counts.avgRating?.toFixed(2) || 'N/A'}
- Most common rating: ${getMostCommonRating(series.ratingsHistogram)}
- Rewatches: ${counts.rewatches || 0} (${Math.round((counts.rewatches || 0) / (counts.watches || 1) * 100)}%)
- Busiest month: ${busiestMonth ? `${busiestMonth.yearMonth} (${busiestMonth.count})` : 'N/A'}
- Favorite weekday: ${topWeekday ? `${topWeekday.weekday} (${topWeekday.count})` : 'N/A'}
- Weekend share: ${weekendSharePct != null ? `${weekendSharePct}%` : 'N/A'}
- Longest streak: ${longestStreakDays} days
- Biggest gap: ${biggestGapDays} days
${hasGenres ? `- Top genres (TMDB): ${enriched.topGenres.slice(0, 5).map((g) => g.name).join(', ')}` : (hasTags ? `- Top tags (Letterboxd): ${topTags.slice(0, 5).map((t) => t.name).join(', ')}` : '')}
${hasDirectors ? `- Top directors (TMDB): ${enriched.topDirectors.slice(0, 5).map((d) => d.name).join(', ')}` : (extras?.manual?.topDirector?.name ? `- Top director (manual): ${extras.manual.topDirector.name}` : '')}

---

### Prompt 2: Watching Pattern Insight
Analyze my watching patterns and give me one surprising insight in a punchy, social-media-ready sentence:
- Films by month: ${JSON.stringify(series.watchesByMonth?.slice(-6) || [])}
- Films by weekday: ${JSON.stringify(series.watchesByWeekday || [])}
- Busiest month had ${Math.max(...(series.watchesByMonth?.map(m => m.count) || [0]))} films
- Quietest month: ${quietestMonth ? `${quietestMonth.yearMonth} (${quietestMonth.count})` : 'N/A'}
- Longest streak: ${longestStreakDays} days
- Biggest gap: ${biggestGapDays} days
- Weekend share: ${weekendSharePct != null ? `${weekendSharePct}%` : 'N/A'}
- Top rewatches: ${JSON.stringify(topRewatches)}

---

### Prompt 3: Rating Style Analysis
Based on this rating distribution, describe my rating style in one memorable phrase (like "the generous critic" or "hard to impress"):
${JSON.stringify(series.ratingsHistogram || [])}

---

`);

  // Genre & director prompts only if we have usable inputs.
  // If TMDB is missing, we fall back to Letterboxd tags or extras.
  if (hasGenres || hasDirectors || hasTags || extras?.manual?.favoriteGenre || extras?.manual?.topDirector) {
    prompts.push(`## Genre & Director Analysis

### Prompt 4: Genre Identity
Based on these genre stats, give me a fun "genre identity" (like "certified drama queen" or "action junkie"):
${hasGenres
  ? JSON.stringify(enriched.topGenres.slice(0, 10))
  : (hasTags
    ? JSON.stringify(topTags)
    : JSON.stringify({ note: "No TMDB genre data and no Letterboxd tags found. Use --extras manual.favoriteGenre to provide a favorite genre." }))}
${extras?.manual?.favoriteGenre ? `\nManual favorite genre (extras): ${extras.manual.favoriteGenre}` : ''}

---

### Prompt 5: Director Relationship
Describe my relationship with my top director in one sentence, as if they were a person I'm dating:
Top director: ${hasDirectors ? (enriched.topDirectors?.[0]?.name || 'Unknown') : (extras?.manual?.topDirector?.name || 'Unknown')}
Films watched: ${hasDirectors ? (enriched.topDirectors?.[0]?.count || 0) : (extras?.manual?.topDirector?.filmsWatched || 0)}
${!hasDirectors ? `\nNote: Directors require TMDB enrichment. To enable: set TMDB_BEARER_TOKEN (or TMDB_API_KEY) and rerun without --no-tmdb, or provide --extras manual.topDirector.` : ''}

---

### Prompt 6: Hot Takes
Based on the general perception of these genres and my watch counts, write 2-3 "hot takes" I might have about movies:
${hasGenres
  ? JSON.stringify(enriched.topGenres.slice(0, 8))
  : (hasTags
    ? JSON.stringify(topTags.slice(0, 8))
    : JSON.stringify({ note: "No genre inputs available. Use --extras manual.hotTakes to provide seed takes." }))}
${extras?.manual?.hotTakes?.length ? `\nManual hot takes (extras):\n- ${extras.manual.hotTakes.join('\n- ')}` : ''}

---

`);
  }

  prompts.push(`## Fun Comparisons

### Prompt 7: Time Equivalents
I watched approximately ${estimateHours(data)} hours of movies. Write 5 fun comparisons of what else I could have done with that time (keep it playful, not judgmental).

---

### Prompt 8: Movie Superlatives
Based on all this data, give me 5 fun "superlatives" like yearbook awards (e.g., "Most Likely to Cry at Pixar", "Champion of 3-Hour Movies"):
${JSON.stringify({
  avgRating: counts.avgRating,
  totalFilms: counts.uniqueFilms,
  rewatchPct: Math.round((counts.rewatches || 0) / (counts.watches || 1) * 100),
  topGenres: hasGenres
    ? enriched.topGenres.slice(0, 3).map((g) => g.name)
    : (hasTags ? topTags.slice(0, 3).map((t) => t.name) : undefined),
  avgRuntime: hasRuntime ? getAvgRuntime(enriched.runtimeBins) : undefined,
  busiestMonth: busiestMonth?.yearMonth,
  topWeekday: topWeekday?.weekday,
  longestStreakDays,
})}
${extras?.manual?.superlatives?.length ? `\nManual superlatives (extras):\n- ${extras.manual.superlatives.join('\n- ')}` : ''}

---

### Prompt 9: Next Year Predictions
Based on my ${new Date().getFullYear()} watching patterns, make 3 predictions for next year in a fun, horoscope-style format:
- This year: ${counts.uniqueFilms} films
- Favorite genre: ${hasGenres ? (enriched.topGenres?.[0]?.name || 'Unknown') : (extras?.manual?.favoriteGenre || (hasTags ? topTags?.[0]?.name : 'Unknown'))}
- Rating tendency: ${counts.avgRating?.toFixed(1) || 'N/A'} average

---

### Prompt 10: Presentation Opener
Write a punchy, confident 2-sentence opener I can use when presenting this to coworkers. Make it self-aware and slightly self-deprecating about being a movie nerd.
${extras?.presentation?.audience ? `\nAudience: ${extras.presentation.audience}` : ''}
${extras?.presentation?.context ? `\nContext: ${extras.presentation.context}` : ''}

---

## Specific Film Insights

### Prompt 11: Five-Star Analysis
I gave these films 5 stars: 
${getFiveStarFilmsUnique(diary, 25).map((f) => `- ${f.Name} (${f.Year})`).join('\n') || 'None'}

What do these films have in common? Give me one insight about my taste.

---

### Prompt 12: Controversial Picks
Write a "controversial opinion" style statement about my movie taste that I could use in the presentation, based on:
- Top genre: ${hasGenres ? (enriched.topGenres?.[0]?.name || 'Unknown') : (extras?.manual?.favoriteGenre || (hasTags ? topTags?.[0]?.name : 'Unknown'))}
- Average rating: ${counts.avgRating?.toFixed(1) || '3.5'}
- Total films: ${counts.uniqueFilms || 0}

---
`);

  return prompts.join('\n');
}

// ==========================================
// SLIDE GENERATORS
// ==========================================

function titleSlide(data) {
  const year = new Date().getFullYear();
  const filmCount = data.computedAll?.counts?.uniqueFilms || '???';
  
  return `
<section class="slide-title bg-noise" data-background-color="black"
  data-background-image="https://picsum.photos/seed/${seed('wrapboxd-title')}/1920/1080"
  data-background-size="cover"
  data-background-opacity="0.16">
  <h1>MY ${year} IN FILM</h1>
  <p style="margin-top: 64px;">
    <span class="sticker sticker-yellow">${filmCount} FILMS</span>
  </p>
  <div class="photo-collage" style="max-width: 1500px;">
    ${collageImages(['popcorn', 'redcarpet', 'cinema', 'camera'], 4)}
  </div>
</section>`;
}

function introSlide(data) {
  const count = data.computedAll?.counts?.uniqueFilms || 0;
  const hours = estimateHours(data);
  
  return `
<section class="slide-statement bg-noise" data-background-color="white"
  data-background-image="https://picsum.photos/seed/${seed('wrapboxd-intro')}/1920/1080"
  data-background-size="cover"
  data-background-opacity="0.08">
  <h2>HERE'S WHAT I WATCHED</h2>
  <p class="text-muted" style="font-size: 48px; margin-top: 32px;">
    ${count} films • ~${hours} hours • a lot of opinions
  </p>
  <img class="corner-photo light" src="https://picsum.photos/seed/${seed('wrapboxd-corner-1')}/640/420" alt="">
</section>`;
}

function sectionDivider(title) {
  const bg = SECTION_BG_COLORS[sectionBgIndex % SECTION_BG_COLORS.length];
  sectionBgIndex += 1;
  return `
<section class="slide-divider bg-noise" data-background-color="${bg}"
  data-background-image="https://picsum.photos/seed/${seed(`section-${title}`)}/1920/1080"
  data-background-size="cover"
  data-background-opacity="0.12">
  <h1>${escapeHtml(title)}</h1>
  <div class="photo-collage" style="max-width: 1500px;">
    ${collageImages([`sec-${title}-1`, `sec-${title}-2`, `sec-${title}-3`, `sec-${title}-4`], 4)}
  </div>
</section>`;
}

function totalFilmsSlide(data) {
  const count = data.computedAll?.counts?.uniqueFilms || 0;
  
  let insight = '';
  if (count > 365) insight = "more movies than days in a year";
  else if (count > 200) insight = "nearly 4 movies a week";
  else if (count > 100) insight = "solid commitment";
  else if (count > 52) insight = "at least one per week";
  else insight = "quality over quantity";
  
  return `
<section class="slide-stat bg-noise" data-background-color="black"
  data-background-image="https://picsum.photos/seed/${seed('total-films-bg')}/1920/1080"
  data-background-size="cover"
  data-background-opacity="0.08">
  <div class="stat-number accent">${count}</div>
  <div class="stat-label">unique films</div>
  <p class="chart-insight" style="margin-top: 48px;">${insight}</p>
  <img class="corner-photo" src="https://picsum.photos/seed/${seed('total-films-photo')}/640/420" alt="">
</section>`;
}

function totalWatchesSlide(data) {
  const watches = data.computedAll?.counts?.watches || 0;
  const unique = data.computedAll?.counts?.uniqueFilms || 0;
  const diff = watches - unique;
  
  return `
<section class="slide-stat bg-noise" data-background-color="black"
  data-background-image="https://picsum.photos/seed/${seed('total-watches-bg')}/1920/1080"
  data-background-size="cover"
  data-background-opacity="0.06">
  <div class="stat-number">${watches}</div>
  <div class="stat-label">total watches</div>
  ${diff > 0 ? `<p class="chart-insight" style="margin-top: 48px;">${diff} were rewatches</p>` : ''}
  <img class="corner-photo" src="https://picsum.photos/seed/${seed('total-watches-photo')}/640/420" alt="">
</section>`;
}

function avgRatingSlide(data) {
  const avg = data.computedAll?.counts?.avgRating;
  const displayAvg = avg != null ? avg.toFixed(1) : '—';
  
  let personality = '';
  if (avg >= 4.5) personality = "I love everything (or I only watch bangers)";
  else if (avg >= 4.0) personality = "generous but discerning";
  else if (avg >= 3.5) personality = "fair and balanced";
  else if (avg >= 3.0) personality = "tough crowd";
  else personality = "I'm a professional hater";
  
  return `
<section class="slide-stat bg-noise" data-background-color="white"
  data-background-image="https://picsum.photos/seed/${seed('avg-rating-bg')}/1920/1080"
  data-background-size="cover"
  data-background-opacity="0.08">
  <div class="stat-number">${displayAvg}</div>
  <div class="stat-label">average rating</div>
  <p class="chart-insight" style="margin-top: 48px;">${personality}</p>
  <img class="corner-photo light" src="https://picsum.photos/seed/${seed('avg-rating-photo')}/640/420" alt="">
</section>`;
}

function rewatchesSlide(data) {
  const rewatches = data.computedAll?.counts?.rewatches || 0;
  const total = data.computedAll?.counts?.watches || 1;
  const pct = Math.round((rewatches / total) * 100);
  
  let insight = '';
  if (pct > 30) insight = "comfort movies are my thing";
  else if (pct > 15) insight = "I have my favorites";
  else if (pct > 5) insight = "mostly new discoveries";
  else insight = "always chasing the new";
  
  return `
<section class="slide-stat bg-noise" data-background-color="white"
  data-background-image="https://picsum.photos/seed/${seed('rewatches-bg')}/1920/1080"
  data-background-size="cover"
  data-background-opacity="0.08">
  <div class="stat-number">${rewatches}</div>
  <div class="stat-label">rewatches</div>
  <p class="chart-insight" style="margin-top: 48px;">${pct}% of all watches • ${insight}</p>
  <img class="corner-photo light" src="https://picsum.photos/seed/${seed('rewatches-photo')}/640/420" alt="">
</section>`;
}

function uniqueVsRewatchSlide(data) {
  const rewatches = data.computedAll?.counts?.rewatches || 0;
  const unique = data.computedAll?.counts?.uniqueFilms || 0;
  
  return `
<section class="slide-chart" data-background-color="black">
  <h2>NEW VS. COMFORT</h2>
  <div class="grid-2col" style="margin-top: 64px;">
    <div class="text-center">
      <div class="stat-number" style="font-size: 180px;">${unique}</div>
      <div class="stat-label">new films</div>
    </div>
    <div class="text-center">
      <div class="stat-number text-accent" style="font-size: 180px;">${rewatches}</div>
      <div class="stat-label">rewatches</div>
    </div>
  </div>
</section>`;
}

function estimatedHoursSlide(data) {
  const hours = estimateHours(data);
  const days = Math.round(hours / 24 * 10) / 10;
  
  return `
<section class="slide-stat bg-noise" data-background-color="blue"
  data-background-image="https://picsum.photos/seed/${seed('hours-bg')}/1920/1080"
  data-background-size="cover"
  data-background-opacity="0.10">
  <div class="stat-number accent">${hours}</div>
  <div class="stat-label">hours of movies</div>
  <p class="chart-insight" style="margin-top: 48px;">that's ${days} full days of my life</p>
  <img class="corner-photo" src="https://picsum.photos/seed/${seed('hours-photo')}/640/420" alt="">
</section>`;
}

function filmsPerWeekSlide(data) {
  const count = data.computedAll?.counts?.uniqueFilms || 0;
  const perWeek = (count / 52).toFixed(1);
  
  return `
<section class="slide-stat bg-noise" data-background-color="white">
  <div class="stat-number">${perWeek}</div>
  <div class="stat-label">films per week (average)</div>
  <img class="corner-photo light" src="https://picsum.photos/seed/${seed('per-week-photo')}/640/420" alt="">
</section>`;
}

function filmsPerMonthSlide(data) {
  const series = data.computedAll?.series?.watchesByMonth || [];
  const counts = series.map(m => m.count);
  const avg = counts.length ? (counts.reduce((a, b) => a + b, 0) / counts.length).toFixed(1) : 0;
  
  return `
<section class="slide-stat bg-noise" data-background-color="green"
  data-background-image="https://picsum.photos/seed/${seed('per-month-bg')}/1920/1080"
  data-background-size="cover"
  data-background-opacity="0.10">
  <div class="stat-number">${avg}</div>
  <div class="stat-label">films per month (average)</div>
  <img class="corner-photo light" src="https://picsum.photos/seed/${seed('per-month-photo')}/640/420" alt="">
</section>`;
}

function ratingsChartSlide(data) {
  return `
<section class="slide-chart bg-noise" data-background-color="black"
  data-background-image="https://picsum.photos/seed/${seed('ratings-chart-bg')}/1920/1080"
  data-background-size="cover"
  data-background-opacity="0.06">
  <h2>MY RATINGS</h2>
  <div class="chart-container" data-chart="ratings-histogram"></div>
</section>`;
}

function ratingPersonalitySlide(data) {
  const histogram = data.computedAll?.series?.ratingsHistogram || [];
  
  let maxCount = 0;
  let topRating = 3;
  histogram.forEach(h => {
    if (h.count > maxCount) {
      maxCount = h.count;
      topRating = h.rating;
    }
  });
  
  const stars = '★'.repeat(topRating);
  
  return `
<section class="slide-statement" data-background-color="black">
  <h1>I'M A <span class="text-accent">${stars}</span> PERSON</h1>
  <p class="text-muted" style="font-size: 48px; margin-top: 32px;">
    My most given rating: ${topRating} stars (${maxCount} times)
  </p>
</section>`;
}

function ratingDistributionBreakdownSlide(data) {
  const histogram = data.computedAll?.series?.ratingsHistogram || [];
  const total = histogram.reduce((sum, h) => sum + h.count, 0) || 1;
  
  const loved = histogram.filter(h => h.rating >= 4).reduce((sum, h) => sum + h.count, 0);
  const liked = histogram.filter(h => h.rating === 3).reduce((sum, h) => sum + h.count, 0);
  const meh = histogram.filter(h => h.rating <= 2).reduce((sum, h) => sum + h.count, 0);
  
  return `
<section class="slide-chart bg-noise" data-background-color="black"
  data-background-image="https://picsum.photos/seed/${seed('breakdown-bg')}/1920/1080"
  data-background-size="cover"
  data-background-opacity="0.06">
  <h2>THE BREAKDOWN</h2>
  <div class="grid-3col" style="margin-top: 64px;">
    <div class="text-center">
      <div class="stat-number text-green" style="font-size: 120px;">${Math.round(loved/total*100)}%</div>
      <div class="stat-label">loved it (4-5★)</div>
    </div>
    <div class="text-center">
      <div class="stat-number text-yellow" style="font-size: 120px;">${Math.round(liked/total*100)}%</div>
      <div class="stat-label">it was fine (3★)</div>
    </div>
    <div class="text-center">
      <div class="stat-number text-accent" style="font-size: 120px;">${Math.round(meh/total*100)}%</div>
      <div class="stat-label">why (1-2★)</div>
    </div>
  </div>
</section>`;
}

function fiveStarFilmsSlide(data) {
  const diary = data.parsed?.diary || [];
  const fiveStars = diary.filter(d => parseFloat(d.Rating) === 5);
  const count = fiveStars.length;
  
  const examples = fiveStars.slice(0, 3).map(f => f.Name).join(', ');
  
  return `
<section class="slide-stat" data-background-color="black">
  <div class="stat-number accent">${count}</div>
  <div class="stat-label">five-star films</div>
  ${examples ? `<p class="chart-insight" style="margin-top: 48px;">including ${examples}</p>` : ''}
</section>`;
}

function oneStarFilmsSlide(data) {
  const diary = data.parsed?.diary || [];
  const oneStars = diary.filter(d => parseFloat(d.Rating) === 1);
  const count = oneStars.length;
  
  if (count === 0) {
    return `
<section class="slide-statement" data-background-color="black">
  <h2>ZERO <span class="text-accent">ONE-STAR</span> FILMS</h2>
  <p class="text-muted" style="font-size: 48px; margin-top: 32px;">
    I don't finish movies I hate (or I got lucky)
  </p>
</section>`;
  }
  
  return `
<section class="slide-stat" data-background-color="black">
  <div class="stat-number">${count}</div>
  <div class="stat-label">one-star films</div>
  <p class="chart-insight" style="margin-top: 48px;">we don't talk about those</p>
</section>`;
}

function ratingConsistencySlide(data) {
  const histogram = data.computedAll?.series?.ratingsHistogram || [];
  const total = histogram.reduce((sum, h) => sum + h.count, 0) || 1;
  const maxPct = Math.round(Math.max(...histogram.map(h => h.count)) / total * 100);
  
  let consistency = '';
  if (maxPct > 50) consistency = "very consistent (maybe too consistent?)";
  else if (maxPct > 35) consistency = "I know what I like";
  else consistency = "all over the place";
  
  return `
<section class="slide-statement" data-background-color="black">
  <h2>RATING CONSISTENCY</h2>
  <p class="text-muted" style="font-size: 64px; margin-top: 32px;">
    ${consistency}
  </p>
</section>`;
}

function avgRatingByMonthSlide(data) {
  return `
<section class="slide-chart" data-background-color="black">
  <h2>RATING TRENDS BY MONTH</h2>
  <div class="chart-container" data-chart="rating-by-year"></div>
  <p class="chart-insight">am I getting pickier or more generous?</p>
</section>`;
}

function ratingByWeekdaySlide(data) {
  // This would need a new chart type - for now, use text
  const weekdays = data.computedAll?.series?.watchesByWeekday || [];
  
  return `
<section class="slide-chart" data-background-color="black">
  <h2>DO I RATE DIFFERENT ON WEEKENDS?</h2>
  <div class="chart-container" data-chart="weekdays"></div>
  <p class="chart-insight">spoiler: probably</p>
</section>`;
}

function watchesByMonthSlide(data) {
  const series = data.computedAll?.series?.watchesByMonth || [];
  
  let maxCount = 0;
  let busiestMonth = '';
  series.forEach(m => {
    if (m.count > maxCount) {
      maxCount = m.count;
      busiestMonth = m.yearMonth;
    }
  });
  
  return `
<section class="slide-chart bg-noise" data-background-color="black"
  data-background-image="https://picsum.photos/seed/${seed('watches-by-month-bg')}/1920/1080"
  data-background-size="cover"
  data-background-opacity="0.06">
  <h2>WHEN I WATCHED</h2>
  <div class="chart-container" data-chart="watches-by-month"></div>
  ${busiestMonth ? `<p class="chart-insight">${busiestMonth}: ${maxCount} films (peak movie mode)</p>` : ''}
</section>`;
}

function busiestMonthSlide(data) {
  const series = data.computedAll?.series?.watchesByMonth || [];
  
  let maxCount = 0;
  let busiestMonth = '';
  series.forEach(m => {
    if (m.count > maxCount) {
      maxCount = m.count;
      busiestMonth = m.yearMonth;
    }
  });
  
  const monthName = formatMonth(busiestMonth);
  
  return `
<section class="slide-stat bg-noise" data-background-color="accent"
  data-background-image="https://picsum.photos/seed/${seed('busiest-month-bg')}/1920/1080"
  data-background-size="cover"
  data-background-opacity="0.12">
  <h3 class="text-muted">BUSIEST MONTH</h3>
  <div class="stat-number accent" style="font-size: 140px; margin-top: 24px;">${monthName}</div>
  <div class="stat-label" style="margin-top: 24px;">${maxCount} films</div>
  <img class="corner-photo" src="https://picsum.photos/seed/${seed('busiest-month-photo')}/640/420" alt="">
</section>`;
}

function quietestMonthSlide(data) {
  const series = data.computedAll?.series?.watchesByMonth || [];
  if (!series.length) return '';
  
  let minCount = Infinity;
  let quietestMonth = '';
  series.forEach(m => {
    if (m.count < minCount && m.count > 0) {
      minCount = m.count;
      quietestMonth = m.yearMonth;
    }
  });
  
  const monthName = formatMonth(quietestMonth);
  
  return `
<section class="slide-stat bg-noise" data-background-color="white"
  data-background-image="https://picsum.photos/seed/${seed('quietest-month-bg')}/1920/1080"
  data-background-size="cover"
  data-background-opacity="0.08">
  <h3 class="text-muted">QUIETEST MONTH</h3>
  <div class="stat-number" style="font-size: 140px; margin-top: 24px;">${monthName}</div>
  <div class="stat-label" style="margin-top: 24px;">${minCount} films (busy with life, probably)</div>
  <img class="corner-photo light" src="https://picsum.photos/seed/${seed('quietest-month-photo')}/640/420" alt="">
</section>`;
}

function weekdaySlide(data) {
  const series = data.computedAll?.series?.watchesByWeekday || [];
  
  let maxCount = 0;
  let topDay = '';
  series.forEach(d => {
    if (d.count > maxCount) {
      maxCount = d.count;
      topDay = d.weekday;
    }
  });
  
  return `
<section class="slide-chart bg-noise" data-background-color="black"
  data-background-image="https://picsum.photos/seed/${seed('weekday-bg')}/1920/1080"
  data-background-size="cover"
  data-background-opacity="0.06">
  <h2>MY MOVIE DAYS</h2>
  <div class="chart-container" data-chart="weekdays"></div>
  ${topDay ? `<p class="chart-insight">${topDay} is my day</p>` : ''}
</section>`;
}

function weekendVsWeekdaySlide(data) {
  const series = data.computedAll?.series?.watchesByWeekday || [];
  
  const weekendDays = ['Sat', 'Sun', 'Saturday', 'Sunday'];
  let weekend = 0;
  let weekday = 0;
  
  series.forEach(d => {
    if (weekendDays.includes(d.weekday)) {
      weekend += d.count;
    } else {
      weekday += d.count;
    }
  });
  
  const total = weekend + weekday || 1;
  const weekendPct = Math.round(weekend / total * 100);
  const weekdayPct = Math.round(weekday / total * 100);
  
  return `
<section class="slide-chart bg-noise" data-background-color="white">
  <h2>WEEKEND VS. WEEKDAY</h2>
  <div class="grid-2col" style="margin-top: 64px;">
    <div class="text-center">
      <div class="stat-number" style="font-size: 160px;">${weekdayPct}%</div>
      <div class="stat-label">weekdays</div>
    </div>
    <div class="text-center">
      <div class="stat-number text-accent" style="font-size: 160px;">${weekendPct}%</div>
      <div class="stat-label">weekends</div>
    </div>
  </div>
</section>`;
}

function cumulativeSlide(data) {
  const series = data.computedAll?.series?.cumulativeWatches || [];
  const total = series.length ? series[series.length - 1].cumulative : 0;
  
  return `
<section class="slide-chart" data-background-color="black">
  <h2>THE JOURNEY</h2>
  <div class="chart-container" data-chart="cumulative"></div>
  <p class="chart-insight">${total} watches and counting</p>
</section>`;
}

function watchingStreaksSlide(data) {
  // Would need to calculate streaks from diary dates
  const diary = data.parsed?.diary || [];
  const streak = calculateLongestStreak(diary);
  
  return `
<section class="slide-stat" data-background-color="black">
  <div class="stat-number accent">${streak}</div>
  <div class="stat-label">day streak (longest)</div>
  <p class="chart-insight" style="margin-top: 48px;">consecutive days watching movies</p>
</section>`;
}

function biggestGapSlide(data) {
  const diary = data.parsed?.diary || [];
  const gap = calculateBiggestGap(diary);
  
  if (gap === 0) return '';
  
  return `
<section class="slide-stat" data-background-color="black">
  <div class="stat-number">${gap}</div>
  <div class="stat-label">day gap (longest)</div>
  <p class="chart-insight" style="margin-top: 48px;">my longest movie drought</p>
</section>`;
}

function seasonalPatternSlide(data) {
  const series = data.computedAll?.series?.watchesByMonth || [];
  
  const seasons = { winter: 0, spring: 0, summer: 0, fall: 0 };
  series.forEach(m => {
    const month = parseInt(m.yearMonth.split('-')[1]);
    if ([12, 1, 2].includes(month)) seasons.winter += m.count;
    else if ([3, 4, 5].includes(month)) seasons.spring += m.count;
    else if ([6, 7, 8].includes(month)) seasons.summer += m.count;
    else seasons.fall += m.count;
  });
  
  const topSeason = Object.entries(seasons).sort((a, b) => b[1] - a[1])[0];
  
  return `
<section class="slide-statement" data-background-color="black">
  <h2>PEAK MOVIE SEASON</h2>
  <h1 class="text-accent" style="margin-top: 32px;">${topSeason[0].toUpperCase()}</h1>
  <p class="text-muted" style="font-size: 48px; margin-top: 32px;">
    ${topSeason[1]} films
  </p>
</section>`;
}

function releaseYearsSlide(data) {
  const series = data.computedAll?.series?.releaseYears || [];
  
  const decades = new Map();
  series.forEach(d => {
    const decade = Math.floor(d.year / 10) * 10;
    decades.set(decade, (decades.get(decade) || 0) + d.count);
  });
  
  let topDecade = 2020;
  let maxCount = 0;
  decades.forEach((count, decade) => {
    if (count > maxCount) {
      maxCount = count;
      topDecade = decade;
    }
  });
  
  return `
<section class="slide-chart bg-noise" data-background-color="black"
  data-background-image="https://picsum.photos/seed/${seed('release-years-bg')}/1920/1080"
  data-background-size="cover"
  data-background-opacity="0.06">
  <h2>MY MOVIE ERAS</h2>
  <div class="chart-container" data-chart="release-years"></div>
  <p class="chart-insight">the ${topDecade}s are my era</p>
</section>`;
}

function dominantDecadeSlide(data) {
  const series = data.computedAll?.series?.releaseYears || [];
  
  const decades = new Map();
  series.forEach(d => {
    const decade = Math.floor(d.year / 10) * 10;
    decades.set(decade, (decades.get(decade) || 0) + d.count);
  });
  
  let topDecade = 2020;
  let maxCount = 0;
  decades.forEach((count, decade) => {
    if (count > maxCount) {
      maxCount = count;
      topDecade = decade;
    }
  });
  
  const total = series.reduce((sum, d) => sum + d.count, 0) || 1;
  const pct = Math.round(maxCount / total * 100);
  
  return `
<section class="slide-stat" data-background-color="black">
  <div class="stat-number accent">${topDecade}s</div>
  <div class="stat-label">${pct}% of my films</div>
</section>`;
}

function oldestFilmSlide(data) {
  const diary = data.parsed?.diary || [];
  
  let oldest = null;
  let oldestYear = 9999;
  diary.forEach(d => {
    const year = parseInt(d.Year);
    if (year && year < oldestYear) {
      oldestYear = year;
      oldest = d;
    }
  });
  
  if (!oldest) return '';
  
  return `
<section class="slide-statement" data-background-color="black">
  <h3 class="text-muted">OLDEST FILM I WATCHED</h3>
  <h2 class="text-accent" style="margin-top: 32px;">${escapeHtml(oldest.Name)}</h2>
  <p class="text-muted" style="font-size: 64px; margin-top: 24px;">${oldestYear}</p>
</section>`;
}

function newestFilmSlide(data) {
  const diary = data.parsed?.diary || [];
  const currentYear = new Date().getFullYear();
  
  let newest = null;
  let newestYear = 0;
  diary.forEach(d => {
    const year = parseInt(d.Year);
    if (year && year > newestYear) {
      newestYear = year;
      newest = d;
    }
  });
  
  if (!newest) return '';
  
  const isCurrentYear = newestYear === currentYear;
  
  return `
<section class="slide-statement" data-background-color="black">
  <h3 class="text-muted">NEWEST FILM I WATCHED</h3>
  <h2 class="text-accent" style="margin-top: 32px;">${escapeHtml(newest.Name)}</h2>
  <p class="text-muted" style="font-size: 64px; margin-top: 24px;">${newestYear}${isCurrentYear ? ' (staying current)' : ''}</p>
</section>`;
}

function newReleasesVsCatalogSlide(data) {
  const diary = data.parsed?.diary || [];
  const currentYear = new Date().getFullYear();
  
  let newReleases = 0;
  let catalog = 0;
  
  diary.forEach(d => {
    const year = parseInt(d.Year);
    if (year >= currentYear - 1) newReleases++;
    else catalog++;
  });
  
  const total = newReleases + catalog || 1;
  
  return `
<section class="slide-chart" data-background-color="black">
  <h2>NEW RELEASES VS. CATALOG</h2>
  <div class="grid-2col" style="margin-top: 64px;">
    <div class="text-center">
      <div class="stat-number text-accent" style="font-size: 160px;">${Math.round(newReleases/total*100)}%</div>
      <div class="stat-label">new releases (last 2 years)</div>
    </div>
    <div class="text-center">
      <div class="stat-number" style="font-size: 160px;">${Math.round(catalog/total*100)}%</div>
      <div class="stat-label">catalog films</div>
    </div>
  </div>
</section>`;
}

function releaseYearTrendSlide(data) {
  const diary = data.parsed?.diary || [];
  
  // Check if watching older or newer films over time
  const byWatchMonth = new Map();
  diary.forEach(d => {
    const watchDate = d['Watched Date'] || d.Date;
    if (!watchDate) return;
    const watchMonth = watchDate.slice(0, 7);
    const releaseYear = parseInt(d.Year);
    if (!releaseYear) return;
    
    if (!byWatchMonth.has(watchMonth)) {
      byWatchMonth.set(watchMonth, { sum: 0, count: 0 });
    }
    const m = byWatchMonth.get(watchMonth);
    m.sum += releaseYear;
    m.count++;
  });
  
  const months = Array.from(byWatchMonth.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  if (months.length < 2) return '';
  
  const first = months[0][1].sum / months[0][1].count;
  const last = months[months.length - 1][1].sum / months[months.length - 1][1].count;
  const trend = last > first ? 'newer' : 'older';
  
  return `
<section class="slide-statement" data-background-color="black">
  <h2>OVER THE YEAR</h2>
  <p class="text-muted" style="font-size: 64px; margin-top: 32px;">
    I've been watching <span class="text-accent">${trend}</span> films
  </p>
</section>`;
}

function genresSlide(data) {
  const genres = data.enrichedAll?.topGenres || [];
  const top = genres[0]?.name || 'Unknown';
  const topCount = genres[0]?.count || 0;
  
  return `
<section class="slide-chart" data-background-color="black">
  <h2>MY GENRES</h2>
  <div class="chart-container" data-chart="top-genres"></div>
  <p class="chart-insight">${top} is my thing (${topCount} films)</p>
</section>`;
}

function topGenreSlide(data) {
  const genres = data.enrichedAll?.topGenres || [];
  const top = genres[0] || { name: 'Unknown', count: 0 };
  const total = genres.reduce((sum, g) => sum + g.count, 0) || 1;
  const pct = Math.round(top.count / total * 100);
  
  return `
<section class="slide-stat" data-background-color="black">
  <h3 class="text-muted">TOP GENRE</h3>
  <div class="stat-number accent" style="font-size: 160px; margin-top: 24px;">${top.name.toUpperCase()}</div>
  <div class="stat-label" style="margin-top: 24px;">${pct}% of all films</div>
</section>`;
}

function genreBreakdownSlide(data) {
  const genres = data.enrichedAll?.topGenres || [];
  const top5 = genres.slice(0, 5);
  
  const items = top5.map((g, i) => `
    <div style="display: flex; align-items: center; gap: 24px; margin-bottom: 24px;">
      <span class="sticker sticker-${i === 0 ? 'yellow' : 'red'}" style="width: 60px; text-align: center;">${i + 1}</span>
      <span style="font-size: 48px;">${g.name}</span>
      <span class="text-muted" style="font-size: 36px;">${g.count} films</span>
    </div>
  `).join('');
  
  return `
<section class="slide-chart" data-background-color="black">
  <h2>TOP 5 GENRES</h2>
  <div style="margin-top: 48px;">
    ${items}
  </div>
</section>`;
}

function genreRatingsSlide(data) {
  // Would need genre + rating correlation data
  return `
<section class="slide-statement" data-background-color="black">
  <h2>GENRE RATINGS</h2>
  <p class="text-muted" style="font-size: 48px; margin-top: 32px;">
    (would show which genres I rate highest)
  </p>
</section>`;
}

function unexpectedGenresSlide(data) {
  const genres = data.enrichedAll?.topGenres || [];
  // Find genres that might be unexpected
  const unexpected = genres.find(g => 
    ['Documentary', 'Animation', 'Musical', 'Western', 'War'].includes(g.name) && g.count > 2
  );
  
  if (!unexpected) return '';
  
  return `
<section class="slide-statement" data-background-color="black">
  <h2>PLOT TWIST</h2>
  <p class="text-muted" style="font-size: 64px; margin-top: 32px;">
    I watched <span class="text-accent">${unexpected.count} ${unexpected.name.toLowerCase()}</span> films
  </p>
  <p class="chart-insight" style="margin-top: 32px;">didn't see that coming</p>
</section>`;
}

function topDirectorSlide(data) {
  const directors = data.enrichedAll?.topDirectors || [];
  const top = directors[0] || { name: 'Unknown', count: 0 };
  
  return `
<section class="slide-statement" data-background-color="black">
  <h3 class="text-muted">MY #1 DIRECTOR</h3>
  <h1 class="text-accent" style="margin-top: 32px; font-size: 120px;">${escapeHtml(top.name).toUpperCase()}</h1>
  <p class="text-muted" style="font-size: 48px; margin-top: 32px;">
    ${top.count} films watched
  </p>
</section>`;
}

function directorsSlide(data) {
  return `
<section class="slide-chart" data-background-color="black">
  <h2>MY DIRECTORS</h2>
  <div class="chart-container" data-chart="top-directors"></div>
</section>`;
}

function directorLoyaltySlide(data) {
  const directors = data.enrichedAll?.topDirectors || [];
  const loyal = directors.filter(d => d.count >= 3).length;
  
  return `
<section class="slide-stat" data-background-color="black">
  <div class="stat-number accent">${loyal}</div>
  <div class="stat-label">directors with 3+ films</div>
  <p class="chart-insight" style="margin-top: 48px;">my loyal favorites</p>
</section>`;
}

function oneHitDirectorsSlide(data) {
  const directors = data.enrichedAll?.topDirectors || [];
  const oneHit = directors.filter(d => d.count === 1).length;
  const total = directors.length || 1;
  const pct = Math.round(oneHit / total * 100);
  
  return `
<section class="slide-stat" data-background-color="black">
  <div class="stat-number">${oneHit}</div>
  <div class="stat-label">one-film directors (${pct}%)</div>
  <p class="chart-insight" style="margin-top: 48px;">always exploring</p>
</section>`;
}

function directorDiscoverySlide(data) {
  const directors = data.enrichedAll?.topDirectors || [];
  const unique = directors.length;
  
  return `
<section class="slide-stat" data-background-color="black">
  <div class="stat-number accent">${unique}</div>
  <div class="stat-label">unique directors</div>
</section>`;
}

function runtimeSlide(data) {
  return `
<section class="slide-chart" data-background-color="black">
  <h2>MY ATTENTION SPAN</h2>
  <div class="chart-container" data-chart="runtime-dist"></div>
</section>`;
}

function avgRuntimeSlide(data) {
  const bins = data.enrichedAll?.runtimeBins || [];
  const avg = getAvgRuntime(bins);
  
  return `
<section class="slide-stat" data-background-color="black">
  <div class="stat-number">${avg}</div>
  <div class="stat-label">average runtime (minutes)</div>
</section>`;
}

function longestFilmsSlide(data) {
  // Would need individual film runtime data
  return `
<section class="slide-statement" data-background-color="black">
  <h2>LONGEST FILM I SAT THROUGH</h2>
  <p class="text-muted" style="font-size: 48px; margin-top: 32px;">
    (would show the marathon movies)
  </p>
</section>`;
}

function shortestFilmsSlide(data) {
  return `
<section class="slide-statement" data-background-color="black">
  <h2>SHORTEST FILM</h2>
  <p class="text-muted" style="font-size: 48px; margin-top: 32px;">
    (would show the quick watches)
  </p>
</section>`;
}

function runtimeByRatingSlide(data) {
  return `
<section class="slide-statement" data-background-color="black">
  <h2>DO I RATE LONG MOVIES DIFFERENTLY?</h2>
  <p class="text-muted" style="font-size: 48px; margin-top: 32px;">
    (spoiler: probably harsher)
  </p>
</section>`;
}

function firstWatchSlide(data) {
  const diary = data.parsed?.diary || [];
  const sorted = [...diary].sort((a, b) => {
    const dateA = a['Watched Date'] || a.Date;
    const dateB = b['Watched Date'] || b.Date;
    return dateA.localeCompare(dateB);
  });
  
  const first = sorted[0];
  if (!first) return '';
  
  return `
<section class="slide-statement" data-background-color="black">
  <h3 class="text-muted">FIRST FILM OF THE YEAR</h3>
  <h2 class="text-accent" style="margin-top: 32px;">${escapeHtml(first.Name)}</h2>
  <p class="text-muted" style="font-size: 48px; margin-top: 24px;">
    ${first['Watched Date'] || first.Date} • ${first.Rating ? '★'.repeat(parseInt(first.Rating)) : 'unrated'}
  </p>
</section>`;
}

function lastWatchSlide(data) {
  const diary = data.parsed?.diary || [];
  const sorted = [...diary].sort((a, b) => {
    const dateA = a['Watched Date'] || a.Date;
    const dateB = b['Watched Date'] || b.Date;
    return dateB.localeCompare(dateA);
  });
  
  const last = sorted[0];
  if (!last) return '';
  
  return `
<section class="slide-statement" data-background-color="black">
  <h3 class="text-muted">MOST RECENT WATCH</h3>
  <h2 class="text-accent" style="margin-top: 32px;">${escapeHtml(last.Name)}</h2>
  <p class="text-muted" style="font-size: 48px; margin-top: 24px;">
    ${last['Watched Date'] || last.Date} • ${last.Rating ? '★'.repeat(parseInt(last.Rating)) : 'unrated'}
  </p>
</section>`;
}

function mostRatedSlide(data) {
  const histogram = data.computedAll?.series?.ratingsHistogram || [];
  const totalRated = histogram.reduce((sum, h) => sum + h.count, 0);
  const watches = data.computedAll?.counts?.watches || 1;
  const pct = Math.round(totalRated / watches * 100);
  
  return `
<section class="slide-stat" data-background-color="black">
  <div class="stat-number">${pct}%</div>
  <div class="stat-label">of films I rated</div>
</section>`;
}

function ratingTrendsSlide(data) {
  return `
<section class="slide-chart" data-background-color="black">
  <h2>MY RATING TREND</h2>
  <div class="chart-container" data-chart="rating-by-year"></div>
  <p class="chart-insight">getting pickier or more generous?</p>
</section>`;
}

function monthlyRatingsHeatmapSlide(data) {
  // Placeholder for heatmap
  return `
<section class="slide-statement" data-background-color="black">
  <h2>RATING PATTERNS</h2>
  <p class="text-muted" style="font-size: 48px; margin-top: 32px;">
    (would show monthly rating heatmap)
  </p>
</section>`;
}

function controversialRatingsSlide(data) {
  return `
<section class="slide-statement" data-background-color="black">
  <h1>MY HOT TAKES</h1>
  <p class="text-muted" style="font-size: 48px; margin-top: 32px;">
    Films where I disagree with everyone else
  </p>
</section>`;
}

function underratedPicksSlide(data) {
  return `
<section class="slide-statement" data-background-color="black">
  <h2>FILMS I LOVED THAT OTHERS DIDN'T</h2>
  <p class="text-muted" style="font-size: 48px; margin-top: 32px;">
    (my underrated gems)
  </p>
</section>`;
}

function overratedPicksSlide(data) {
  return `
<section class="slide-statement" data-background-color="black">
  <h2>FILMS I DIDN'T GET</h2>
  <p class="text-muted" style="font-size: 48px; margin-top: 32px;">
    (apparently I missed the point)
  </p>
</section>`;
}

function agreementScoreSlide(data) {
  // Would need TMDB ratings comparison
  return `
<section class="slide-stat" data-background-color="black">
  <div class="stat-number">??%</div>
  <div class="stat-label">agreement with critics</div>
  <p class="chart-insight" style="margin-top: 48px;">(would compare my ratings to TMDB averages)</p>
</section>`;
}

function randomFactsSlide(data) {
  const count = data.computedAll?.counts?.uniqueFilms || 0;
  const hours = estimateHours(data);
  
  return `
<section class="slide-chart bg-noise" data-background-color="white"
  data-background-image="https://picsum.photos/seed/${seed('fun-facts-bg')}/1920/1080"
  data-background-size="cover"
  data-background-opacity="0.08">
  <h2>FUN FACTS</h2>
  <ul style="font-size: 48px; margin-top: 48px;">
    <li style="margin-bottom: 24px;">Watched <span class="text-accent">${count}</span> unique films</li>
    <li style="margin-bottom: 24px;">Spent <span class="text-accent">~${hours}</span> hours watching</li>
    <li style="margin-bottom: 24px;">That's <span class="text-accent">${Math.round(hours/24)}</span> full days</li>
    <li style="margin-bottom: 24px;">Or <span class="text-accent">${(hours/8760*100).toFixed(1)}%</span> of the year</li>
  </ul>
  <div class="photo-collage" style="max-width: 1500px;">
    ${collageImages(['fact-1','fact-2','fact-3','fact-4'], 4)}
  </div>
</section>`;
}

function movieMathSlide(data) {
  const count = data.computedAll?.counts?.uniqueFilms || 0;
  const hours = estimateHours(data);
  
  return `
<section class="slide-statement" data-background-color="black">
  <h2>THE MATH</h2>
  <p style="font-size: 48px; margin-top: 48px; color: var(--genz-text-muted);">
    ${count} films × ~2 hours = <span class="text-accent">${hours} hours</span>
  </p>
  <p style="font-size: 48px; margin-top: 24px; color: var(--genz-text-muted);">
    = ${Math.round(hours/24)} days = ${(hours/168).toFixed(1)} weeks
  </p>
</section>`;
}

function ifIWatchedSlide(data) {
  const hours = estimateHours(data);
  
  return `
<section class="slide-chart" data-background-color="black">
  <h2>IF I WATCHED CONTINUOUSLY...</h2>
  <ul style="font-size: 48px; margin-top: 48px;">
    <li style="margin-bottom: 24px;">I'd finish in <span class="text-accent">${Math.round(hours/24)}</span> days</li>
    <li style="margin-bottom: 24px;">That's from now until <span class="text-accent">${getDateInDays(Math.round(hours/24))}</span></li>
    <li style="margin-bottom: 24px;">No sleep, no breaks, just movies</li>
  </ul>
</section>`;
}

function equivalentToSlide(data) {
  const hours = estimateHours(data);
  
  const equivalents = [
    `${Math.round(hours * 60 / 3)} podcast episodes (1hr each)`,
    `${Math.round(hours / 40)} work weeks`,
    `${Math.round(hours / 8)} full night's sleeps`,
    `${Math.round(hours * 60 / 45)} gym sessions`,
    `a road trip to ${getRoadTripDestination(hours)}`,
  ];
  
  return `
<section class="slide-chart bg-noise" data-background-color="black"
  data-background-image="https://picsum.photos/seed/${seed('equivalent-bg')}/1920/1080"
  data-background-size="cover"
  data-background-opacity="0.06">
  <h2>EQUIVALENT TO...</h2>
  <ul style="font-size: 42px; margin-top: 48px;">
    ${equivalents.map(e => `<li style="margin-bottom: 20px;">${e}</li>`).join('')}
  </ul>
</section>`;
}

function topRatedGallerySlide(data) {
  const diary = data.parsed?.diary || [];
  const fiveStars = diary.filter(d => parseFloat(d.Rating) === 5).slice(0, 6);
  
  if (!fiveStars.length) {
    return `
<section class="slide-statement" data-background-color="black">
  <h2>TOP RATED FILMS</h2>
  <p class="text-muted" style="font-size: 48px; margin-top: 32px;">
    (no 5-star films yet)
  </p>
</section>`;
  }
  
  const posters = fiveStars.map((f, i) => `
    <div class="text-center">
      <img src="https://picsum.photos/seed/${encodeURIComponent(f.Name)}/200/300" 
           style="border-radius: 8px; margin-bottom: 16px;" 
           alt="${escapeHtml(f.Name)}">
      <div style="font-size: 24px;">${escapeHtml(f.Name)}</div>
      <div style="font-size: 20px; color: var(--genz-text-muted);">${f.Year}</div>
    </div>
  `).join('');
  
  return `
<section class="slide-chart" data-background-color="black">
  <h2>★★★★★ FILMS</h2>
  <div class="grid-${Math.min(fiveStars.length, 3)}col" style="margin-top: 48px;">
    ${posters}
  </div>
</section>`;
}

function recentFavoritesSlide(data) {
  const diary = data.parsed?.diary || [];
  const highRated = diary
    .filter(d => parseFloat(d.Rating) >= 4)
    .sort((a, b) => {
      const dateA = a['Watched Date'] || a.Date;
      const dateB = b['Watched Date'] || b.Date;
      return dateB.localeCompare(dateA);
    })
    .slice(0, 4);
  
  if (!highRated.length) return '';
  
  const items = highRated.map(f => `
    <div style="display: flex; align-items: center; gap: 24px; margin-bottom: 32px;">
      <img src="https://picsum.photos/seed/${encodeURIComponent(f.Name)}/80/120" 
           style="border-radius: 4px;" 
           alt="${escapeHtml(f.Name)}">
      <div>
        <div style="font-size: 36px;">${escapeHtml(f.Name)}</div>
        <div style="font-size: 24px; color: var(--genz-text-muted);">${f.Year} • ${'★'.repeat(parseInt(f.Rating))}</div>
      </div>
    </div>
  `).join('');
  
  return `
<section class="slide-chart" data-background-color="black">
  <h2>RECENT FAVORITES</h2>
  <div style="margin-top: 48px;">
    ${items}
  </div>
</section>`;
}

function predictionsSlide(data) {
  const count = data.computedAll?.counts?.uniqueFilms || 0;
  const projected = Math.round(count * 1.1);
  
  return `
<section class="slide-statement" data-background-color="black">
  <h2>NEXT YEAR PREDICTION</h2>
  <p style="font-size: 64px; margin-top: 48px; color: var(--genz-text-muted);">
    <span class="text-accent">${projected}</span> films
  </p>
  <p class="chart-insight" style="margin-top: 32px;">gotta pump those numbers up</p>
</section>`;
}

function goalsSlide(data) {
  const count = data.computedAll?.counts?.uniqueFilms || 0;
  
  return `
<section class="slide-chart" data-background-color="black">
  <h2>GOALS FOR NEXT YEAR</h2>
  <ul style="font-size: 48px; margin-top: 48px;">
    <li style="margin-bottom: 24px;">Watch more ${count < 100 ? 'films' : 'diverse genres'}</li>
    <li style="margin-bottom: 24px;">Explore more directors</li>
    <li style="margin-bottom: 24px;">Maybe fewer rewatches?</li>
    <li style="margin-bottom: 24px;">Actually rate everything</li>
  </ul>
</section>`;
}

function summarySlide(data) {
  const count = data.computedAll?.counts?.uniqueFilms || 0;
  const avg = data.computedAll?.counts?.avgRating?.toFixed(1) || '—';
  const topGenre = data.enrichedAll?.topGenres?.[0]?.name || 'Drama';
  const topDirector = data.enrichedAll?.topDirectors?.[0]?.name || 'Various';
  
  return `
<section class="slide-chart" data-background-color="black">
  <h2>TL;DR</h2>
  <ul style="font-size: 48px; margin-top: 48px;">
    <li style="margin-bottom: 24px;"><span class="text-accent">${count}</span> films</li>
    <li style="margin-bottom: 24px;"><span class="text-accent">${avg}</span> average rating</li>
    <li style="margin-bottom: 24px;"><span class="text-accent">${topGenre}</span> is my genre</li>
    <li style="margin-bottom: 24px;"><span class="text-accent">${topDirector}</span> is my director</li>
  </ul>
</section>`;
}

function closingSlide(data) {
  const year = new Date().getFullYear();
  const films = data.computedAll?.counts?.uniqueFilms || 0;
  
  return `
<section class="slide-title bg-noise" data-background-color="blue"
  data-background-image="https://picsum.photos/seed/${seed('wrapboxd-outro')}/1920/1080"
  data-background-size="cover"
  data-background-opacity="0.14">
  <h1 style="font-size: 140px;">THAT'S A WRAP</h1>
  <p class="text-muted" style="font-size: 48px; margin-top: 48px;">
    ${films} films in ${year}
  </p>
  <p style="margin-top: 64px; font-size: 28px; color: var(--genz-text-subtle);">
    made with wrapboxd • questions?
  </p>
</section>`;
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function seed(x) {
  return encodeURIComponent(String(x ?? "seed").slice(0, 80));
}

function collageImages(seeds, count = 4) {
  const chosen = (seeds || []).slice(0, count);
  while (chosen.length < count) chosen.push(`filler-${chosen.length}`);
  return chosen.map((s) => `<img src="https://picsum.photos/seed/${seed(s)}/520/340" alt="">`).join("");
}

function estimateHours(data) {
  const watches = data.computedAll?.counts?.watches || 0;
  // Estimate 2 hours per film if no runtime data
  const avgRuntime = getAvgRuntime(data.enrichedAll?.runtimeBins) || 120;
  return Math.round(watches * avgRuntime / 60);
}

function getAvgRuntime(bins) {
  if (!bins || !bins.length) return 110;
  
  let total = 0;
  let count = 0;
  bins.forEach(b => {
    if (b.count > 0) {
      const midpoint = b.bin === '180+' ? 195 : (b.min + b.max) / 2;
      total += midpoint * b.count;
      count += b.count;
    }
  });
  
  return count > 0 ? Math.round(total / count) : 110;
}

function getMostCommonRating(histogram) {
  if (!histogram || !histogram.length) return 'N/A';
  let max = 0;
  let rating = 3;
  histogram.forEach(h => {
    if (h.count > max) {
      max = h.count;
      rating = h.rating;
    }
  });
  return `${rating} stars`;
}

function getFiveStarFilms(diary) {
  return diary.filter(d => parseFloat(d.Rating) === 5);
}

function getFiveStarFilmsUnique(diary, limit = 25) {
  const seen = new Set();
  const out = [];
  for (const row of diary ?? []) {
    if (parseFloat(row?.Rating) !== 5) continue;
    const name = String(row?.Name ?? '').trim();
    const year = String(row?.Year ?? '').trim();
    const key = `${name} (${year || 'n/a'})`;
    if (!name || seen.has(key)) continue;
    seen.add(key);
    out.push(row);
    if (out.length >= limit) break;
  }
  return out;
}

function splitTags(raw) {
  if (!raw) return [];
  const s = String(raw).trim();
  if (!s) return [];
  return s
    .split(/[,;|]/g)
    .map((t) => t.trim())
    .filter(Boolean);
}

function getTopTags(diary, limit = 10) {
  const counts = new Map();
  for (const row of diary ?? []) {
    const tags = splitTags(row?.Tags ?? row?.tags);
    for (const t of tags) {
      counts.set(t, (counts.get(t) || 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => (b.count - a.count) || a.name.localeCompare(b.name))
    .slice(0, limit);
}

function getBusiestMonth(watchesByMonth) {
  const arr = watchesByMonth || [];
  if (!arr.length) return null;
  return arr.reduce((best, cur) => (!best || (cur.count > best.count) ? cur : best), null);
}

function getQuietestMonth(watchesByMonth) {
  const arr = (watchesByMonth || []).filter((m) => (m?.count || 0) > 0);
  if (!arr.length) return null;
  return arr.reduce((best, cur) => (!best || (cur.count < best.count) ? cur : best), null);
}

function getTopWeekday(watchesByWeekday) {
  const arr = watchesByWeekday || [];
  if (!arr.length) return null;
  return arr.reduce((best, cur) => (!best || (cur.count > best.count) ? cur : best), null);
}

function getWeekendSharePct(watchesByWeekday) {
  const arr = watchesByWeekday || [];
  if (!arr.length) return null;
  const weekendDays = new Set(['Sat', 'Sun', 'Saturday', 'Sunday']);
  let weekend = 0;
  let total = 0;
  for (const d of arr) {
    const c = Number(d?.count || 0);
    total += c;
    if (weekendDays.has(d?.weekday)) weekend += c;
  }
  if (!total) return 0;
  return Math.round((weekend / total) * 100);
}

function getTopRewatchedFilms(diary, limit = 10) {
  const byFilm = new Map();
  for (const row of diary ?? []) {
    const name = String(row?.Name ?? '').trim();
    const year = String(row?.Year ?? '').trim();
    if (!name) continue;
    const key = `${name} (${year || 'n/a'})`;
    const s = String(row?.Rewatch ?? row?.rewatch ?? "").trim().toLowerCase();
    const isRewatch = s === "yes" || s === "true" || s === "1" || s === "rewatch";
    if (!isRewatch) continue;
    byFilm.set(key, (byFilm.get(key) || 0) + 1);
  }
  return Array.from(byFilm.entries())
    .map(([film, count]) => ({ film, count }))
    .sort((a, b) => (b.count - a.count) || a.film.localeCompare(b.film))
    .slice(0, limit);
}

function formatMonth(yearMonth) {
  if (!yearMonth) return '';
  const [year, month] = yearMonth.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months[parseInt(month) - 1] || yearMonth;
}

function calculateLongestStreak(diary) {
  if (!diary.length) return 0;
  
  const dates = diary
    .map(d => d['Watched Date'] || d.Date)
    .filter(Boolean)
    .sort();
  
  if (!dates.length) return 0;
  
  let maxStreak = 1;
  let currentStreak = 1;
  
  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1]);
    const curr = new Date(dates[i]);
    const diffDays = Math.round((curr - prev) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else if (diffDays > 1) {
      currentStreak = 1;
    }
  }
  
  return maxStreak;
}

function calculateBiggestGap(diary) {
  if (!diary.length) return 0;
  
  const dates = diary
    .map(d => d['Watched Date'] || d.Date)
    .filter(Boolean)
    .sort();
  
  if (dates.length < 2) return 0;
  
  let maxGap = 0;
  
  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1]);
    const curr = new Date(dates[i]);
    const diffDays = Math.round((curr - prev) / (1000 * 60 * 60 * 24));
    maxGap = Math.max(maxGap, diffDays);
  }
  
  return maxGap;
}

function getDateInDays(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getRoadTripDestination(hours) {
  // Assuming 60mph average
  const miles = hours * 60;
  if (miles > 2500) return 'coast to coast';
  if (miles > 1000) return 'across several states';
  if (miles > 500) return 'a neighboring state';
  return 'a weekend getaway';
}
