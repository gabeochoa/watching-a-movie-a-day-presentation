#!/usr/bin/env node
/**
 * Generate Reveal.js presentation from extracted data
 * Creates ~50 editorial slides with Gen Z aesthetic
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'build', 'data');
const OUTPUT_DIR = path.join(ROOT, 'build', 'presentation');

function readJson(filepath) {
  if (!fs.existsSync(filepath)) return null;
  return JSON.parse(fs.readFileSync(filepath, 'utf8'));
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function stars(n) {
  return '★'.repeat(Math.floor(n)) + (n % 1 >= 0.5 ? '½' : '');
}

function formatMonth(monthStr) {
  const [year, month] = monthStr.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months[parseInt(month) - 1] + ' ' + year;
}

function generateSlides(insights, controversy) {
  const slides = [];
  const s = insights.summary;
  const t = insights.temporal;
  const r = insights.ratings;
  const fs = insights.fiveStarAnalysis;
  const taste = insights.taste;
  
  // ============================================
  // OPENING (5 slides)
  // ============================================
  
  slides.push(`
    <section data-background="#0a0a0a">
      <h1 class="mega">MY 2025<br>IN FILM</h1>
      <p class="subtitle">${s.totalFilms} movies. ${s.totalHours} hours. One year.</p>
    </section>
  `);
  
  slides.push(`
    <section data-background="#1a1a2e">
      <h2 class="impact">I watched more movies than there are days in a year</h2>
      <p class="annotation">yes, really</p>
    </section>
  `);
  
  slides.push(`
    <section data-background="#0f0f23">
      <div class="big-number">${s.totalFilms}</div>
      <p class="label">unique films watched in 2025</p>
    </section>
  `);
  
  slides.push(`
    <section data-background="#16213e">
      <div class="stat-pair">
        <div class="stat">
          <span class="number">${s.totalHours}</span>
          <span class="unit">hours</span>
        </div>
        <div class="equals">=</div>
        <div class="stat">
          <span class="number">${s.totalDays}</span>
          <span class="unit">days</span>
        </div>
      </div>
      <p class="annotation">of my life, spent in the dark</p>
    </section>
  `);
  
  slides.push(`
    <section data-background="#0a0a0a">
      <h2 class="editorial">Here's what I learned about myself</h2>
      <p class="subtitle">through the movies I watched</p>
    </section>
  `);
  
  // ============================================
  // THE NUMBERS (8 slides) - BLUE theme
  // ============================================
  
  slides.push(`
    <section data-background="#0a1628" class="section-title-slide">
      <h2 class="section-title" style="color: #60A5FA;">THE NUMBERS</h2>
    </section>
  `);
  
  const filmsPerWeek = (s.totalFilms / 52).toFixed(1);
  slides.push(`
    <section data-background="#0f0f23">
      <div class="big-number">${filmsPerWeek}</div>
      <p class="label">films per week, on average</p>
      <p class="annotation">that's almost one a day</p>
    </section>
  `);
  
  slides.push(`
    <section data-background="#16213e">
      <h2 class="impact">${formatMonth(t.busiestMonth.month)}</h2>
      <div class="big-number">${t.busiestMonth.count}</div>
      <p class="label">films in one month</p>
      <p class="annotation">what happened?</p>
    </section>
  `);
  
  // Generate SVG cumulative chart for background with month labels
  const cumData = t.dailyCumulative || [];
  const maxTotal = cumData.length > 0 ? cumData[cumData.length - 1]?.total || 361 : 361;
  const chartPoints = cumData.map((d, i) => {
    const x = (i / 365) * 1800 + 60;
    const y = 850 - (d.total / maxTotal) * 650;
    return `${x},${y}`;
  }).join(' ');
  
  // Month labels along bottom
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthLabels = months.map((m, i) => {
    const x = (i / 12) * 1800 + 60 + 75;
    return `<text x="${x}" y="920" fill="rgba(255,255,255,0.4)" font-size="24" text-anchor="middle" font-family="Inter, sans-serif">${m}</text>`;
  }).join('');
  
  slides.push(`
    <section data-background="#0a0a0a">
      <svg class="bg-chart" viewBox="0 0 1920 1080" preserveAspectRatio="none">
        <polyline points="${chartPoints}" fill="none" stroke="rgba(255,107,53,0.2)" stroke-width="4"/>
        <polygon points="60,850 ${chartPoints} 1860,850" fill="rgba(255,107,53,0.08)"/>
        ${monthLabels}
      </svg>
      <div class="contrast-stats">
        <div class="stat-block">
          <span class="number">${t.busiestMonth.count}</span>
          <span class="label">${formatMonth(t.busiestMonth.month)}</span>
        </div>
        <div class="vs">vs</div>
        <div class="stat-block quiet">
          <span class="number">${t.quietestMonth.count}</span>
          <span class="label">${formatMonth(t.quietestMonth.month)}</span>
        </div>
      </div>
      <p class="annotation">busiest vs quietest</p>
    </section>
  `);
  
  // Streak + Gap combined with monthly calendar grid background
  const formatDateShort = (d) => {
    if (!d) return '';
    const date = new Date(d);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}`;
  };
  
  // Build watch dates set
  const watchDatesSet = new Set(cumData.map(d => d.date).filter(d => {
    const idx = cumData.findIndex(c => c.date === d);
    return idx > 0 && cumData[idx].total > cumData[idx-1].total;
  }));
  if (cumData.length > 0 && cumData[0].total > 0) {
    watchDatesSet.add(cumData[0].date);
  }
  
  // Build monthly calendar grid - all months at top, 6 columns x 2 rows
  const calendarCells = [];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const cellSize = 20;
  const cellGap = 2;
  const monthWidth = 170;
  const monthHeight = 160;
  const colSpacing = 185;
  const rowSpacing = 180;
  
  // All 12 months at top in 2 rows of 6
  const positions = [];
  for (let i = 0; i < 12; i++) {
    const col = i % 6;
    const row = Math.floor(i / 6);
    positions.push({
      month: i,
      x: 40 + col * colSpacing,
      y: 40 + row * rowSpacing
    });
  }
  
  for (const pos of positions) {
    const month = pos.month;
    const monthX = pos.x;
    const monthY = pos.y;
    
    // Month label
    calendarCells.push(`<text x="${monthX}" y="${monthY}" fill="rgba(255,255,255,0.5)" font-size="14" font-family="Inter, sans-serif" font-weight="600">${monthNames[month]}</text>`);
    
    // Day of week headers
    const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    for (let d = 0; d < 7; d++) {
      calendarCells.push(`<text x="${monthX + d * (cellSize + cellGap) + cellSize/2}" y="${monthY + 20}" fill="rgba(255,255,255,0.3)" font-size="9" font-family="Inter, sans-serif" text-anchor="middle">${dayLabels[d]}</text>`);
    }
    
    // Get first day of month and number of days
    const firstDay = new Date(2025, month, 1).getDay();
    const daysInMonth = new Date(2025, month + 1, 0).getDate();
    
    // Draw day cells
    for (let day = 1; day <= daysInMonth; day++) {
      const dayIndex = firstDay + day - 1;
      const weekRow = Math.floor(dayIndex / 7);
      const weekCol = dayIndex % 7;
      
      const dateStr = `2025-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const watched = watchDatesSet.has(dateStr);
      
      const x = monthX + weekCol * (cellSize + cellGap);
      const y = monthY + 28 + weekRow * (cellSize + cellGap);
      const fill = watched ? 'rgba(74,222,128,0.7)' : 'rgba(255,255,255,0.08)';
      
      calendarCells.push(`<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" rx="2" fill="${fill}"/>`);
    }
  }
  
  slides.push(`
    <section data-background="#0a0a0a">
      <div class="calendar-top">
        <svg viewBox="0 0 1150 400" preserveAspectRatio="xMidYMid meet" style="width: 100%; height: auto;">
          ${calendarCells.join('')}
        </svg>
      </div>
      <div class="streak-gap-bottom">
        <div class="streak-block">
          <span class="number green">${t.longestStreak}</span>
          <span class="unit">day streak</span>
          <span class="dates">${formatDateShort(t.streakStart)} – ${formatDateShort(t.streakEnd)}</span>
        </div>
        <div class="divider"></div>
        <div class="gap-block">
          <span class="number dim">${t.longestGap}</span>
          <span class="unit">day drought</span>
          <span class="dates">${formatDateShort(t.gapStart)} – ${formatDateShort(t.gapEnd)}</span>
        </div>
      </div>
    </section>
  `);
  
  slides.push(`
    <section data-background="#16213e">
      <h2 class="impact">${t.busiestWeekday.day.toUpperCase()}</h2>
      <p class="label">is my movie day</p>
      <p class="subtitle">${t.busiestWeekday.count} films watched on ${t.busiestWeekday.day}s</p>
    </section>
  `);
  
  // Weekday ratings analysis
  const bestDay = t.bestRatingDay;
  const worstDay = t.worstRatingDay;
  
  slides.push(`
    <section data-background="#0f0f23">
      <div class="weekday-ratings">
        <div class="best-day">
          <span class="day-name">${bestDay?.day || 'Sat'}</span>
          <span class="avg-rating">${(bestDay?.avgRating || 3.5).toFixed(2)}★</span>
          <span class="label">best vibes</span>
        </div>
        <div class="worst-day">
          <span class="day-name">${worstDay?.day || 'Wed'}</span>
          <span class="avg-rating">${(worstDay?.avgRating || 3.0).toFixed(2)}★</span>
          <span class="label">worst vibes</span>
        </div>
      </div>
      <p class="annotation">don't let me watch your favorite movie on a ${worstDay?.day || 'Wednesday'}</p>
    </section>
  `);
  
  slides.push(`
    <section data-background="#0a0a0a">
      <div class="big-number">${t.weekendPct}%</div>
      <p class="label">of films watched on weekends</p>
      <p class="annotation">${t.weekendPct > 50 ? 'weekend warrior' : 'weekday watcher'}</p>
    </section>
  `);
  
  // ============================================
  // HOW I RATE (6 slides) - GOLD theme
  // ============================================
  
  slides.push(`
    <section data-background="#1a1508" class="section-title-slide">
      <h2 class="section-title" style="color: #FFD700;">HOW I RATE</h2>
    </section>
  `);
  
  // Rating distribution
  const maxCount = Math.max(...Object.values(r.distribution));
  const ratingBars = Object.entries(r.distribution)
    .map(([rating, count]) => {
      const barWidth = Math.round((count / maxCount) * 420);
      return `<tr class="rating-row">
        <td class="stars">${'★'.repeat(parseInt(rating))}${'☆'.repeat(5 - parseInt(rating))}</td>
        <td class="bar-cell"><div class="bar" style="width: ${barWidth}px"></div></td>
        <td class="count">${count}</td>
      </tr>`;
    }).join('');
  
  slides.push(`
    <section data-background="#0f0f23">
      <table class="rating-chart">
        <tbody>
          ${ratingBars}
        </tbody>
      </table>
      <p class="annotation">rating distribution</p>
    </section>
  `);
  
  slides.push(`
    <section data-background="#16213e">
      <h2 class="impact">I'M A ${stars(r.mostCommonRating.stars)} PERSON</h2>
      <p class="subtitle">${r.mostCommonRating.count} films got ${r.mostCommonRating.stars} stars</p>
      <p class="annotation">${r.mostCommonRating.stars <= 3 ? 'tough crowd' : 'easily pleased'}</p>
    </section>
  `);
  
  slides.push(`
    <section data-background="#0a0a0a">
      <div class="big-number">${r.avgRating.toFixed(1)}</div>
      <p class="label">average rating</p>
      <p class="annotation">${r.avgRating < 3.5 ? "I don't hand out stars easily" : "I'm a generous rater"}</p>
    </section>
  `);
  
  slides.push(`
    <section data-background="#1a1a2e">
      <div class="contrast-stats">
        <div class="stat-block gold">
          <span class="number">${s.fiveStarCount}</span>
          <span class="label">★★★★★</span>
        </div>
        <div class="vs">vs</div>
        <div class="stat-block red">
          <span class="number">${s.oneStarCount}</span>
          <span class="label">★</span>
        </div>
      </div>
      <p class="annotation">masterpieces vs disasters</p>
    </section>
  `);
  
  // ============================================
  // FIVE-STAR DEEP DIVE (6 slides) - GREEN theme
  // ============================================
  
  slides.push(`
    <section data-background="#0a1a0a" class="section-title-slide">
      <h2 class="section-title" style="color: #4ADE80;">WHAT MAKES<br>A PERFECT MOVIE</h2>
    </section>
  `);
  
  // Five-star films showcase
  const fiveStarList = fs.films.slice(0, 8)
    .map(f => `<li>${escapeHtml(f.title)} <span class="year">(${f.year})</span></li>`)
    .join('');
  
  slides.push(`
    <section data-background="#0f0f23">
      <h3>My ${fs.count} five-star films include:</h3>
      <ul class="film-list">
        ${fiveStarList}
        ${fs.count > 8 ? `<li class="more">...and ${fs.count - 8} more</li>` : ''}
      </ul>
    </section>
  `);
  
  if (fs.topDirectors.length > 0) {
    slides.push(`
      <section data-background="#16213e">
        <h2 class="impact">${escapeHtml(fs.topDirectors[0].name)}</h2>
        <p class="subtitle">${fs.topDirectors[0].count} five-star films</p>
        <p class="annotation">my most reliable director</p>
      </section>
    `);
  }
  
  if (fs.topGenres.length > 0) {
    slides.push(`
      <section data-background="#0a0a0a">
        <h2 class="impact">${fs.topGenres[0].name.toUpperCase()}</h2>
        <p class="subtitle">${fs.topGenres[0].count} of my five-stars are ${fs.topGenres[0].name.toLowerCase()}</p>
        <p class="annotation">the genre that delivers</p>
      </section>
    `);
  }
  
  if (fs.topDecades.length > 0) {
    slides.push(`
      <section data-background="#1a1a2e">
        <h2 class="impact">THE ${fs.topDecades[0].decade}s</h2>
        <p class="subtitle">${fs.topDecades[0].count} five-star films from this decade</p>
        <p class="annotation">${fs.topDecades[0].decade >= 2000 ? 'living in the now' : 'chasing nostalgia'}</p>
      </section>
    `);
  }
  
  slides.push(`
    <section data-background="#0f0f23">
      <h3>A perfect movie for me is:</h3>
      <ul class="pattern-list">
        <li>Directed by <strong>${fs.topDirectors[0]?.name || 'someone great'}</strong></li>
        <li>A <strong>${fs.topGenres[0]?.name || 'drama'}</strong></li>
        <li>From the <strong>${fs.topDecades[0]?.decade || 2000}s</strong></li>
        <li>About <strong>${fs.avgRuntime}</strong> minutes long</li>
      </ul>
    </section>
  `);
  
  // ============================================
  // HOT TAKES / CONTROVERSY (8 slides)
  // ============================================
  
  // Filter out 1-star films - those aren't hot takes, just films you didn't like
  const filteredControversy = controversy ? {
    ...controversy,
    mostControversial: controversy.mostControversial.filter(f => f.userRating > 1),
    overrated: controversy.overrated.filter(f => f.userRating > 1),
    underrated: controversy.underrated,
  } : null;
  
  if (filteredControversy && filteredControversy.mostControversial.length > 0) {
    slides.push(`
      <section data-background="#1a0a0a" class="section-title-slide">
        <h2 class="section-title" style="color: #FF6B6B;">MY HOT TAKES</h2>
        <p class="subtitle">where I disagreed with everyone</p>
      </section>
    `);
    
    // Biggest disagreement
    const hottest = filteredControversy.mostControversial[0];
    if (hottest && hottest.diff !== undefined && hottest.diff !== null) {
      slides.push(`
        <section data-background="#1a1a2e">
          <h2 class="film-title">${escapeHtml(hottest.title)}</h2>
          <p class="year">(${hottest.year})</p>
          <div class="rating-compare">
            <div class="my-rating">
              <span class="label">ME</span>
              <span class="stars">${stars(hottest.userRating)}</span>
            </div>
            <div class="vs">vs</div>
            <div class="their-rating">
              <span class="label">LETTERBOXD</span>
              <span class="stars">${stars(hottest.letterboxdRating)}</span>
            </div>
          </div>
          <p class="annotation">${Math.abs(hottest.diff).toFixed(1)} stars apart</p>
        </section>
      `);
    }
    
    // Overrated (they loved, I didn't)
    if (filteredControversy.overrated.length > 0) {
      const overList = filteredControversy.overrated.slice(0, 5)
        .map(f => `<li>${escapeHtml(f.title)} <span class="rating-diff">You: ${stars(f.userRating)} | LB: ${stars(f.letterboxdRating)}</span></li>`)
        .join('');
      
      slides.push(`
        <section data-background="#0f0f23">
          <h3>OVERRATED</h3>
          <p class="subtitle">they loved it, I didn't</p>
          <ul class="controversy-list">
            ${overList}
          </ul>
        </section>
      `);
      
      // Spotlight on the most overrated
      const mostOverrated = filteredControversy.overrated[0];
      slides.push(`
        <section data-background="#16213e">
          <h2 class="impact">${escapeHtml(mostOverrated.title)}</h2>
          <div class="hot-take">
            <p>Letterboxd: <strong>${mostOverrated.letterboxdRating.toFixed(1)}★</strong></p>
            <p>Me: <strong>${mostOverrated.userRating}★</strong></p>
          </div>
          <p class="annotation">am I wrong? (no)</p>
        </section>
      `);
    }
    
    // Underrated (I loved, they didn't)
    if (filteredControversy.underrated.length > 0) {
      const underList = filteredControversy.underrated.slice(0, 5)
        .map(f => `<li>${escapeHtml(f.title)} <span class="rating-diff">You: ${stars(f.userRating)} | LB: ${stars(f.letterboxdRating)}</span></li>`)
        .join('');
      
      slides.push(`
        <section data-background="#0a0a0a">
          <h3>UNDERRATED</h3>
          <p class="subtitle">I loved it, they didn't</p>
          <ul class="controversy-list">
            ${underList}
          </ul>
        </section>
      `);
      
      // Spotlight
      const mostUnderrated = filteredControversy.underrated[0];
      slides.push(`
        <section data-background="#1a1a2e">
          <h2 class="impact">${escapeHtml(mostUnderrated.title)}</h2>
          <div class="hot-take">
            <p>Me: <strong>${mostUnderrated.userRating}★</strong></p>
            <p>Letterboxd: <strong>${mostUnderrated.letterboxdRating.toFixed(1)}★</strong></p>
          </div>
          <p class="annotation">they're sleeping on this</p>
        </section>
      `);
    }
    
    slides.push(`
      <section data-background="#0f0f23">
        <h2 class="editorial">Conclusion:</h2>
        <h2 class="impact">I have taste.<br>They don't.</h2>
      </section>
    `);
  }
  
  // ============================================
  // MY TASTE DNA (6 slides)
  // ============================================
  
  slides.push(`
    <section data-background="#1a0a1a" class="section-title-slide">
      <h2 class="section-title" style="color: #E879F9;">MY TASTE DNA</h2>
    </section>
  `);
  
  // Top genres
  const topGenresList = taste.topGenres.slice(0, 5)
    .map((g, i) => `<li><span class="rank">#${i+1}</span> ${g.name} <span class="count">(${g.count})</span></li>`)
    .join('');
  
  slides.push(`
    <section data-background="#0f0f23">
      <h3>TOP GENRES</h3>
      <ul class="ranked-list">
        ${topGenresList}
      </ul>
    </section>
  `);
  
  slides.push(`
    <section data-background="#16213e">
      <h2 class="impact">${taste.topGenres[0]?.name.toUpperCase() || 'DRAMA'}</h2>
      <div class="big-number">${taste.topGenres[0]?.count || 0}</div>
      <p class="annotation">${taste.topGenres[0]?.name.toLowerCase() || 'drama'} films watched</p>
    </section>
  `);
  
  // Top directors
  slides.push(`
    <section data-background="#0a0a0a">
      <h2 class="impact">${escapeHtml(taste.topDirectors[0]?.name || 'Unknown')}</h2>
      <div class="big-number">${taste.topDirectors[0]?.count || 0}</div>
      <p class="annotation">films from my top director</p>
    </section>
  `);
  
  // Director films list
  if (taste.topDirectors[0] && taste.filmsByDirector[taste.topDirectors[0].name]) {
    const dirFilms = taste.filmsByDirector[taste.topDirectors[0].name]
      .slice(0, 6)
      .map(f => `<li>${escapeHtml(f.title)} <span class="rating">${f.rating ? stars(f.rating) : ''}</span></li>`)
      .join('');
    
    slides.push(`
      <section data-background="#1a1a2e">
        <h3>${escapeHtml(taste.topDirectors[0].name)}'s films I watched:</h3>
        <ul class="film-list">
          ${dirFilms}
        </ul>
      </section>
    `);
  }
  
  // Decade breakdown
  slides.push(`
    <section data-background="#0f0f23">
      <h2 class="impact">THE ${taste.dominantDecade?.decade || 2020}s</h2>
      <div class="big-number">${taste.dominantDecade?.count || 0}</div>
      <p class="annotation">my dominant decade</p>
    </section>
  `);
  
  // ============================================
  // TEMPORAL PATTERNS (5 slides)
  // ============================================
  
  slides.push(`
    <section data-background="#0a1a1a" class="section-title-slide">
      <h2 class="section-title" style="color: #22D3D3;">WHEN I WATCH</h2>
    </section>
  `);
  
  slides.push(`
    <section data-background="#0f0f23">
      <h3>First film of ${insights.meta.year}:</h3>
      <h2 class="film-title">${escapeHtml(t.firstWatch.name)}</h2>
      <p class="date">${t.firstWatch.date}</p>
      <p class="rating">${t.firstWatch.rating ? stars(parseFloat(t.firstWatch.rating)) : ''}</p>
    </section>
  `);
  
  slides.push(`
    <section data-background="#16213e">
      <h3>Most recent:</h3>
      <h2 class="film-title">${escapeHtml(t.lastWatch.name)}</h2>
      <p class="date">${t.lastWatch.date}</p>
      <p class="rating">${t.lastWatch.rating ? stars(parseFloat(t.lastWatch.rating)) : ''}</p>
    </section>
  `);
  
  // ============================================
  // FUN FACTS (3 slides)
  // ============================================
  
  if (insights.highlights.oldestFilm) {
    slides.push(`
      <section data-background="#0a0a0a">
        <h3>Oldest film I watched:</h3>
        <h2 class="film-title">${escapeHtml(insights.highlights.oldestFilm.title)}</h2>
        <div class="big-number">${insights.highlights.oldestFilm.year}</div>
        <p class="annotation">${2025 - insights.highlights.oldestFilm.year} years old</p>
      </section>
    `);
  }
  
  if (insights.runtime.longestFilms[0]) {
    slides.push(`
      <section data-background="#1a1a2e">
        <h3>Longest sit:</h3>
        <h2 class="film-title">${escapeHtml(insights.runtime.longestFilms[0].title)}</h2>
        <div class="big-number">${insights.runtime.longestFilms[0].runtime}</div>
        <p class="label">minutes</p>
      </section>
    `);
  }
  
  if (insights.highlights.mostRewatched.length > 0) {
    const rewatchList = insights.highlights.mostRewatched.slice(0, 3)
      .map(f => `<li>${escapeHtml(f.title)} <span class="count">(${f.count}x)</span></li>`)
      .join('');
    
    slides.push(`
      <section data-background="#0f0f23">
        <h3>Most rewatched:</h3>
        <ul class="film-list">
          ${rewatchList}
        </ul>
        <p class="annotation">comfort food cinema</p>
      </section>
    `);
  }
  
  // ============================================
  // CLOSING (3 slides)
  // ============================================
  
  slides.push(`
    <section data-background="#1a1a2e">
      <h2 class="section-title">TL;DR</h2>
      <ul class="summary-list">
        <li><strong>${s.totalFilms}</strong> films in one year</li>
        <li><strong>${s.totalDays}</strong> days of my life</li>
        <li><strong>${s.avgRating.toFixed(1)}</strong> average rating</li>
        <li><strong>${taste.topGenres[0]?.name || 'Drama'}</strong> is my genre</li>
        <li><strong>${taste.topDirectors[0]?.name || 'Unknown'}</strong> is my director</li>
      </ul>
    </section>
  `);
  
  slides.push(`
    <section data-background="#0a0a0a">
      <h1 class="mega">THAT'S<br>A WRAP</h1>
      <p class="subtitle">2025</p>
    </section>
  `);
  
  slides.push(`
    <section data-background="#16213e">
      <h2 class="impact">QUESTIONS?</h2>
    </section>
  `);
  
  return slides;
}

function generateHtml(slides) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My 2025 in Film</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@4.6.0/dist/reveal.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@4.6.0/dist/theme/black.css">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@400;600;700&family=JetBrains+Mono:wght@400;700&display=swap');
    
    :root {
      --bg-dark: #0a0a0a;
      --accent: #ff6b35;
      --gold: #ffd700;
      --red: #ff3333;
    }
    
    html, body {
      margin: 0;
      padding: 0;
      overflow: hidden;
    }
    
    .reveal {
      font-family: 'Inter', sans-serif;
    }
    
    .reveal .slides {
      text-align: center;
    }
    
    .reveal .slides section {
      box-sizing: border-box;
      padding: 40px 60px;
      height: 100%;
      width: 100%;
      display: flex !important;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      overflow: hidden;
    }
    
    .reveal .slides section > * {
      max-width: 100%;
    }
    
    .reveal h1, .reveal h2, .reveal h3 {
      font-family: 'Anton', sans-serif;
      text-transform: uppercase;
      letter-spacing: 0.02em;
      margin: 0.2em 0;
    }
    
    .mega {
      font-size: 7em !important;
      line-height: 1;
      margin: 0 !important;
    }
    
    .impact {
      font-size: 4.5em !important;
      line-height: 1.1;
      margin: 0 !important;
    }
    
    .editorial {
      font-family: 'Inter', sans-serif !important;
      font-weight: 600;
      font-size: 3em !important;
      text-transform: none !important;
    }
    
    .section-title {
      font-size: 5em !important;
      color: var(--accent);
    }
    
    .big-number {
      font-family: 'Anton', sans-serif;
      font-size: 12em;
      line-height: 1;
      color: var(--accent);
      margin: 0.05em 0;
    }
    
    .label {
      font-size: 1.8em;
      opacity: 0.8;
      margin: 0.3em 0;
    }
    
    .subtitle {
      font-size: 1.5em;
      opacity: 0.7;
      margin: 0.5em 0;
    }
    
    .annotation {
      font-family: 'JetBrains Mono', monospace;
      font-size: 1.2em;
      color: var(--accent);
      margin: 0.8em 0;
    }
    
    .year {
      opacity: 0.6;
      font-size: 0.8em;
    }
    
    .stat-pair {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1.5em;
      flex-wrap: wrap;
    }
    
    .stat {
      text-align: center;
    }
    
    .stat .number {
      font-family: 'Anton', sans-serif;
      font-size: 7em;
      display: block;
      color: var(--accent);
      line-height: 1;
    }
    
    .stat .unit {
      font-size: 2em;
      opacity: 0.7;
    }
    
    .equals {
      font-size: 4em;
      opacity: 0.5;
    }
    
    .contrast-stats {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 2em;
      flex-wrap: wrap;
    }
    
    .stat-block {
      text-align: center;
    }
    
    .stat-block .number {
      font-family: 'Anton', sans-serif;
      font-size: 8em;
      display: block;
      line-height: 1;
    }
    
    .stat-block .label {
      font-size: 1.8em;
      margin-top: 0.2em;
    }
    
    .stat-block.gold .number { color: var(--gold); }
    .stat-block.red .number { color: #fff; }
    .stat-block.quiet .number { opacity: 0.4; }
    
    .vs {
      font-size: 1.8em;
      opacity: 0.5;
    }
    
    .rating-chart {
      border-collapse: collapse;
      margin: 0 auto;
    }
    
    .rating-chart .rating-row td {
      padding: 12px 20px;
      vertical-align: middle;
    }
    
    .rating-chart .stars {
      color: var(--gold);
      font-size: 2em;
      text-align: right;
      white-space: nowrap;
      letter-spacing: -2px;
    }
    
    .rating-chart .bar-cell {
      width: 450px;
    }
    
    .rating-chart .bar {
      height: 35px;
      background: var(--accent);
      min-width: 10px;
      border-radius: 3px;
    }
    
    .rating-chart .count {
      font-family: 'JetBrains Mono', monospace;
      font-size: 1.8em;
      opacity: 0.8;
      text-align: left;
    }
    
    .film-list, .ranked-list, .controversy-list, .summary-list, .pattern-list {
      list-style: none;
      padding: 0;
      text-align: left;
      max-width: 900px;
      margin: 0.8em auto;
      font-size: 1.3em;
    }
    
    .film-list li, .ranked-list li, .controversy-list li, .summary-list li, .pattern-list li {
      padding: 0.5em 0;
      border-bottom: 1px solid rgba(255,255,255,0.1);
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1em;
    }
    
    .film-list li.more {
      opacity: 0.5;
      font-style: italic;
    }
    
    .ranked-list .rank {
      color: var(--accent);
      margin-right: 0.5em;
      flex-shrink: 0;
    }
    
    .ranked-list .count {
      opacity: 0.5;
      flex-shrink: 0;
    }
    
    .rating-diff {
      font-size: 0.75em;
      opacity: 0.7;
      flex-shrink: 0;
    }
    
    .film-title {
      font-size: 3em !important;
      margin: 0.2em 0 !important;
    }
    
    .date {
      opacity: 0.6;
      font-size: 1.2em;
    }
    
    .rating {
      color: var(--gold);
      font-size: 2em;
    }
    
    .rating-compare {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 2.5em;
      margin: 1.5em 0;
      flex-wrap: wrap;
    }
    
    .rating-compare > div {
      text-align: center;
    }
    
    .rating-compare .label {
      font-size: 1.2em;
      opacity: 0.6;
      display: block;
      margin-bottom: 0.3em;
    }
    
    .rating-compare .stars {
      font-size: 3em;
      color: var(--gold);
    }
    
    .my-rating .stars { color: var(--accent); }
    
    .hot-take p {
      font-size: 1.3em;
      margin: 0.3em 0;
    }
    
    .pattern-list li {
      font-size: 1.1em;
    }
    
    .pattern-list strong {
      color: var(--accent);
    }
    
    /* Ensure text doesn't overflow */
    h1, h2, h3, p {
      word-wrap: break-word;
      overflow-wrap: break-word;
    }
    
    /* Section indicator */
    #section-indicator {
      position: fixed;
      bottom: 30px;
      left: 40px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 18px;
      color: var(--accent);
      opacity: 0.6;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      z-index: 100;
    }
    
    /* Background chart */
    .bg-chart {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 0;
      pointer-events: none;
    }
    
    .contrast-stats, .streak-gap-combo, .weekday-ratings {
      position: relative;
      z-index: 1;
    }
    
    /* Streak + Gap combo */
    .streak-gap-combo {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 3em;
    }
    
    .streak-block, .gap-block {
      text-align: center;
    }
    
    .streak-block .number, .gap-block .number {
      font-family: 'Anton', sans-serif;
      font-size: 8em;
      display: block;
      line-height: 1;
    }
    
    .streak-block .number.green { color: #4ADE80; }
    .gap-block .number.dim { color: #666; }
    
    .streak-block .unit, .gap-block .unit {
      font-size: 1.8em;
      opacity: 0.8;
      display: block;
      margin-top: 0.2em;
    }
    
    .streak-block .dates, .gap-block .dates {
      font-family: 'JetBrains Mono', monospace;
      font-size: 1em;
      opacity: 0.5;
      display: block;
      margin-top: 0.5em;
    }
    
    .streak-gap-combo .divider {
      width: 2px;
      height: 200px;
      background: rgba(255,255,255,0.2);
    }
    
    /* Calendar at top, numbers at bottom layout */
    .calendar-top {
      position: absolute;
      top: 30px;
      left: 50%;
      transform: translateX(-50%);
      width: 95%;
      max-width: 1500px;
    }
    
    .streak-gap-bottom {
      position: absolute;
      bottom: 60px;
      left: 0;
      right: 0;
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 120px;
    }
    
    .streak-gap-bottom .streak-block,
    .streak-gap-bottom .gap-block {
      text-align: center;
    }
    
    .streak-gap-bottom .number {
      font-family: 'Anton', sans-serif;
      font-size: 8rem;
      display: block;
      line-height: 1;
    }
    
    .streak-gap-bottom .number.green {
      color: #4ade80;
    }
    
    .streak-gap-bottom .number.dim {
      color: #666;
    }
    
    .streak-gap-bottom .unit {
      font-family: 'Inter', sans-serif;
      font-size: 2rem;
      color: #fff;
      display: block;
      margin-top: 8px;
    }
    
    .streak-gap-bottom .dates {
      font-family: 'JetBrains Mono', monospace;
      font-size: 1.2rem;
      color: rgba(255,255,255,0.5);
      display: block;
      margin-top: 8px;
    }
    
    .streak-gap-bottom .divider {
      width: 2px;
      height: 150px;
      background: rgba(255,255,255,0.2);
    }
    
    /* Weekday ratings */
    .weekday-ratings {
      display: flex;
      justify-content: center;
      gap: 4em;
    }
    
    .best-day, .worst-day {
      text-align: center;
    }
    
    .best-day .day-name, .worst-day .day-name {
      font-family: 'Anton', sans-serif;
      font-size: 5em;
      display: block;
      line-height: 1;
    }
    
    .best-day .day-name { color: #4ADE80; }
    .worst-day .day-name { color: #FF6B6B; }
    
    .best-day .avg-rating, .worst-day .avg-rating {
      font-size: 2.5em;
      display: block;
      margin: 0.3em 0;
      color: var(--gold);
    }
    
    .best-day .label, .worst-day .label {
      font-size: 1.2em;
      opacity: 0.6;
    }
    
    /* Section title slides - no border */
    .section-title-slide {
      /* clean look, no border */
    }
  </style>
</head>
<body>
  <div class="reveal">
    <div class="slides">
      ${slides.join('\n')}
    </div>
  </div>
  <div id="section-indicator"></div>
  <script src="https://cdn.jsdelivr.net/npm/reveal.js@4.6.0/dist/reveal.js"></script>
  <script>
    Reveal.initialize({
      hash: true,
      width: 1920,
      height: 1080,
      margin: 0.1,
      transition: 'none',
      backgroundTransition: 'none',
    });
    
    // Section indicator
    const sections = {
      0: '', 1: '', 2: '', 3: '', 4: '',
      5: 'THE NUMBERS', 6: 'THE NUMBERS', 7: 'THE NUMBERS', 8: 'THE NUMBERS',
      9: 'THE NUMBERS', 10: 'THE NUMBERS', 11: 'THE NUMBERS', 12: 'THE NUMBERS',
      13: 'HOW I RATE', 14: 'HOW I RATE', 15: 'HOW I RATE', 16: 'HOW I RATE', 17: 'HOW I RATE',
      18: 'FIVE STARS', 19: 'FIVE STARS', 20: 'FIVE STARS', 21: 'FIVE STARS', 22: 'FIVE STARS', 23: 'FIVE STARS',
      24: 'HOT TAKES', 25: 'HOT TAKES', 26: 'HOT TAKES', 27: 'HOT TAKES', 28: 'HOT TAKES', 29: 'HOT TAKES', 30: 'HOT TAKES',
      31: 'TASTE DNA', 32: 'TASTE DNA', 33: 'TASTE DNA', 34: 'TASTE DNA', 35: 'TASTE DNA', 36: 'TASTE DNA',
      37: 'WHEN I WATCH', 38: 'WHEN I WATCH', 39: 'WHEN I WATCH',
      40: 'FUN FACTS', 41: 'FUN FACTS', 42: 'FUN FACTS',
      43: '', 44: '', 45: ''
    };
    
    const indicator = document.getElementById('section-indicator');
    Reveal.on('slidechanged', event => {
      indicator.textContent = sections[event.indexh] || '';
    });
  </script>
</body>
</html>`;
}

function main() {
  console.log('🎬 Building presentation...\n');
  
  const insights = readJson(path.join(DATA_DIR, 'insights.json'));
  const controversy = readJson(path.join(DATA_DIR, 'controversy.json'));
  
  if (!insights) {
    console.error('❌ No insights.json found. Run extract_insights.js first.');
    process.exit(1);
  }
  
  console.log(`📊 Loaded insights for ${insights.meta.year}`);
  console.log(`📊 ${insights.summary.totalFilms} films, ${insights.summary.fiveStarCount} five-stars`);
  
  if (controversy) {
    console.log(`🔥 Loaded controversy data: ${controversy.meta.withRatings} films with LB ratings`);
  }
  
  const slides = generateSlides(insights, controversy);
  console.log(`\n📑 Generated ${slides.length} slides`);
  
  ensureDir(OUTPUT_DIR);
  const html = generateHtml(slides);
  const outputPath = path.join(OUTPUT_DIR, 'index.html');
  fs.writeFileSync(outputPath, html);
  
  console.log(`\n✅ Presentation saved to: ${outputPath}`);
  console.log(`\n🚀 Open in browser: file://${outputPath}`);
}

main();

