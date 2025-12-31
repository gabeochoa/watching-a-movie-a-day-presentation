#!/usr/bin/env node

/**
 * Validation script to double-check all processed data and numbers
 * Run: node scripts/validate_data.js
 */

import path from "node:path";
import fs from "fs-extra";
import JSZip from "jszip";
import Papa from "papaparse";

const WORKSPACE = process.cwd();
const CSV_DIR = path.join(WORKSPACE, "01_csvs_processed");
const TMDB_DIR = path.join(WORKSPACE, "02_tmdb_db_info");
const RAW_DIR = path.join(WORKSPACE, "raw_data");

// Colors for terminal output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  dim: "\x1b[2m",
};

const pass = (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`);
const fail = (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`);
const warn = (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`);
const info = (msg) => console.log(`${colors.cyan}ℹ${colors.reset} ${msg}`);
const section = (msg) => console.log(`\n${colors.cyan}━━━ ${msg} ━━━${colors.reset}`);

let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;
let warnings = 0;

function check(condition, passMsg, failMsg) {
  totalChecks++;
  if (condition) {
    passedChecks++;
    pass(passMsg);
    return true;
  } else {
    failedChecks++;
    fail(failMsg);
    return false;
  }
}

function warnCheck(condition, passMsg, warnMsg) {
  totalChecks++;
  if (condition) {
    passedChecks++;
    pass(passMsg);
    return true;
  } else {
    warnings++;
    warn(warnMsg);
    return false;
  }
}

async function parseCSVFromZip(zip, filename) {
  const file = zip.file(filename);
  if (!file) return null;
  const content = await file.async("string");
  const result = Papa.parse(content, { header: true, skipEmptyLines: true });
  return result.data;
}

async function findLatestZip() {
  const files = await fs.readdir(RAW_DIR);
  const zips = files.filter(f => f.endsWith('.zip') && f.startsWith('letterboxd-'));
  if (zips.length === 0) return null;
  // Sort by date in filename (assumes format letterboxd-username-YYYY-MM-DD.zip or similar)
  zips.sort().reverse();
  return path.join(RAW_DIR, zips[0]);
}

async function main() {
  console.log(`\n${colors.cyan}╔════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║${colors.reset}          📊 DATA VALIDATION REPORT                         ${colors.cyan}║${colors.reset}`);
  console.log(`${colors.cyan}╚════════════════════════════════════════════════════════════╝${colors.reset}`);

  // ════════════════════════════════════════════════════════════
  // 1. Check file existence
  // ════════════════════════════════════════════════════════════
  section("1. File Existence Checks");

  const summaryPath = path.join(CSV_DIR, "summary.json");
  const parsedPath = path.join(CSV_DIR, "parsed.json");
  const filmsNormPath = path.join(CSV_DIR, "films_normalized.json");
  const enrichByFilmPath = path.join(TMDB_DIR, "enrichment_by_film.json");
  const enrichAggPath = path.join(TMDB_DIR, "enriched_aggregates.json");
  const tmdbStatsPath = path.join(TMDB_DIR, "tmdb_request_stats.json");
  const cacheStatsPath = path.join(TMDB_DIR, "tmdb_cache_stats.json");

  const files = [
    { path: summaryPath, name: "summary.json" },
    { path: parsedPath, name: "parsed.json" },
    { path: filmsNormPath, name: "films_normalized.json" },
    { path: enrichByFilmPath, name: "enrichment_by_film.json" },
    { path: enrichAggPath, name: "enriched_aggregates.json" },
    { path: tmdbStatsPath, name: "tmdb_request_stats.json" },
    { path: cacheStatsPath, name: "tmdb_cache_stats.json" },
  ];

  for (const f of files) {
    const exists = await fs.pathExists(f.path);
    check(exists, `${f.name} exists`, `${f.name} is MISSING`);
  }

  // Load all JSON files
  const summary = await fs.readJson(summaryPath).catch(() => null);
  const parsed = await fs.readJson(parsedPath).catch(() => null);
  const filmsNorm = await fs.readJson(filmsNormPath).catch(() => null);
  const enrichByFilm = await fs.readJson(enrichByFilmPath).catch(() => null);
  const enrichAgg = await fs.readJson(enrichAggPath).catch(() => null);

  if (!summary || !parsed || !filmsNorm) {
    fail("Critical files missing, cannot continue validation");
    process.exit(1);
  }

  // ════════════════════════════════════════════════════════════
  // 2. Validate against source ZIP
  // ════════════════════════════════════════════════════════════
  section("2. Source ZIP Validation");

  const latestZip = await findLatestZip();
  if (!latestZip) {
    warn("No source ZIP found in raw_data/");
  } else {
    info(`Source ZIP: ${path.basename(latestZip)}`);
    
    const zipBuffer = await fs.readFile(latestZip);
    const zip = await JSZip.loadAsync(zipBuffer);
    
    // Parse CSVs directly from ZIP
    const diaryFromZip = await parseCSVFromZip(zip, "diary.csv");
    const ratingsFromZip = await parseCSVFromZip(zip, "ratings.csv");
    const watchedFromZip = await parseCSVFromZip(zip, "watched.csv");
    const filmsFromZip = await parseCSVFromZip(zip, "films.csv");

    if (diaryFromZip) {
      check(
        diaryFromZip.length === parsed.diary.length,
        `Diary count matches ZIP: ${diaryFromZip.length}`,
        `Diary count MISMATCH: ZIP=${diaryFromZip.length}, parsed=${parsed.diary.length}`
      );
    }

    if (ratingsFromZip) {
      check(
        ratingsFromZip.length === parsed.ratings.length,
        `Ratings count matches ZIP: ${ratingsFromZip.length}`,
        `Ratings count MISMATCH: ZIP=${ratingsFromZip.length}, parsed=${parsed.ratings.length}`
      );
    }

    if (watchedFromZip) {
      check(
        watchedFromZip.length === parsed.watched.length,
        `Watched count matches ZIP: ${watchedFromZip.length}`,
        `Watched count MISMATCH: ZIP=${watchedFromZip.length}, parsed=${parsed.watched.length}`
      );
    }

    if (filmsFromZip) {
      check(
        filmsFromZip.length === parsed.films.length,
        `Films count matches ZIP: ${filmsFromZip.length}`,
        `Films count MISMATCH: ZIP=${filmsFromZip.length}, parsed=${parsed.films.length}`
      );
    } else {
      warnCheck(
        parsed.films.length === 0,
        "No films.csv in ZIP (expected)",
        `films.csv missing from ZIP but parsed.films has ${parsed.films.length} entries`
      );
    }
  }

  // ════════════════════════════════════════════════════════════
  // 3. Internal consistency checks
  // ════════════════════════════════════════════════════════════
  section("3. Internal Consistency Checks");

  // Summary matches parsed data
  check(
    summary.counts.diary === parsed.diary.length,
    `summary.counts.diary (${summary.counts.diary}) matches parsed.diary.length`,
    `summary.counts.diary (${summary.counts.diary}) ≠ parsed.diary.length (${parsed.diary.length})`
  );

  check(
    summary.counts.ratings === parsed.ratings.length,
    `summary.counts.ratings (${summary.counts.ratings}) matches parsed.ratings.length`,
    `summary.counts.ratings (${summary.counts.ratings}) ≠ parsed.ratings.length (${parsed.ratings.length})`
  );

  check(
    summary.counts.watched === parsed.watched.length,
    `summary.counts.watched (${summary.counts.watched}) matches parsed.watched.length`,
    `summary.counts.watched (${summary.counts.watched}) ≠ parsed.watched.length (${parsed.watched.length})`
  );

  check(
    summary.counts.uniqueDiaryFilms === filmsNorm.length,
    `summary.counts.uniqueDiaryFilms (${summary.counts.uniqueDiaryFilms}) matches films_normalized.length`,
    `summary.counts.uniqueDiaryFilms (${summary.counts.uniqueDiaryFilms}) ≠ films_normalized.length (${filmsNorm.length})`
  );

  // ════════════════════════════════════════════════════════════
  // 4. Films normalized validation
  // ════════════════════════════════════════════════════════════
  section("4. Films Normalized Validation");

  // Check all films have required fields (title, key, year)
  const requiredFields = ["title", "key", "year"];
  let filmsWithMissingFields = 0;
  
  for (const film of filmsNorm) {
    for (const field of requiredFields) {
      if (!film[field] && film[field] !== 0) {
        filmsWithMissingFields++;
        break;
      }
    }
  }

  check(
    filmsWithMissingFields === 0,
    `All ${filmsNorm.length} normalized films have required fields (title, key, year)`,
    `${filmsWithMissingFields} films missing required fields (title, key, year)`
  );

  // Check for duplicate keys
  const keys = filmsNorm.map(f => f.key);
  const uniqueKeys = new Set(keys);
  check(
    uniqueKeys.size === filmsNorm.length,
    `No duplicate keys in films_normalized`,
    `Found ${filmsNorm.length - uniqueKeys.size} duplicate keys`
  );

  // Count films with ratings from diary (ratings are in parsed.diary, not films_normalized)
  const diaryWithRatings = parsed.diary.filter(d => d.Rating && d.Rating !== "");
  const filmsWithRatings = diaryWithRatings; // Use diary entries for rating count
  info(`Films with ratings: ${filmsWithRatings.length} / ${filmsNorm.length}`);

  // ════════════════════════════════════════════════════════════
  // 5. TMDB Enrichment Validation
  // ════════════════════════════════════════════════════════════
  section("5. TMDB Enrichment Validation");

  if (enrichByFilm && enrichAgg) {
    const enrichedFilms = Object.keys(enrichByFilm);
    info(`Films with TMDB enrichment: ${enrichedFilms.length}`);

    // Check mapped + failed = total
    const mapped = enrichAgg.mapped || 0;
    const failed = enrichAgg.failed || 0;
    check(
      mapped + failed === filmsNorm.length,
      `mapped (${mapped}) + failed (${failed}) = films_normalized (${filmsNorm.length})`,
      `mapped (${mapped}) + failed (${failed}) = ${mapped + failed} ≠ films_normalized (${filmsNorm.length})`
    );

    // Validate top directors
    if (enrichAgg.topDirectors) {
      const totalDirectorFilms = enrichAgg.topDirectors.reduce((sum, d) => sum + d.count, 0);
      info(`Total films attributed to directors: ${totalDirectorFilms}`);
      
      // Count unique directors
      const directorNames = enrichAgg.topDirectors.map(d => d.name);
      const uniqueDirectors = new Set(directorNames);
      check(
        uniqueDirectors.size === enrichAgg.topDirectors.length,
        `No duplicate directors in topDirectors list`,
        `Found ${enrichAgg.topDirectors.length - uniqueDirectors.size} duplicate director entries`
      );
    }

    // Validate top genres
    if (enrichAgg.topGenres) {
      const totalGenreAssignments = enrichAgg.topGenres.reduce((sum, g) => sum + g.count, 0);
      info(`Total genre assignments: ${totalGenreAssignments} (films can have multiple genres)`);
      
      // Genres should be reasonably expected
      const expectedGenres = ["Drama", "Comedy", "Action", "Thriller", "Horror", "Romance", "Documentary", "Animation"];
      const foundGenres = enrichAgg.topGenres.map(g => g.name);
      const commonGenresFound = expectedGenres.filter(g => foundGenres.includes(g));
      warnCheck(
        commonGenresFound.length >= 4,
        `Found ${commonGenresFound.length} common genres: ${commonGenresFound.join(", ")}`,
        `Only ${commonGenresFound.length} common genres found - data might be incomplete`
      );
    }

    // Validate runtime bins
    if (enrichAgg.runtimeBins) {
      const totalInBins = enrichAgg.runtimeBins.reduce((sum, b) => sum + b.count, 0);
      // Runtime might not be available for all films
      warnCheck(
        totalInBins >= mapped * 0.9,
        `Runtime bins cover ${totalInBins} films (${((totalInBins/mapped)*100).toFixed(1)}% of mapped)`,
        `Runtime bins only cover ${totalInBins} films (${((totalInBins/mapped)*100).toFixed(1)}% of mapped) - some missing`
      );

      // Validate bins are properly ordered
      const binOrder = ["0-59", "60-89", "90-119", "120-149", "150-179", "180+"];
      const actualBins = enrichAgg.runtimeBins.map(b => b.bin);
      check(
        JSON.stringify(actualBins) === JSON.stringify(binOrder),
        `Runtime bins are in correct order`,
        `Runtime bins order mismatch: ${actualBins.join(", ")}`
      );
    }

    // Validate rating-runtime scatter data
    if (enrichAgg.ratingRuntimePoints) {
      info(`Rating-runtime data points: ${enrichAgg.ratingRuntimePoints.length}`);
      
      // Check for valid ratings (0.5 to 5, in 0.5 increments)
      const invalidRatings = enrichAgg.ratingRuntimePoints.filter(p => 
        p.rating < 0.5 || p.rating > 5 || (p.rating * 2) % 1 !== 0
      );
      check(
        invalidRatings.length === 0,
        `All ratings are valid (0.5-5 in 0.5 increments)`,
        `Found ${invalidRatings.length} invalid rating values`
      );

      // Check for reasonable runtimes
      const unreasonableRuntimes = enrichAgg.ratingRuntimePoints.filter(p => 
        p.runtime < 1 || p.runtime > 500
      );
      warnCheck(
        unreasonableRuntimes.length === 0,
        `All runtimes are reasonable (1-500 min)`,
        `Found ${unreasonableRuntimes.length} unusual runtime values`
      );
    }

    // Validate rating-year scatter data
    if (enrichAgg.ratingReleaseYearPoints) {
      info(`Rating-year data points: ${enrichAgg.ratingReleaseYearPoints.length}`);
      
      // Check years are reasonable
      const currentYear = new Date().getFullYear();
      const invalidYears = enrichAgg.ratingReleaseYearPoints.filter(p => 
        p.year < 1888 || p.year > currentYear + 1
      );
      check(
        invalidYears.length === 0,
        `All release years are valid (1888-${currentYear + 1})`,
        `Found ${invalidYears.length} invalid year values`
      );
    }

  } else {
    warn("TMDB enrichment files not found or empty");
  }

  // ════════════════════════════════════════════════════════════
  // 6. Cross-reference validation
  // ════════════════════════════════════════════════════════════
  section("6. Cross-Reference Validation");

  // Check diary entries reference valid dates
  const diaryWithDates = parsed.diary.filter(d => d["Watched Date"] || d.Date);
  info(`Diary entries with dates: ${diaryWithDates.length} / ${parsed.diary.length}`);

  // Check year distribution is reasonable
  const years = filmsNorm.map(f => f.year).filter(y => y);
  const minYear = Math.min(...years);
  const maxYear = Math.max(...years);
  info(`Film release years range: ${minYear} - ${maxYear}`);
  
  warnCheck(
    minYear >= 1880 && maxYear <= new Date().getFullYear() + 1,
    `Year range is reasonable`,
    `Year range seems unusual: ${minYear} - ${maxYear}`
  );

  // ════════════════════════════════════════════════════════════
  // 7. Data quality checks
  // ════════════════════════════════════════════════════════════
  section("7. Data Quality Checks");

  // Check for common data issues
  const emptyTitles = filmsNorm.filter(f => !f.title || f.title.trim() === "");
  check(
    emptyTitles.length === 0,
    `No films with empty titles`,
    `Found ${emptyTitles.length} films with empty titles`
  );

  const zeroYear = filmsNorm.filter(f => f.year === 0);
  check(
    zeroYear.length === 0,
    `No films with year=0`,
    `Found ${zeroYear.length} films with year=0`
  );

  // Check rating distribution (from diary entries)
  const ratingCounts = {};
  for (const entry of parsed.diary) {
    if (entry.Rating && entry.Rating !== "") {
      const rating = parseFloat(entry.Rating);
      if (!isNaN(rating)) {
        ratingCounts[rating] = (ratingCounts[rating] || 0) + 1;
      }
    }
  }
  
  info("Rating distribution:");
  const sortedRatings = Object.entries(ratingCounts).sort((a, b) => Number(a[0]) - Number(b[0]));
  for (const [rating, count] of sortedRatings) {
    const bar = "█".repeat(Math.ceil(count / 10));
    console.log(`   ${rating.padStart(3)}★: ${String(count).padStart(3)} ${colors.dim}${bar}${colors.reset}`);
  }

  // ════════════════════════════════════════════════════════════
  // Summary
  // ════════════════════════════════════════════════════════════
  console.log(`\n${colors.cyan}╔════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║${colors.reset}                    VALIDATION SUMMARY                      ${colors.cyan}║${colors.reset}`);
  console.log(`${colors.cyan}╚════════════════════════════════════════════════════════════╝${colors.reset}\n`);

  console.log(`   Total checks:  ${totalChecks}`);
  console.log(`   ${colors.green}Passed:${colors.reset}       ${passedChecks}`);
  console.log(`   ${colors.red}Failed:${colors.reset}       ${failedChecks}`);
  console.log(`   ${colors.yellow}Warnings:${colors.reset}     ${warnings}`);
  console.log();

  if (failedChecks === 0) {
    console.log(`${colors.green}   ✅ All validations passed!${colors.reset}\n`);
  } else {
    console.log(`${colors.red}   ❌ ${failedChecks} validation(s) failed. Please review the errors above.${colors.reset}\n`);
    process.exit(1);
  }

  // Print key stats summary
  console.log(`${colors.cyan}   📈 Key Statistics:${colors.reset}`);
  console.log(`      • Diary entries: ${summary.counts.diary}`);
  console.log(`      • Unique films: ${summary.counts.uniqueDiaryFilms}`);
  console.log(`      • Films with ratings: ${filmsWithRatings.length}`);
  if (enrichAgg) {
    console.log(`      • TMDB matched: ${enrichAgg.mapped} (${((enrichAgg.mapped / filmsNorm.length) * 100).toFixed(1)}%)`);
    console.log(`      • TMDB failed: ${enrichAgg.failed}`);
    if (enrichAgg.topDirectors?.[0]) {
      console.log(`      • Top director: ${enrichAgg.topDirectors[0].name} (${enrichAgg.topDirectors[0].count} films)`);
    }
    if (enrichAgg.topGenres?.[0]) {
      console.log(`      • Top genre: ${enrichAgg.topGenres[0].name} (${enrichAgg.topGenres[0].count} films)`);
    }
  }
  console.log();
}

main().catch((e) => {
  console.error(`${colors.red}❌ Validation script error: ${e.message}${colors.reset}`);
  console.error(e.stack);
  process.exit(1);
});

