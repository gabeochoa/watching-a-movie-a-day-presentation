#!/usr/bin/env node
/**
 * Validate all slide numbers against the computed data
 * Filters to only 2025 watched films
 */

import fs from 'fs-extra';
import path from 'path';

const SLIDES_DIR = 'build/presentation/slides';

async function main() {
  const parsed = await fs.readJson('01_csvs_processed/parsed.json');
  const enriched = await fs.readJson('02_tmdb_db_info/enriched_aggregates.json');
  const enrichmentByFilmRaw = await fs.readJson('02_tmdb_db_info/enrichment_by_film.json');
  
  // Convert array of [key, data] to a Map for easy lookup
  const enrichmentMap = new Map();
  for (const entry of enrichmentByFilmRaw) {
    if (Array.isArray(entry) && entry.length === 2) {
      enrichmentMap.set(entry[0], entry[1]);
    }
  }

  // Filter diary to 2025 only
  const diary2025 = parsed.diary.filter(d => {
    const watchedDate = d['Watched Date'] || d.Date;
    return watchedDate && watchedDate.startsWith('2025');
  });

  console.log('='.repeat(60));
  console.log('2025 FILM STATISTICS (for slide validation)');
  console.log('='.repeat(60));
  console.log('');

  // Basic counts
  const totalWatches = diary2025.length;
  const uniqueFilms = new Set();
  const filmDataMap = new Map(); // key -> film data

  for (const row of diary2025) {
    const title = (row.Name || '').trim();
    const year = (row.Year || '').trim();
    const key = `${title} (${year})`;
    uniqueFilms.add(key);
    if (!filmDataMap.has(key)) {
      filmDataMap.set(key, { title, year, watches: [] });
    }
    filmDataMap.get(key).watches.push(row);
  }

  const rewatches = diary2025.filter(d => 
    d.Rewatch && d.Rewatch.toLowerCase() === 'yes'
  ).length;

  const ratings = diary2025
    .filter(d => d.Rating && parseFloat(d.Rating) > 0)
    .map(d => parseFloat(d.Rating));
  
  const avgRating = ratings.length > 0 
    ? ratings.reduce((a, b) => a + b, 0) / ratings.length 
    : 0;

  // Calculate total runtime from enrichment data
  let totalRuntimeMinutes = 0;
  let filmsWithRuntime = 0;
  
  for (const [key, filmData] of filmDataMap) {
    // Find matching enrichment using the key format "Title (Year)"
    const lookupKey = `${filmData.title} (${filmData.year})`;
    const enrichment = enrichmentMap.get(lookupKey);
    if (enrichment && enrichment.runtime) {
      totalRuntimeMinutes += enrichment.runtime * filmData.watches.length;
      filmsWithRuntime++;
    }
  }
  
  const totalHours = Math.round(totalRuntimeMinutes / 60);
  const totalDays = Math.round(totalHours / 24);

  console.log('BASIC STATS:');
  console.log(`  Total watches (diary entries): ${totalWatches}`);
  console.log(`  Unique films: ${uniqueFilms.size}`);
  console.log(`  Rewatches: ${rewatches}`);
  console.log(`  First-time watches: ${totalWatches - rewatches}`);
  console.log(`  Films with ratings: ${ratings.length}`);
  console.log(`  Average rating: ${avgRating.toFixed(2)}`);
  console.log(`  Total runtime: ${totalHours} hours (${totalDays} days)`);
  console.log(`  Films with runtime data: ${filmsWithRuntime}/${uniqueFilms.size}`);
  console.log('');

  // Watches by month
  const watchesByMonth = {};
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  for (const row of diary2025) {
    const watchedDate = row['Watched Date'] || row.Date;
    if (!watchedDate) continue;
    const month = parseInt(watchedDate.split('-')[1], 10) - 1;
    const monthName = MONTHS[month];
    watchesByMonth[monthName] = (watchesByMonth[monthName] || 0) + 1;
  }

  console.log('WATCHES BY MONTH:');
  for (const month of MONTHS) {
    console.log(`  ${month}: ${watchesByMonth[month] || 0}`);
  }
  const maxMonth = Object.entries(watchesByMonth).sort((a, b) => b[1] - a[1])[0];
  console.log(`  Peak month: ${maxMonth[0]} (${maxMonth[1]} films)`);
  console.log('');

  // Watches by weekday
  const watchesByWeekday = [0, 0, 0, 0, 0, 0, 0]; // Sun-Sat
  const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  for (const row of diary2025) {
    const watchedDate = row['Watched Date'] || row.Date;
    if (!watchedDate) continue;
    const d = new Date(watchedDate);
    watchesByWeekday[d.getDay()]++;
  }

  console.log('WATCHES BY WEEKDAY:');
  for (let i = 0; i < 7; i++) {
    console.log(`  ${WEEKDAYS[i]}: ${watchesByWeekday[i]}`);
  }
  const maxWeekdayIdx = watchesByWeekday.indexOf(Math.max(...watchesByWeekday));
  console.log(`  Most active day: ${WEEKDAYS[maxWeekdayIdx]} (${watchesByWeekday[maxWeekdayIdx]} films)`);
  console.log('');

  // Rating distribution
  const ratingDist = {};
  for (const r of ratings) {
    ratingDist[r] = (ratingDist[r] || 0) + 1;
  }

  console.log('RATING DISTRIBUTION:');
  for (const r of [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5]) {
    console.log(`  ${r} stars: ${ratingDist[r] || 0}`);
  }
  console.log('');

  // Top directors (need to filter enrichment to 2025 films only)
  const directorCounts = {};
  for (const [key, filmData] of filmDataMap) {
    const lookupKey = `${filmData.title} (${filmData.year})`;
    const enrichment = enrichmentMap.get(lookupKey);
    if (enrichment && enrichment.directors) {
      for (const director of enrichment.directors) {
        directorCounts[director] = (directorCounts[director] || 0) + 1;
      }
    }
  }
  
  const topDirectors = Object.entries(directorCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  console.log('TOP 10 DIRECTORS:');
  for (const [name, count] of topDirectors) {
    console.log(`  ${name}: ${count}`);
  }
  console.log('');

  // Top genres
  const genreCounts = {};
  for (const [key, filmData] of filmDataMap) {
    const lookupKey = `${filmData.title} (${filmData.year})`;
    const enrichment = enrichmentMap.get(lookupKey);
    if (enrichment && enrichment.genres) {
      for (const genre of enrichment.genres) {
        genreCounts[genre] = (genreCounts[genre] || 0) + 1;
      }
    }
  }
  
  const topGenres = Object.entries(genreCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  console.log('TOP 10 GENRES:');
  for (const [name, count] of topGenres) {
    console.log(`  ${name}: ${count}`);
  }
  console.log('');

  // Calculate streaks and gaps
  const sortedDates = diary2025
    .map(d => d['Watched Date'] || d.Date)
    .filter(Boolean)
    .sort();
  
  const uniqueDates = [...new Set(sortedDates)].sort();
  
  let longestStreak = 1;
  let currentStreak = 1;
  let streakStart = uniqueDates[0];
  let longestStreakStart = uniqueDates[0];
  let longestStreakEnd = uniqueDates[0];
  
  let longestGap = 0;
  let gapStart = '';
  let gapEnd = '';
  
  for (let i = 1; i < uniqueDates.length; i++) {
    const prev = new Date(uniqueDates[i - 1]);
    const curr = new Date(uniqueDates[i]);
    const diffDays = Math.round((curr - prev) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      currentStreak++;
      if (currentStreak > longestStreak) {
        longestStreak = currentStreak;
        longestStreakStart = streakStart;
        longestStreakEnd = uniqueDates[i];
      }
    } else {
      currentStreak = 1;
      streakStart = uniqueDates[i];
      
      if (diffDays > longestGap) {
        longestGap = diffDays;
        gapStart = uniqueDates[i - 1];
        gapEnd = uniqueDates[i];
      }
    }
  }

  console.log('STREAKS & GAPS:');
  console.log(`  Longest streak: ${longestStreak} days`);
  console.log(`    From: ${longestStreakStart} to ${longestStreakEnd}`);
  console.log(`  Longest gap: ${longestGap} days`);
  console.log(`    From: ${gapStart} to ${gapEnd}`);
  console.log(`  Days with at least one film: ${uniqueDates.length}`);
  console.log('');

  // 5-star films
  const fiveStarFilms = diary2025
    .filter(d => parseFloat(d.Rating) === 5)
    .map(d => `${d.Name} (${d.Year})`);
  
  console.log(`5-STAR FILMS (${fiveStarFilms.length} total):`);
  const uniqueFiveStars = [...new Set(fiveStarFilms)];
  for (const film of uniqueFiveStars) {
    console.log(`  ${film}`);
  }
  console.log('');

  // Films by release decade
  const decadeCounts = {};
  for (const row of diary2025) {
    const year = parseInt(row.Year, 10);
    if (!isNaN(year)) {
      const decade = Math.floor(year / 10) * 10;
      decadeCounts[decade] = (decadeCounts[decade] || 0) + 1;
    }
  }
  
  console.log('FILMS BY RELEASE DECADE:');
  const sortedDecades = Object.entries(decadeCounts).sort((a, b) => parseInt(a[0]) - parseInt(b[0]));
  for (const [decade, count] of sortedDecades) {
    console.log(`  ${decade}s: ${count}`);
  }
  console.log('');

  // 2025 releases watched
  const films2025Release = diary2025.filter(d => d.Year === '2025');
  console.log(`2025 RELEASES WATCHED: ${films2025Release.length}`);
  for (const film of films2025Release.slice(0, 10)) {
    console.log(`  ${film.Name}`);
  }
  if (films2025Release.length > 10) {
    console.log(`  ... and ${films2025Release.length - 10} more`);
  }
  console.log('');

  console.log('='.repeat(60));
  console.log('Now comparing with existing slides...');
  console.log('='.repeat(60));
  console.log('');

  // Read all slides and extract numbers
  const slideFiles = await fs.readdir(SLIDES_DIR);
  const issues = [];

  for (const file of slideFiles.sort()) {
    if (!file.endsWith('.html')) continue;
    const content = await fs.readFile(path.join(SLIDES_DIR, file), 'utf-8');
    
    // Extract key numbers from slides
    // Slide 3: unique films
    if (file === 'slide-003.html') {
      const match = content.match(/<span class="number">(\d+)<\/span>\s*<span class="label">unique films/);
      if (match) {
        const slideValue = parseInt(match[1], 10);
        if (slideValue !== uniqueFilms.size) {
          issues.push({
            slide: file,
            field: 'unique films',
            current: slideValue,
            correct: uniqueFilms.size
          });
        }
      }
    }
    
    // Slide 4: hours and days
    if (file === 'slide-004.html') {
      const hoursMatch = content.match(/<span class="number">(\d+)<\/span>\s*<span class="unit">hours/);
      const daysMatch = content.match(/<span class="number">(\d+)<\/span>\s*<span class="unit">days/);
      if (hoursMatch) {
        const slideHours = parseInt(hoursMatch[1], 10);
        if (Math.abs(slideHours - totalHours) > 5) {
          issues.push({
            slide: file,
            field: 'hours',
            current: slideHours,
            correct: totalHours
          });
        }
      }
      if (daysMatch) {
        const slideDays = parseInt(daysMatch[1], 10);
        if (Math.abs(slideDays - totalDays) > 1) {
          issues.push({
            slide: file,
            field: 'days',
            current: slideDays,
            correct: totalDays
          });
        }
      }
    }

    // Slide 5 (films by month) - check monthly counts
    if (file === 'slide-005.html') {
      for (const month of MONTHS) {
        const regex = new RegExp(`<span class="count[^"]*">(\\d+)<\\/span>[\\s\\S]*?<span class="month-label">${month}<\\/span>`, 'i');
        const match = content.match(regex);
        if (match) {
          const slideCount = parseInt(match[1], 10);
          const correctCount = watchesByMonth[month] || 0;
          if (slideCount !== correctCount) {
            issues.push({
              slide: file,
              field: `${month} count`,
              current: slideCount,
              correct: correctCount
            });
          }
        }
      }
    }
  }

  if (issues.length > 0) {
    console.log('ISSUES FOUND:');
    for (const issue of issues) {
      console.log(`  ${issue.slide}: ${issue.field}`);
      console.log(`    Current: ${issue.current}`);
      console.log(`    Correct: ${issue.correct}`);
    }
  } else {
    console.log('No issues found in checked slides!');
  }

  // Output summary for easy reference
  console.log('');
  console.log('='.repeat(60));
  console.log('SUMMARY - KEY VALUES TO UPDATE IN SLIDES');
  console.log('='.repeat(60));
  console.log(`
Slide 3: ${uniqueFilms.size} unique films watched
Slide 4: ${totalHours} hours = ${totalDays} days
Slide 5 (monthly): Jan=${watchesByMonth['Jan']||0}, Feb=${watchesByMonth['Feb']||0}, Mar=${watchesByMonth['Mar']||0}, Apr=${watchesByMonth['Apr']||0}, May=${watchesByMonth['May']||0}, Jun=${watchesByMonth['Jun']||0}, Jul=${watchesByMonth['Jul']||0}, Aug=${watchesByMonth['Aug']||0}, Sep=${watchesByMonth['Sep']||0}, Oct=${watchesByMonth['Oct']||0}, Nov=${watchesByMonth['Nov']||0}, Dec=${watchesByMonth['Dec']||0}
Peak month: ${maxMonth[0]} with ${maxMonth[1]} films
Most active weekday: ${WEEKDAYS[maxWeekdayIdx]} with ${watchesByWeekday[maxWeekdayIdx]} films
Weekday counts: Sun=${watchesByWeekday[0]}, Mon=${watchesByWeekday[1]}, Tue=${watchesByWeekday[2]}, Wed=${watchesByWeekday[3]}, Thu=${watchesByWeekday[4]}, Fri=${watchesByWeekday[5]}, Sat=${watchesByWeekday[6]}
Rewatches: ${rewatches}
First-time watches: ${totalWatches - rewatches}
Average rating: ${avgRating.toFixed(2)}
5-star films: ${uniqueFiveStars.length}
Longest streak: ${longestStreak} days (${longestStreakStart} to ${longestStreakEnd})
Longest gap: ${longestGap} days (${gapStart} to ${gapEnd})
Days with film: ${uniqueDates.length}
2025 releases: ${films2025Release.length}
`);

  // Top directors for easy copy
  console.log('Top Directors:');
  for (const [name, count] of topDirectors) {
    console.log(`  ${count}x ${name}`);
  }
  
  console.log('\nTop Genres:');
  for (const [name, count] of topGenres) {
    console.log(`  ${count}x ${name}`);
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});

