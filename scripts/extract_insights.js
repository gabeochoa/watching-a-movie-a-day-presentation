#!/usr/bin/env node
/**
 * Extract insights from Letterboxd data
 * Filters to 2025 only, includes five-star analysis
 * ZERO external dependencies - uses only Node.js built-ins
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const PROCESSED_DIR = path.join(ROOT, '01_csvs_processed');
const ENRICHED_DIR = path.join(ROOT, '02_tmdb_db_info');
const OUTPUT_DIR = path.join(ROOT, 'build', 'data');

const YEAR_FILTER = 2025;

function readJson(filepath) {
  return JSON.parse(fs.readFileSync(filepath, 'utf8'));
}

function writeJson(filepath, data) {
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function getWatchYear(entry) {
  const dateStr = entry['Watched Date'] || entry.Date;
  if (!dateStr) return null;
  return new Date(dateStr).getFullYear();
}

function main() {
  console.log(`📊 Extracting insights for ${YEAR_FILTER}...\n`);
  
  ensureDir(OUTPUT_DIR);
  
  // Load parsed diary data
  const parsed = readJson(path.join(PROCESSED_DIR, 'parsed.json'));
  const allDiary = parsed.diary || [];
  console.log(`📖 Loaded ${allDiary.length} total diary entries`);
  
  // Filter to target year only
  const diary = allDiary.filter(entry => getWatchYear(entry) === YEAR_FILTER);
  console.log(`📅 Filtered to ${diary.length} entries in ${YEAR_FILTER}`);
  
  // Load enrichment data
  const enrichmentRaw = readJson(path.join(ENRICHED_DIR, 'enrichment_by_film.json'));
  const enrichment = new Map(enrichmentRaw);
  console.log(`🎬 Loaded ${enrichment.size} enriched films`);
  
  // Load aggregates for reference
  const aggregates = readJson(path.join(ENRICHED_DIR, 'enriched_aggregates.json'));
  
  // ==========================================
  // BUILD FILMS LIST WITH ALL DATA
  // ==========================================
  
  const films = [];
  const filmKeys = new Set();
  
  for (const entry of diary) {
    const title = entry.Name?.trim();
    const year = entry.Year?.trim();
    if (!title) continue;
    
    const key = `${title} (${year || 'n/a'})`;
    if (filmKeys.has(key)) continue;
    filmKeys.add(key);
    
    const enrich = enrichment.get(key);
    
    // Get user's ratings for this film in the target year
    const userRatings = diary
      .filter(d => d.Name?.trim() === title && d.Year?.trim() === year && d.Rating)
      .map(d => parseFloat(d.Rating))
      .filter(r => !isNaN(r));
    const userRating = userRatings.length ? userRatings.reduce((a,b) => a+b) / userRatings.length : null;
    
    // Get watch dates in target year
    const watchDates = diary
      .filter(d => d.Name?.trim() === title && d.Year?.trim() === year)
      .map(d => d['Watched Date'] || d.Date)
      .filter(Boolean)
      .sort();
    
    // Get Letterboxd URI for scraping later
    const letterboxdUri = diary.find(d => d.Name?.trim() === title && d.Year?.trim() === year)?.['Letterboxd URI'] || null;
    
    films.push({
      key,
      title,
      year: year ? parseInt(year) : null,
      userRating,
      letterboxdUri,
      runtime: enrich?.runtime || null,
      genres: enrich?.genres || [],
      directors: enrich?.directors || [],
      watchDates,
      watchCount: watchDates.length,
    });
  }
  
  console.log(`\n🎞️  Processed ${films.length} unique films in ${YEAR_FILTER}`);
  
  // ==========================================
  // RATING ANALYSIS
  // ==========================================
  
  const fiveStarFilms = films.filter(f => f.userRating === 5);
  const fourStarFilms = films.filter(f => f.userRating === 4);
  const fourPlusFilms = films.filter(f => f.userRating >= 4);
  const oneStarFilms = films.filter(f => f.userRating === 1);
  const twoStarFilms = films.filter(f => f.userRating === 2);
  const lowRatedFilms = films.filter(f => f.userRating && f.userRating <= 2);
  
  const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const film of films) {
    if (film.userRating) {
      const rounded = Math.round(film.userRating);
      if (ratingCounts[rounded] !== undefined) {
        ratingCounts[rounded]++;
      }
    }
  }
  
  const ratedFilms = films.filter(f => f.userRating);
  const avgRating = ratedFilms.length 
    ? (ratedFilms.reduce((sum, f) => sum + f.userRating, 0) / ratedFilms.length)
    : 0;
  
  const mostCommonRating = Object.entries(ratingCounts)
    .sort((a, b) => b[1] - a[1])[0];
  
  // ==========================================
  // FIVE-STAR DEEP DIVE
  // ==========================================
  
  // Directors in five-stars
  const fiveStarDirectors = {};
  for (const film of fiveStarFilms) {
    for (const director of film.directors) {
      fiveStarDirectors[director] = (fiveStarDirectors[director] || 0) + 1;
    }
  }
  const topFiveStarDirectors = Object.entries(fiveStarDirectors)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
  
  // Genres in five-stars
  const fiveStarGenres = {};
  for (const film of fiveStarFilms) {
    for (const genre of film.genres) {
      fiveStarGenres[genre] = (fiveStarGenres[genre] || 0) + 1;
    }
  }
  const topFiveStarGenres = Object.entries(fiveStarGenres)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
  
  // Decades in five-stars
  const fiveStarDecades = {};
  for (const film of fiveStarFilms) {
    if (film.year) {
      const decade = Math.floor(film.year / 10) * 10;
      fiveStarDecades[decade] = (fiveStarDecades[decade] || 0) + 1;
    }
  }
  const topFiveStarDecades = Object.entries(fiveStarDecades)
    .map(([decade, count]) => ({ decade: parseInt(decade), count }))
    .sort((a, b) => b.count - a.count);
  
  // Average runtime of five-stars
  const fiveStarRuntimes = fiveStarFilms.map(f => f.runtime).filter(r => r && r > 0);
  const avgFiveStarRuntime = fiveStarRuntimes.length 
    ? Math.round(fiveStarRuntimes.reduce((a,b) => a+b) / fiveStarRuntimes.length)
    : 0;
  
  // ==========================================
  // OVERALL TASTE ANALYSIS
  // ==========================================
  
  // Genre breakdown
  const genreCounts = {};
  for (const film of films) {
    for (const genre of film.genres) {
      genreCounts[genre] = (genreCounts[genre] || 0) + 1;
    }
  }
  const topGenres = Object.entries(genreCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
  
  // Director breakdown
  const directorCounts = {};
  for (const film of films) {
    for (const director of film.directors) {
      directorCounts[director] = (directorCounts[director] || 0) + 1;
    }
  }
  const topDirectors = Object.entries(directorCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
  
  // Films by top directors
  const filmsByDirector = {};
  for (const director of topDirectors.slice(0, 10)) {
    filmsByDirector[director.name] = films
      .filter(f => f.directors.includes(director.name))
      .map(f => ({ title: f.title, year: f.year, rating: f.userRating }));
  }
  
  // Decade breakdown
  const decadeCounts = {};
  for (const film of films) {
    if (film.year) {
      const decade = Math.floor(film.year / 10) * 10;
      decadeCounts[decade] = (decadeCounts[decade] || 0) + 1;
    }
  }
  const decades = Object.entries(decadeCounts)
    .map(([decade, count]) => ({ decade: parseInt(decade), count }))
    .sort((a, b) => a.decade - b.decade);
  const dominantDecade = [...decades].sort((a, b) => b.count - a.count)[0];
  
  // ==========================================
  // TEMPORAL PATTERNS
  // ==========================================
  
  const allWatchDates = diary
    .map(d => d['Watched Date'] || d.Date)
    .filter(Boolean)
    .sort();
  
  const watchesByMonth = {};
  const watchesByWeekday = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  for (const dateStr of allWatchDates) {
    const date = new Date(dateStr);
    const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    watchesByMonth[yearMonth] = (watchesByMonth[yearMonth] || 0) + 1;
    watchesByWeekday[date.getDay()]++;
  }
  
  const monthlyData = Object.entries(watchesByMonth)
    .map(([month, count]) => ({ month, count }))
    .sort((a, b) => a.month.localeCompare(b.month));
  
  const weekdayData = Object.entries(watchesByWeekday)
    .map(([day, count]) => ({ day: weekdayNames[parseInt(day)], count, dayNum: parseInt(day) }))
    .sort((a, b) => b.count - a.count);
  
  const busiestMonth = monthlyData.reduce((a, b) => b.count > a.count ? b : a, { count: 0 });
  const quietestMonth = monthlyData.filter(m => m.count > 0).reduce((a, b) => b.count < a.count ? b : a, { count: Infinity });
  const busiestWeekday = weekdayData[0];
  
  // Weekend vs weekday
  const weekendCount = (watchesByWeekday[0] || 0) + (watchesByWeekday[6] || 0);
  const weekdayCount = diary.length - weekendCount;
  const weekendPct = Math.round((weekendCount / diary.length) * 100);
  
  // Streaks and gaps with date ranges
  const sortedDates = [...new Set(allWatchDates)].sort();
  let longestStreak = 1, currentStreak = 1;
  let longestGap = 0;
  let streakStart = sortedDates[0], streakEnd = sortedDates[0];
  let currentStreakStart = sortedDates[0];
  let gapStart = '', gapEnd = '';
  
  for (let i = 1; i < sortedDates.length; i++) {
    const prev = new Date(sortedDates[i - 1]);
    const curr = new Date(sortedDates[i]);
    const diffDays = Math.round((curr - prev) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      currentStreak++;
      if (currentStreak > longestStreak) {
        longestStreak = currentStreak;
        streakStart = currentStreakStart;
        streakEnd = sortedDates[i];
      }
    } else {
      currentStreak = 1;
      currentStreakStart = sortedDates[i];
      if (diffDays > longestGap) {
        longestGap = diffDays;
        gapStart = sortedDates[i - 1];
        gapEnd = sortedDates[i];
      }
    }
  }
  
  // Average rating by weekday
  const ratingsByWeekday = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
  for (const entry of diary) {
    const dateStr = entry['Watched Date'] || entry.Date;
    const rating = parseFloat(entry.Rating);
    if (dateStr && !isNaN(rating)) {
      const day = new Date(dateStr).getDay();
      ratingsByWeekday[day].push(rating);
    }
  }
  
  const avgRatingByWeekday = Object.entries(ratingsByWeekday).map(([day, ratings]) => ({
    day: weekdayNames[parseInt(day)],
    dayNum: parseInt(day),
    avgRating: ratings.length ? (ratings.reduce((a,b) => a+b) / ratings.length) : 0,
    count: ratings.length,
  })).sort((a, b) => b.avgRating - a.avgRating);
  
  const bestRatingDay = avgRatingByWeekday[0];
  const worstRatingDay = avgRatingByWeekday[avgRatingByWeekday.length - 1];
  
  // Daily cumulative data for chart
  const dailyCumulative = [];
  let cumTotal = 0;
  const startDate = new Date('2025-01-01');
  const endDate = new Date('2025-12-31');
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    const watchedToday = allWatchDates.filter(wd => wd === dateStr).length;
    cumTotal += watchedToday;
    dailyCumulative.push({ date: dateStr, total: cumTotal });
  }
  
  // ==========================================
  // RUNTIME STATS
  // ==========================================
  
  const runtimes = films.map(f => f.runtime).filter(r => r && r > 0);
  const avgRuntime = runtimes.length ? Math.round(runtimes.reduce((a,b) => a+b) / runtimes.length) : 110;
  const totalMinutes = runtimes.reduce((a,b) => a+b, 0);
  const totalHours = Math.round(totalMinutes / 60);
  const totalDays = Math.round(totalHours / 24 * 10) / 10;
  
  const longestFilms = films.filter(f => f.runtime).sort((a, b) => b.runtime - a.runtime).slice(0, 5);
  const shortestFilms = films.filter(f => f.runtime && f.runtime > 30).sort((a, b) => a.runtime - b.runtime).slice(0, 5);
  
  // ==========================================
  // SPECIAL FILMS
  // ==========================================
  
  const firstWatch = diary.reduce((a, b) => {
    const dateA = a['Watched Date'] || a.Date;
    const dateB = b['Watched Date'] || b.Date;
    return dateA < dateB ? a : b;
  });
  
  const lastWatch = diary.reduce((a, b) => {
    const dateA = a['Watched Date'] || a.Date;
    const dateB = b['Watched Date'] || b.Date;
    return dateA > dateB ? a : b;
  });
  
  const oldestFilm = films.filter(f => f.year).sort((a, b) => a.year - b.year)[0];
  const newestFilm = films.filter(f => f.year).sort((a, b) => b.year - a.year)[0];
  
  // Most rewatched
  const rewatchCounts = {};
  for (const entry of diary) {
    const key = `${entry.Name?.trim()} (${entry.Year?.trim() || 'n/a'})`;
    rewatchCounts[key] = (rewatchCounts[key] || 0) + 1;
  }
  const mostRewatched = Object.entries(rewatchCounts)
    .filter(([_, count]) => count > 1)
    .map(([key, count]) => {
      const film = films.find(f => f.key === key);
      return { key, count, title: film?.title, year: film?.year };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  
  // ==========================================
  // BUILD OUTPUT
  // ==========================================
  
  const insights = {
    meta: {
      year: YEAR_FILTER,
      generatedAt: new Date().toISOString(),
    },
    summary: {
      totalFilms: films.length,
      totalWatches: diary.length,
      totalHours,
      totalDays,
      avgRating: Math.round(avgRating * 100) / 100,
      avgRuntime,
      fiveStarCount: fiveStarFilms.length,
      fourStarCount: fourStarFilms.length,
      oneStarCount: oneStarFilms.length,
      twoStarCount: twoStarFilms.length,
      uniqueDirectors: Object.keys(directorCounts).length,
      uniqueGenres: Object.keys(genreCounts).length,
    },
    ratings: {
      distribution: ratingCounts,
      avgRating: Math.round(avgRating * 100) / 100,
      mostCommonRating: { stars: parseInt(mostCommonRating[0]), count: mostCommonRating[1] },
      fiveStarFilms: fiveStarFilms.map(f => ({ 
        title: f.title, 
        year: f.year, 
        directors: f.directors,
        genres: f.genres,
        runtime: f.runtime,
        letterboxdUri: f.letterboxdUri,
      })),
      oneStarFilms: oneStarFilms.map(f => ({ 
        title: f.title, 
        year: f.year,
        directors: f.directors,
        letterboxdUri: f.letterboxdUri,
      })),
      lowRatedFilms: lowRatedFilms.map(f => ({
        title: f.title,
        year: f.year,
        rating: f.userRating,
        letterboxdUri: f.letterboxdUri,
      })),
    },
    fiveStarAnalysis: {
      count: fiveStarFilms.length,
      topDirectors: topFiveStarDirectors.slice(0, 10),
      topGenres: topFiveStarGenres.slice(0, 10),
      topDecades: topFiveStarDecades.slice(0, 5),
      avgRuntime: avgFiveStarRuntime,
      films: fiveStarFilms.map(f => ({
        title: f.title,
        year: f.year,
        directors: f.directors,
        genres: f.genres,
        runtime: f.runtime,
      })),
    },
    taste: {
      topGenres: topGenres.slice(0, 15),
      topDirectors: topDirectors.slice(0, 20),
      filmsByDirector,
      decades,
      dominantDecade,
    },
    temporal: {
      firstWatch: { 
        name: firstWatch.Name, 
        date: firstWatch['Watched Date'] || firstWatch.Date, 
        rating: firstWatch.Rating 
      },
      lastWatch: { 
        name: lastWatch.Name, 
        date: lastWatch['Watched Date'] || lastWatch.Date, 
        rating: lastWatch.Rating 
      },
      busiestMonth,
      quietestMonth,
      busiestWeekday,
      weekendPct,
      weekdayData,
      monthlyData,
      longestStreak,
      longestGap,
      streakStart,
      streakEnd,
      gapStart,
      gapEnd,
      avgRatingByWeekday,
      bestRatingDay,
      worstRatingDay,
      dailyCumulative,
    },
    runtime: {
      avgRuntime,
      avgFiveStarRuntime,
      totalHours,
      longestFilms: longestFilms.map(f => ({ title: f.title, runtime: f.runtime, year: f.year })),
      shortestFilms: shortestFilms.map(f => ({ title: f.title, runtime: f.runtime, year: f.year })),
    },
    highlights: {
      oldestFilm: oldestFilm ? { title: oldestFilm.title, year: oldestFilm.year } : null,
      newestFilm: newestFilm ? { title: newestFilm.title, year: newestFilm.year } : null,
      mostRewatched,
    },
  };
  
  // Write outputs
  writeJson(path.join(OUTPUT_DIR, 'films.json'), films);
  writeJson(path.join(OUTPUT_DIR, 'insights.json'), insights);
  
  // ==========================================
  // PRINT SUMMARY
  // ==========================================
  
  console.log('\n' + '='.repeat(60));
  console.log(`📊 ${YEAR_FILTER} INSIGHTS`);
  console.log('='.repeat(60));
  
  console.log(`\n🎬 TOTAL: ${insights.summary.totalFilms} unique films, ${insights.summary.totalWatches} watches`);
  console.log(`⏱️  TIME: ${insights.summary.totalHours} hours (${insights.summary.totalDays} days)`);
  console.log(`⭐ AVG RATING: ${insights.summary.avgRating} stars`);
  
  console.log(`\n📊 RATING DISTRIBUTION:`);
  Object.entries(ratingCounts).forEach(([stars, count]) => {
    const bar = '█'.repeat(Math.round(count / 5));
    console.log(`   ${'★'.repeat(parseInt(stars))}${'☆'.repeat(5-parseInt(stars))}: ${count} ${bar}`);
  });
  
  console.log(`\n🏆 5-STAR FILMS (${fiveStarFilms.length}):`);
  fiveStarFilms.slice(0, 5).forEach(f => console.log(`   • ${f.title} (${f.year})`));
  if (fiveStarFilms.length > 5) console.log(`   ... and ${fiveStarFilms.length - 5} more`);
  
  console.log(`\n⭐ FIVE-STAR ANALYSIS:`);
  console.log(`   Top director: ${topFiveStarDirectors[0]?.name || 'N/A'} (${topFiveStarDirectors[0]?.count || 0} films)`);
  console.log(`   Top genre: ${topFiveStarGenres[0]?.name || 'N/A'} (${topFiveStarGenres[0]?.count || 0} films)`);
  console.log(`   Top decade: ${topFiveStarDecades[0]?.decade || 'N/A'}s (${topFiveStarDecades[0]?.count || 0} films)`);
  console.log(`   Avg runtime: ${avgFiveStarRuntime} min (overall: ${avgRuntime} min)`);
  
  if (oneStarFilms.length > 0) {
    console.log(`\n💀 1-STAR FILMS (${oneStarFilms.length}):`);
    oneStarFilms.forEach(f => console.log(`   • ${f.title} (${f.year})`));
  }
  
  console.log(`\n🎭 TOP GENRES:`);
  topGenres.slice(0, 5).forEach((g, i) => console.log(`   ${i+1}. ${g.name}: ${g.count}`));
  
  console.log(`\n🎬 TOP DIRECTORS:`);
  topDirectors.slice(0, 5).forEach((d, i) => console.log(`   ${i+1}. ${d.name}: ${d.count}`));
  
  console.log(`\n📅 TEMPORAL:`);
  console.log(`   First: ${insights.temporal.firstWatch.name} (${insights.temporal.firstWatch.date})`);
  console.log(`   Last: ${insights.temporal.lastWatch.name} (${insights.temporal.lastWatch.date})`);
  console.log(`   Busiest month: ${busiestMonth.month} (${busiestMonth.count} films)`);
  console.log(`   Favorite day: ${busiestWeekday.day} (${busiestWeekday.count} films)`);
  console.log(`   Weekend: ${weekendPct}%`);
  console.log(`   Longest streak: ${longestStreak} days`);
  console.log(`   Longest gap: ${longestGap} days`);
  
  console.log('\n' + '='.repeat(60));
  console.log('📁 OUTPUT FILES:');
  console.log(`   ${path.join(OUTPUT_DIR, 'films.json')}`);
  console.log(`   ${path.join(OUTPUT_DIR, 'insights.json')}`);
  console.log('='.repeat(60));
}

main();
