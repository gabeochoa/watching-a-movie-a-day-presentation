/**
 * Slide patch definitions and stats calculation
 * 
 * Each slide entry defines what values need to be updated and how to find them.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '../..');
const INSIGHTS_PATH = path.join(ROOT, 'build', 'data', 'insights.json');

const YEAR_FILTER = 2025;

// ─────────────────────────────────────────────────────────────────────────────
// Slide Patch Definitions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Maps slide files to their patchable locations.
 * 
 * Each patch definition includes:
 * - type: 'regex' for pattern matching or 'exact' for literal replacement
 * - pattern: regex to find the value (with capture group for the number)
 * - field: which stat field to use for the new value
 * - description: human-readable description of what's being patched
 */
export const SLIDE_PATCHES = {
  'slide-001.html': [
    {
      type: 'regex',
      pattern: /(\d+) movies\./,
      field: 'totalFilms',
      description: 'Title subtitle - movies count',
    },
    {
      type: 'regex', 
      pattern: /(\d+) hours\./,
      field: 'totalHours',
      description: 'Title subtitle - hours count',
    },
  ],

  'slide-003.html': [
    {
      type: 'regex',
      pattern: /<span class="number">(\d+)<\/span>\s*\n?\s*<span class="label">unique films watched<\/span>/,
      field: 'totalFilms',
      description: 'Big number - unique films',
    },
  ],

  'slide-004.html': [
    {
      type: 'regex',
      pattern: /<span class="number">(\d+)<\/span>\s*\n?\s*<span class="unit">hours<\/span>/,
      field: 'totalHours',
      description: 'Stat pair - hours',
    },
    {
      type: 'regex',
      pattern: /<span class="number">([\d.]+)<\/span>\s*\n?\s*<span class="unit">days<\/span>/,
      field: 'totalDays',
      description: 'Stat pair - days',
    },
  ],

  'slide-007.html': [
    // December bar in the monthly chart
    {
      type: 'regex',
      pattern: /<span class="count[^"]*">(\d+)<\/span>\s*\n?\s*<div class="bar[^"]*" style="height: \d+px;"><\/div>\s*\n?\s*<span class="month-label">Dec<\/span>/,
      field: 'decCount',
      description: 'December bar - count',
    },
    // Also need to update the bar height for December
    {
      type: 'regex',
      pattern: /<span class="count[^"]*">\d+<\/span>\s*\n?\s*<div class="bar[^"]*" style="height: (\d+)px;"><\/div>\s*\n?\s*<span class="month-label">Dec<\/span>/,
      field: 'decBarHeight',
      description: 'December bar - height',
    },
  ],

  'slide-013.html': [
    // Rating distribution chart - each row
    {
      type: 'regex',
      pattern: /<td class="stars">★☆☆☆☆<\/td>\s*\n?\s*<td class="bar-cell"><div class="bar" style="width: (\d+)px"><\/div><\/td>\s*\n?\s*<td class="count">(\d+)<\/td>/,
      field: 'rating1',
      description: '1-star row',
    },
    {
      type: 'regex',
      pattern: /<td class="stars">★★☆☆☆<\/td>\s*\n?\s*<td class="bar-cell"><div class="bar" style="width: (\d+)px"><\/div><\/td>\s*\n?\s*<td class="count">(\d+)<\/td>/,
      field: 'rating2',
      description: '2-star row',
    },
    {
      type: 'regex',
      pattern: /<td class="stars">★★★☆☆<\/td>\s*\n?\s*<td class="bar-cell"><div class="bar" style="width: (\d+)px"><\/div><\/td>\s*\n?\s*<td class="count">(\d+)<\/td>/,
      field: 'rating3',
      description: '3-star row',
    },
    {
      type: 'regex',
      pattern: /<td class="stars">★★★★☆<\/td>\s*\n?\s*<td class="bar-cell"><div class="bar" style="width: (\d+)px"><\/div><\/td>\s*\n?\s*<td class="count">(\d+)<\/td>/,
      field: 'rating4',
      description: '4-star row',
    },
    {
      type: 'regex',
      pattern: /<td class="stars">★★★★★<\/td>\s*\n?\s*<td class="bar-cell"><div class="bar" style="width: (\d+)px"><\/div><\/td>\s*\n?\s*<td class="count">(\d+)<\/td>/,
      field: 'rating5',
      description: '5-star row',
    },
    // Average rating display
    {
      type: 'regex',
      pattern: /font-size: 4\.1em;[^>]*>([\d.]+)<\/div>\s*\n?\s*<div[^>]*>avg rating<\/div>/,
      field: 'avgRating',
      description: 'Average rating',
    },
  ],

  'slide-041.html': [
    {
      type: 'regex',
      pattern: /<strong>(\d+)<\/strong> films in one year/,
      field: 'totalFilms',
      description: 'TL;DR - films count',
    },
    {
      type: 'regex',
      pattern: /<strong>([\d.]+)<\/strong> days of my life/,
      field: 'totalDays',
      description: 'TL;DR - days count',
    },
    {
      type: 'regex',
      pattern: /<strong>([\d.]+)<\/strong> average rating/,
      field: 'avgRating',
      description: 'TL;DR - avg rating',
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Stats Calculation
// ─────────────────────────────────────────────────────────────────────────────

function getWatchYear(entry) {
  const dateStr = entry['Watched Date'] || entry.Date;
  if (!dateStr) return null;
  return new Date(dateStr).getFullYear();
}

/**
 * Calculate all stats needed for slide patches from diary entries
 */
export function calculateStats(diary, enrichment) {
  // Filter to target year only
  const filteredDiary = diary.filter(entry => getWatchYear(entry) === YEAR_FILTER);
  
  // Build unique films set
  const filmKeys = new Set();
  for (const entry of filteredDiary) {
    const title = (entry.Name || entry.name || '').trim();
    const year = (entry.Year || entry.year || '').trim();
    if (title) {
      filmKeys.add(`${title} (${year || 'n/a'})`);
    }
  }
  
  // Rating distribution
  const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let ratingSum = 0;
  let ratedCount = 0;
  
  // Track ratings per film (for unique film ratings)
  const filmRatings = new Map();
  
  for (const entry of filteredDiary) {
    const title = (entry.Name || entry.name || '').trim();
    const year = (entry.Year || entry.year || '').trim();
    const key = `${title} (${year || 'n/a'})`;
    const rating = parseFloat(entry.Rating);
    
    if (!isNaN(rating) && rating >= 1 && rating <= 5) {
      if (!filmRatings.has(key)) {
        filmRatings.set(key, rating);
        const rounded = Math.round(rating);
        if (ratingCounts[rounded] !== undefined) {
          ratingCounts[rounded]++;
        }
        ratingSum += rating;
        ratedCount++;
      }
    }
  }
  
  const avgRating = ratedCount > 0 ? Math.round((ratingSum / ratedCount) * 100) / 100 : 0;
  
  // Monthly counts
  const monthlyData = {};
  for (const entry of filteredDiary) {
    const dateStr = entry['Watched Date'] || entry.Date;
    if (!dateStr) continue;
    const date = new Date(dateStr);
    const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    monthlyData[yearMonth] = (monthlyData[yearMonth] || 0) + 1;
  }
  
  // Calculate runtime totals
  let totalMinutes = 0;
  for (const filmKey of filmKeys) {
    const enrich = enrichment.get(filmKey);
    if (enrich?.runtime) {
      totalMinutes += enrich.runtime;
    } else {
      // Estimate average runtime if not enriched
      totalMinutes += 108; // Use current average as fallback
    }
  }
  
  const totalHours = Math.round(totalMinutes / 60);
  const totalDays = Math.round((totalHours / 24) * 10) / 10;
  
  // Calculate bar heights for rating chart (scale to max width of ~420px for the most common rating)
  const maxCount = Math.max(...Object.values(ratingCounts));
  const barScale = maxCount > 0 ? 420 / maxCount : 1;
  
  // Calculate bar height for December (scale based on max month ~7px per film)
  const maxMonthCount = Math.max(...Object.values(monthlyData));
  const monthBarScale = maxMonthCount > 0 ? 450 / maxMonthCount : 1;
  
  return {
    totalFilms: filmKeys.size,
    totalWatches: filteredDiary.length,
    totalHours,
    totalDays,
    avgRating,
    ratingCounts,
    monthlyData,
    // Computed values for patches
    decCount: monthlyData['2025-12'] || 0,
    decBarHeight: Math.round((monthlyData['2025-12'] || 0) * monthBarScale),
    // Rating bar widths
    ratingBarWidths: {
      1: Math.max(10, Math.round(ratingCounts[1] * barScale)),
      2: Math.max(10, Math.round(ratingCounts[2] * barScale)),
      3: Math.max(10, Math.round(ratingCounts[3] * barScale)),
      4: Math.max(10, Math.round(ratingCounts[4] * barScale)),
      5: Math.max(10, Math.round(ratingCounts[5] * barScale)),
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Load Current Insights
// ─────────────────────────────────────────────────────────────────────────────

export function loadCurrentInsights() {
  if (!fs.existsSync(INSIGHTS_PATH)) {
    throw new Error(`insights.json not found at ${INSIGHTS_PATH}`);
  }
  return JSON.parse(fs.readFileSync(INSIGHTS_PATH, 'utf8'));
}

// ─────────────────────────────────────────────────────────────────────────────
// Generate Patches
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate find/replace pairs from patch definitions
 */
export function generatePatches(patchDefs, currentInsights, newStats) {
  const patches = [];
  
  for (const def of patchDefs) {
    let oldValue, newValue, find, replace;
    
    switch (def.field) {
      case 'totalFilms':
        oldValue = String(currentInsights.summary.totalFilms);
        newValue = String(newStats.totalFilms);
        break;
      case 'totalHours':
        oldValue = String(currentInsights.summary.totalHours);
        newValue = String(newStats.totalHours);
        break;
      case 'totalDays':
        oldValue = String(currentInsights.summary.totalDays);
        newValue = String(newStats.totalDays);
        break;
      case 'avgRating':
        oldValue = String(currentInsights.summary.avgRating);
        newValue = String(newStats.avgRating);
        break;
      case 'decCount':
        oldValue = String(currentInsights.temporal.monthlyData.find(m => m.month === '2025-12')?.count || 0);
        newValue = String(newStats.decCount);
        break;
      case 'decBarHeight':
        // Need to extract old height from pattern match, use heuristic
        oldValue = String(Math.round((currentInsights.temporal.monthlyData.find(m => m.month === '2025-12')?.count || 0) * 6.92));
        newValue = String(newStats.decBarHeight);
        break;
      case 'rating1':
        oldValue = String(currentInsights.ratings.distribution['1'] || 0);
        newValue = String(newStats.ratingCounts[1]);
        break;
      case 'rating2':
        oldValue = String(currentInsights.ratings.distribution['2'] || 0);
        newValue = String(newStats.ratingCounts[2]);
        break;
      case 'rating3':
        oldValue = String(currentInsights.ratings.distribution['3'] || 0);
        newValue = String(newStats.ratingCounts[3]);
        break;
      case 'rating4':
        oldValue = String(currentInsights.ratings.distribution['4'] || 0);
        newValue = String(newStats.ratingCounts[4]);
        break;
      case 'rating5':
        oldValue = String(currentInsights.ratings.distribution['5'] || 0);
        newValue = String(newStats.ratingCounts[5]);
        break;
      default:
        continue;
    }
    
    if (oldValue === newValue) {
      continue; // No change needed
    }
    
    // Build the replacement based on the pattern
    if (def.type === 'regex') {
      find = def.pattern;
      replace = (match) => match.replace(oldValue, newValue);
    }
    
    patches.push({
      find,
      replace,
      description: def.description,
      oldValue,
      newValue,
      field: def.field,
    });
  }
  
  return patches;
}

