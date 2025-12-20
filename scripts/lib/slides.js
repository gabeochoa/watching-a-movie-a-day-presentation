/**
 * Wrapboxd Slide Generator
 * 
 * Generates reveal.js slide HTML from Letterboxd/TMDB data.
 * Follows the Gen Z presentation style guidelines.
 */

/**
 * Generate all slides for the presentation
 * @param {Object} data - The computed data payload
 * @returns {string} HTML string of all slides
 */
export function generateSlides(data) {
  const slides = [];
  
  // Title slide
  slides.push(titleSlide(data));
  
  // Overview stats section
  slides.push(sectionDivider('THE NUMBERS'));
  slides.push(totalFilmsSlide(data));
  slides.push(avgRatingSlide(data));
  slides.push(rewatchesSlide(data));
  
  // Rating analysis
  slides.push(sectionDivider('HOW YOU RATE'));
  slides.push(ratingsChartSlide(data));
  slides.push(ratingPersonalitySlide(data));
  
  // When you watch
  slides.push(sectionDivider('WHEN YOU WATCH'));
  slides.push(watchesByMonthSlide(data));
  slides.push(weekdaySlide(data));
  slides.push(cumulativeSlide(data));
  
  // What you watch
  slides.push(sectionDivider('YOUR ERAS'));
  slides.push(releaseYearsSlide(data));
  
  // TMDB-enriched slides (if available)
  if (data.enrichedAll) {
    slides.push(sectionDivider('YOUR TASTE'));
    
    if (data.enrichedAll.topGenres?.length) {
      slides.push(genresSlide(data));
    }
    
    if (data.enrichedAll.topDirectors?.length) {
      slides.push(directorsSlide(data));
    }
    
    if (data.enrichedAll.runtimeBins?.length) {
      slides.push(runtimeSlide(data));
    }
  }
  
  // Closing
  slides.push(closingSlide(data));
  
  return slides.join('\n');
}

/**
 * Title slide
 */
function titleSlide(data) {
  const year = new Date().getFullYear();
  const filmCount = data.computedAll?.counts?.uniqueFilms || '???';
  
  return `
<section class="slide-title" data-background-color="black">
  <h1>WRAPBOXD</h1>
  <p class="text-muted" style="font-size: 48px; margin-top: 32px;">
    Your ${year} in Film
  </p>
  <p style="margin-top: 64px;">
    <span class="sticker sticker-yellow">${filmCount} FILMS</span>
  </p>
</section>`;
}

/**
 * Section divider slide
 */
function sectionDivider(title) {
  return `
<section class="slide-divider" data-background-color="black">
  <h1>${escapeHtml(title)}</h1>
</section>`;
}

/**
 * Total films stat slide
 */
function totalFilmsSlide(data) {
  const count = data.computedAll?.counts?.uniqueFilms || 0;
  const watches = data.computedAll?.counts?.watches || 0;
  
  // Calculate insight
  let insight = '';
  if (count > 365) {
    insight = "you watched more movies than there are days in a year (insane)";
  } else if (count > 200) {
    insight = "that's nearly 4 movies a week";
  } else if (count > 100) {
    insight = "solid commitment to the craft";
  } else if (count > 52) {
    insight = "at least one movie per week";
  } else {
    insight = "quality over quantity";
  }
  
  return `
<section class="slide-stat" data-background-color="black">
  <div class="stat-number accent">${count}</div>
  <div class="stat-label">unique films watched</div>
  <p class="chart-insight" style="margin-top: 48px;">${insight}</p>
</section>`;
}

/**
 * Average rating stat slide
 */
function avgRatingSlide(data) {
  const avg = data.computedAll?.counts?.avgRating;
  const displayAvg = avg != null ? avg.toFixed(1) : '—';
  
  // Determine personality
  let personality = '';
  if (avg >= 4.5) {
    personality = "you love everything (or you only watch bangers)";
  } else if (avg >= 4.0) {
    personality = "generous but discerning";
  } else if (avg >= 3.5) {
    personality = "fair and balanced";
  } else if (avg >= 3.0) {
    personality = "tough crowd";
  } else {
    personality = "professional hater";
  }
  
  return `
<section class="slide-stat" data-background-color="black">
  <div class="stat-number">${displayAvg}</div>
  <div class="stat-label">average rating</div>
  <p class="chart-insight" style="margin-top: 48px;">${personality}</p>
</section>`;
}

/**
 * Rewatches stat slide
 */
function rewatchesSlide(data) {
  const rewatches = data.computedAll?.counts?.rewatches || 0;
  const total = data.computedAll?.counts?.watches || 1;
  const pct = Math.round((rewatches / total) * 100);
  
  let insight = '';
  if (pct > 30) {
    insight = "comfort movies are important";
  } else if (pct > 15) {
    insight = "you have your favorites";
  } else if (pct > 5) {
    insight = "mostly new discoveries";
  } else {
    insight = "always chasing the new";
  }
  
  return `
<section class="slide-stat" data-background-color="black">
  <div class="stat-number">${rewatches}</div>
  <div class="stat-label">rewatches (${pct}% of all watches)</div>
  <p class="chart-insight" style="margin-top: 48px;">${insight}</p>
</section>`;
}

/**
 * Ratings histogram chart slide
 */
function ratingsChartSlide(data) {
  return `
<section class="slide-chart" data-background-color="black">
  <h2>YOUR RATINGS</h2>
  <div class="chart-container" data-chart="ratings-histogram"></div>
</section>`;
}

/**
 * Rating personality slide
 */
function ratingPersonalitySlide(data) {
  const histogram = data.computedAll?.series?.ratingsHistogram || [];
  
  // Find most common rating
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
  <h1>YOU'RE A <span class="text-accent">${stars}</span> PERSON</h1>
  <p class="text-muted" style="font-size: 48px; margin-top: 32px;">
    Your most given rating is ${topRating} stars (${maxCount} times)
  </p>
</section>`;
}

/**
 * Watches by month chart slide
 */
function watchesByMonthSlide(data) {
  const series = data.computedAll?.series?.watchesByMonth || [];
  
  // Find busiest month
  let maxCount = 0;
  let busiestMonth = '';
  series.forEach(m => {
    if (m.count > maxCount) {
      maxCount = m.count;
      busiestMonth = m.yearMonth;
    }
  });
  
  const insight = busiestMonth 
    ? `your busiest month: ${busiestMonth} (${maxCount} films)`
    : '';
  
  return `
<section class="slide-chart" data-background-color="black">
  <h2>WHEN YOU WATCHED</h2>
  <div class="chart-container" data-chart="watches-by-month"></div>
  ${insight ? `<p class="chart-insight">${insight}</p>` : ''}
</section>`;
}

/**
 * Weekday distribution slide
 */
function weekdaySlide(data) {
  const series = data.computedAll?.series?.watchesByWeekday || [];
  
  // Find favorite day
  let maxCount = 0;
  let topDay = '';
  series.forEach(d => {
    if (d.count > maxCount) {
      maxCount = d.count;
      topDay = d.weekday;
    }
  });
  
  return `
<section class="slide-chart" data-background-color="black">
  <h2>YOUR MOVIE DAYS</h2>
  <div class="chart-container" data-chart="weekdays"></div>
  ${topDay ? `<p class="chart-insight">${topDay} is your day</p>` : ''}
</section>`;
}

/**
 * Cumulative watches slide
 */
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

/**
 * Release years distribution slide
 */
function releaseYearsSlide(data) {
  const series = data.computedAll?.series?.releaseYears || [];
  
  // Group by decade and find dominant one
  const decades = new Map();
  series.forEach(d => {
    const decade = Math.floor(d.year / 10) * 10;
    decades.set(decade, (decades.get(decade) || 0) + d.count);
  });
  
  let maxCount = 0;
  let topDecade = 2020;
  decades.forEach((count, decade) => {
    if (count > maxCount) {
      maxCount = count;
      topDecade = decade;
    }
  });
  
  return `
<section class="slide-chart" data-background-color="black">
  <h2>YOUR MOVIE ERAS</h2>
  <div class="chart-container" data-chart="release-years"></div>
  <p class="chart-insight">the ${topDecade}s are your era (${maxCount} films)</p>
</section>`;
}

/**
 * Top genres slide
 */
function genresSlide(data) {
  const genres = data.enrichedAll?.topGenres || [];
  const top = genres[0]?.name || 'Unknown';
  const topCount = genres[0]?.count || 0;
  
  return `
<section class="slide-chart" data-background-color="black">
  <h2>YOUR GENRES</h2>
  <div class="chart-container" data-chart="top-genres"></div>
  <p class="chart-insight">${top} is your thing (${topCount} films)</p>
</section>`;
}

/**
 * Top directors slide
 */
function directorsSlide(data) {
  const directors = data.enrichedAll?.topDirectors || [];
  const top = directors[0]?.name || 'Unknown';
  const topCount = directors[0]?.count || 0;
  
  // Build a statement slide first
  const slides = [];
  
  slides.push(`
<section class="slide-statement" data-background-color="black">
  <h1>YOUR #1 DIRECTOR</h1>
  <h2 class="text-accent" style="margin-top: 48px;">${escapeHtml(top)}</h2>
  <p class="text-muted" style="font-size: 48px; margin-top: 24px;">
    ${topCount} films watched
  </p>
</section>`);
  
  slides.push(`
<section class="slide-chart" data-background-color="black">
  <h2>YOUR DIRECTORS</h2>
  <div class="chart-container" data-chart="top-directors"></div>
</section>`);
  
  return slides.join('\n');
}

/**
 * Runtime distribution slide
 */
function runtimeSlide(data) {
  const bins = data.enrichedAll?.runtimeBins || [];
  
  // Find preferred runtime
  let maxCount = 0;
  let topBin = '90-119';
  bins.forEach(b => {
    if (b.count > maxCount) {
      maxCount = b.count;
      topBin = b.bin;
    }
  });
  
  return `
<section class="slide-chart" data-background-color="black">
  <h2>YOUR ATTENTION SPAN</h2>
  <div class="chart-container" data-chart="runtime-dist"></div>
  <p class="chart-insight">you prefer ${topBin} minute movies</p>
</section>`;
}

/**
 * Closing slide
 */
function closingSlide(data) {
  const year = new Date().getFullYear();
  const films = data.computedAll?.counts?.uniqueFilms || 0;
  
  return `
<section class="slide-title" data-background-color="black">
  <h1 style="font-size: 140px;">THAT'S A WRAP</h1>
  <p class="text-muted" style="font-size: 48px; margin-top: 48px;">
    ${films} films in ${year}
  </p>
  <p style="margin-top: 64px; font-size: 32px; color: var(--genz-text-subtle);">
    made with wrapboxd
  </p>
</section>`;
}

/**
 * Escape HTML special characters
 */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
