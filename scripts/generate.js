#!/usr/bin/env node

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import JSZip from 'jszip';
import Papa from 'papaparse';
import { openDb } from "./lib/db.js";
import { createTmdbService } from "./lib/tmdb.js";
import { loadSecrets } from "./lib/secrets.js";
import { computeFromLetterboxd } from "../public/src/analytics/compute.js";
import { generateSlides, generateAIPrompts } from "./lib/slides.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const argv = yargs(hideBin(process.argv))
  .option('zip', {
    alias: 'z',
    describe: 'Path to Letterboxd export ZIP file',
    type: 'string',
    demandOption: false
  })
  .option('extras', {
    alias: 'x',
    describe: 'Optional path to a JSON file with extra inputs (presentation context, manual answers, etc.)',
    type: 'string',
    demandOption: false
  })
  .option('example', {
    describe: 'Generate a small example report (no ZIP required)',
    type: 'boolean',
    default: false
  })
  .option('output', {
    alias: 'o',
    describe: 'Output directory for generated site',
    type: 'string',
    default: 'dist'
  })
  .option('data-dir', {
    describe: 'Directory for local SQLite TMDB cache (data/cache.sqlite)',
    type: 'string',
    default: 'data'
  })
  .option('no-tmdb', {
    describe: 'Disable TMDB enrichment (Letterboxd-only report)',
    type: 'boolean',
    default: false
  })
  .option('concurrency', {
    describe: 'Max concurrent TMDB requests during enrichment',
    type: 'number',
    default: 3
  })
  .option('title', {
    describe: 'Custom title for the presentation',
    type: 'string',
    default: 'Wrapboxd'
  })
  .help()
  .argv;

async function main() {
  const zipPath = argv.zip;
  const outputDir = argv.output;
  const dataDir = argv['data-dir'];
  const noTmdb = Boolean(argv['no-tmdb']);
  const concurrency = Number(argv.concurrency) || 3;
  const title = argv.title || 'Wrapboxd';
  const extrasPathRaw = argv.extras;

  console.log(`🎬 Wrapboxd Static Site Generator (Reveal.js)`);
  console.log(`📤 Output directory: ${outputDir}`);

  try {
    if (!argv.example) {
      if (!zipPath) throw new Error("Missing --zip (or pass --example).");
      console.log(`📁 Processing ZIP: ${zipPath}`);
      if (!await fs.pathExists(zipPath)) throw new Error(`ZIP file not found: ${zipPath}`);
    } else {
      console.log(`🧪 Using built-in example data`);
    }

    // Create output directory
    await fs.ensureDir(outputDir);

    // Parse Letterboxd ZIP (Node)
    const parsed = argv.example ? buildExampleParsed() : await processZipFile(zipPath);

    // Compute core analytics (Letterboxd-only)
    const computedAll = computeFromLetterboxd({ diary: parsed.diary, films: parsed.films });

    // Optional extras JSON (manual inputs / presentation context)
    let extras = null;
    if (extrasPathRaw) {
      const extrasPath = path.resolve(process.cwd(), String(extrasPathRaw));
      if (!await fs.pathExists(extrasPath)) throw new Error(`Extras JSON file not found: ${extrasPath}`);
      try {
        extras = await fs.readJson(extrasPath);
      } catch (e) {
        throw new Error(`Failed to parse extras JSON (${extrasPath}): ${e.message}`);
      }
    }

    // Optional: TMDB enrichment (cached in SQLite)
    const secrets = argv.example ? {} : await loadSecrets({ rootDir: path.join(__dirname, "..") });
    const tmdbEnabled = !argv.example
      && !noTmdb
      && Boolean(
        (secrets?.TMDB_BEARER_TOKEN || "").trim()
          || (secrets?.TMDB_API_KEY || "").trim()
          || (process.env.TMDB_BEARER_TOKEN || "").trim()
          || (process.env.TMDB_API_KEY || "").trim(),
      );

    const tmdbRequestStats = { hit: 0, miss: 0, unknown: 0 };
    const db = tmdbEnabled ? openDb({ dataDir }) : null;
    const tmdb = tmdbEnabled
      ? createTmdbService({
          db,
          bearerToken: secrets?.TMDB_BEARER_TOKEN,
          apiKey: secrets?.TMDB_API_KEY,
        })
      : null;

    let enrichmentByFilm = [];
    let enrichedAll = null;

    if (tmdbEnabled) {
      const films = normalizeDiaryFilms(parsed);
      console.log(`🧠 TMDB enrichment enabled (films: ${films.length}, concurrency: ${concurrency})`);
      const result = await enrichFilmsWithTmdb({ films, tmdb, tmdbRequestStats, concurrency });
      enrichmentByFilm = Array.from(result.perFilm.entries());
      enrichedAll = computeEnrichedAggregatesForDiary(parsed.diary, new Map(enrichmentByFilm), { mapped: result.mapped, failed: result.failed });
      console.log(`✅ TMDB enrichment complete: mapped=${result.mapped} failed=${result.failed}`);
    } else {
      console.log(`ℹ️  TMDB enrichment disabled (no key/token or --no-tmdb).`);
    }

    const payload = {
      meta: {
        generatedAt: new Date().toISOString(),
        sourceZip: argv.example ? "example" : path.basename(zipPath),
        tmdbEnabled,
      },
      extras,
      parsed: {
        zipFileNames: parsed.zipFileNames,
        filesFound: parsed.filesFound,
        diary: parsed.diary,
        films: parsed.films,
        ratings: parsed.ratings,
        watched: parsed.watched,
      },
      computedAll,
      enrichmentByFilm,
      enrichedAll,
      tmdbCacheStats: db ? db.stats() : null,
      tmdbRequestStats,
    };

    // Generate reveal.js presentation
    await generateRevealSite(payload, outputDir, { title });
    
    // Generate AI prompts file
    await generatePromptsFile(payload, outputDir);

    console.log(`✅ Presentation generated successfully!`);
    console.log(`🌐 Open ${path.join(outputDir, 'index.html')} in your browser`);
    console.log(`💡 Tip: Use arrow keys to navigate, 'f' for fullscreen, 'o' for overview`);

  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

async function processZipFile(zipPath) {
  console.log(`📦 Extracting ZIP file...`);

  const zipData = await fs.readFile(zipPath);
  const zip = await JSZip.loadAsync(zipData);

  const zipFileNames = Object.keys(zip.files || {});
  const candidates = {
    diary: ["diary.csv", "diary-entries.csv"],
    films: ["films.csv"],
    ratings: ["ratings.csv"],
    watched: ["watched.csv"],
  };

  async function readZipText(name) {
    const file = zip.files[name];
    if (!file) return null;
    return file.async("text");
  }

  async function firstMatch(names) {
    for (const n of names) {
      // eslint-disable-next-line no-await-in-loop
      const content = await readZipText(n);
      if (content != null) return { name: n, content };
    }
    return null;
  }

  function parseCsv(content) {
    const parsed = Papa.parse(content, { header: true, skipEmptyLines: true });
    return parsed.data ?? [];
  }

  const diaryFile = await firstMatch(candidates.diary);
  if (!diaryFile) throw new Error("diary.csv not found in ZIP file (required).");

  const filmsFile = await firstMatch(candidates.films);
  const ratingsFile = await firstMatch(candidates.ratings);
  const watchedFile = await firstMatch(candidates.watched);

  const diary = parseCsv(diaryFile.content);
  const films = filmsFile ? parseCsv(filmsFile.content) : [];
  const ratings = ratingsFile ? parseCsv(ratingsFile.content) : [];
  const watched = watchedFile ? parseCsv(watchedFile.content) : [];

  console.log(`  📈 Diary entries: ${diary.length}`);
  console.log(`  🎞️ Films rows: ${films.length}`);
  console.log(`  ⭐ Ratings rows: ${ratings.length}`);
  console.log(`  👀 Watched rows: ${watched.length}`);

  return {
    zipFileNames,
    filesFound: {
      diary: diaryFile.name,
      films: filmsFile?.name ?? null,
      ratings: ratingsFile?.name ?? null,
      watched: watchedFile?.name ?? null,
    },
    diary,
    films,
    ratings,
    watched,
  };
}

function buildExampleParsed() {
  // Tiny, non-sensitive dataset so dist/ can be committed and reviewed.
  const diary = [
    { Date: "2025-01-03", Name: "Example Movie A", Year: "1999", Rating: "4", Rewatch: "", Tags: "", "Watched Date": "2025-01-03" },
    { Date: "2025-01-10", Name: "Example Movie B", Year: "2014", Rating: "3", Rewatch: "", Tags: "", "Watched Date": "2025-01-10" },
    { Date: "2025-01-15", Name: "Example Movie C", Year: "1982", Rating: "5", Rewatch: "Yes", Tags: "", "Watched Date": "2025-01-15" },
    { Date: "2025-02-02", Name: "Example Movie D", Year: "2023", Rating: "4", Rewatch: "", Tags: "", "Watched Date": "2025-02-02" },
    { Date: "2025-02-14", Name: "Example Movie E", Year: "2001", Rating: "4", Rewatch: "", Tags: "", "Watched Date": "2025-02-14" },
    { Date: "2025-03-01", Name: "Example Movie F", Year: "2019", Rating: "3", Rewatch: "", Tags: "", "Watched Date": "2025-03-01" },
    { Date: "2025-03-14", Name: "Example Movie G", Year: "2023", Rating: "2", Rewatch: "", Tags: "", "Watched Date": "2025-03-14" },
    { Date: "2025-03-20", Name: "Example Movie H", Year: "2001", Rating: "4", Rewatch: "", Tags: "", "Watched Date": "2025-03-20" },
    { Date: "2025-03-25", Name: "Example Movie I", Year: "1995", Rating: "5", Rewatch: "", Tags: "", "Watched Date": "2025-03-25" },
    { Date: "2025-04-05", Name: "Example Movie J", Year: "2020", Rating: "3", Rewatch: "", Tags: "", "Watched Date": "2025-04-05" },
    { Date: "2025-04-10", Name: "Example Movie K", Year: "2018", Rating: "4", Rewatch: "", Tags: "", "Watched Date": "2025-04-10" },
    { Date: "2025-04-20", Name: "Example Movie L", Year: "2022", Rating: "4", Rewatch: "", Tags: "", "Watched Date": "2025-04-20" },
  ];
  const films = [];
  return {
    zipFileNames: ["example"],
    filesFound: { diary: "example", films: null, ratings: null, watched: null },
    diary,
    films,
    ratings: [],
    watched: [],
  };
}

async function generateRevealSite(payload, outputDir, { title = 'Wrapboxd' } = {}) {
  console.log(`🎨 Generating reveal.js presentation...`);

  const templateDir = path.join(__dirname, "..", "templates", "reveal");
  
  // Check if template directory exists
  if (!await fs.pathExists(templateDir)) {
    throw new Error(`Missing template directory: ${templateDir}`);
  }

  // Copy template assets (CSS, JS)
  await fs.ensureDir(path.join(outputDir, 'css'));
  await fs.ensureDir(path.join(outputDir, 'js'));
  
  await fs.copy(
    path.join(templateDir, 'css', 'genz-theme.css'),
    path.join(outputDir, 'css', 'genz-theme.css')
  );
  
  await fs.copy(
    path.join(templateDir, 'js', 'charts.js'),
    path.join(outputDir, 'js', 'charts.js')
  );

  // Generate slides HTML
  const slidesHtml = generateSlides(payload);
  
  // Read template and inject content
  const template = await fs.readFile(path.join(templateDir, 'index.html'), 'utf8');
  
  const html = template
    .replace('{{TITLE}}', escapeHtml(title))
    .replace('{{SLIDES}}', slidesHtml)
    .replace('{{DATA}}', JSON.stringify(payload));
  
  await fs.writeFile(path.join(outputDir, 'index.html'), html);
  
  console.log(`  📊 Generated ${countSlides(slidesHtml)} slides`);
}

function countSlides(html) {
  return (html.match(/<section/g) || []).length;
}

async function generatePromptsFile(payload, outputDir) {
  console.log(`🤖 Generating AI prompts...`);
  
  const prompts = generateAIPrompts(payload);
  await fs.writeFile(path.join(outputDir, 'prompts.md'), prompts);
  
  console.log(`  📝 Generated prompts.md`);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function normalizeDiaryFilms(parsed) {
  const films = new Map(); // key -> { key, title, year, imdbId? }
  const imdbByTitleYear = new Map();
  for (const row of parsed.films ?? []) {
    const title = String(row.Name ?? row.name ?? "").trim();
    const year = String(row.Year ?? row.year ?? "").trim();
    const imdbId = String(row["IMDb ID"] ?? row.ImdbID ?? row.imdb_id ?? "").trim();
    if (title && year && imdbId) imdbByTitleYear.set(`${title} (${year})`, imdbId);
  }
  for (const row of parsed.diary ?? []) {
    const title = String(row.Name ?? row.name ?? "").trim();
    const year = String(row.Year ?? row.year ?? "").trim();
    if (!title) continue;
    const key = `${title} (${year || "n/a"})`;
    if (films.has(key)) continue;
    films.set(key, {
      key,
      title,
      year: year ? Number(year) : null,
      imdbId: year ? imdbByTitleYear.get(`${title} (${year})`) ?? null : null,
    });
  }
  return Array.from(films.values());
}

async function promisePool(items, worker, { concurrency = 3 } = {}) {
  const executing = new Set();
  const results = new Array(items.length);
  for (let i = 0; i < items.length; i += 1) {
    const p = (async () => worker(items[i], i))();
    executing.add(p);
    p.then((r) => {
      results[i] = r;
    }).finally(() => {
      executing.delete(p);
    });
    if (executing.size >= concurrency) {
      // eslint-disable-next-line no-await-in-loop
      await Promise.race(executing);
    }
  }
  await Promise.all(executing);
  return results;
}

function bumpCacheCounter(tmdbRequestStats, cacheHit, noCache) {
  if (cacheHit) tmdbRequestStats.hit += 1;
  else if (noCache) tmdbRequestStats.unknown += 1;
  else tmdbRequestStats.miss += 1;
}

function toReleaseYearFromTmdb(details) {
  const d = String(details?.release_date ?? "").trim();
  const y = Number.parseInt(d.slice(0, 4), 10);
  return Number.isFinite(y) ? y : null;
}

async function enrichFilmsWithTmdb({ films, tmdb, tmdbRequestStats, concurrency }) {
  const perFilm = new Map();
  let mapped = 0;
  let failed = 0;

  await promisePool(
    films,
    async (film) => {
      try {
        let tmdbId = null;

        if (film.imdbId) {
          const r = await tmdb.getCachedOrFetch(`/find/${film.imdbId}`, { external_source: "imdb_id" });
          bumpCacheCounter(tmdbRequestStats, r.cacheHit, r.noCache);
          const id = r.payload?.movie_results?.[0]?.id ?? null;
          tmdbId = id ? String(id) : null;
        }

        if (!tmdbId) {
          const q = { query: film.title };
          if (film.year) q.year = String(film.year);
          const r = await tmdb.getCachedOrFetch(`/search/movie`, q);
          bumpCacheCounter(tmdbRequestStats, r.cacheHit, r.noCache);
          const id = r.payload?.results?.[0]?.id ?? null;
          tmdbId = id ? String(id) : null;
        }

        if (!tmdbId) {
          failed += 1;
          return null;
        }

        const detailsRes = await tmdb.getCachedOrFetch(`/movie/${tmdbId}`, {});
        bumpCacheCounter(tmdbRequestStats, detailsRes.cacheHit, detailsRes.noCache);
        if (detailsRes.status !== 200) throw new Error(`details status ${detailsRes.status}`);
        const details = detailsRes.payload;

        const creditsRes = await tmdb.getCachedOrFetch(`/movie/${tmdbId}/credits`, {});
        bumpCacheCounter(tmdbRequestStats, creditsRes.cacheHit, creditsRes.noCache);
        if (creditsRes.status !== 200) throw new Error(`credits status ${creditsRes.status}`);
        const credits = creditsRes.payload;

        mapped += 1;

        const genres = (details.genres ?? [])
          .map((g) => String(g?.name ?? "").trim())
          .filter(Boolean);

        const dirs = (credits.crew ?? [])
          .filter((c) => c && c.job === "Director")
          .map((d) => String(d?.name ?? "").trim())
          .filter(Boolean);

        const runtime = Number(details.runtime);
        const releaseYear = film.year ?? toReleaseYearFromTmdb(details);
        perFilm.set(film.key, {
          tmdbId,
          runtime: Number.isFinite(runtime) ? runtime : null,
          releaseYear: Number.isFinite(releaseYear) ? releaseYear : null,
          genres,
          directors: dirs,
        });

        if ((mapped + failed) % 25 === 0) {
          console.log(`  …progress mapped=${mapped} failed=${failed}`);
        }
        return { filmKey: film.key, tmdbId };
      } catch (e) {
        failed += 1;
        if ((mapped + failed) % 25 === 0) {
          console.log(`  …progress mapped=${mapped} failed=${failed}`);
        }
        return null;
      }
    },
    { concurrency },
  );

  return { perFilm, mapped, failed };
}

function computeFilmAvgRatingsByKey(diaryRows) {
  const sum = new Map();
  const count = new Map();
  for (const row of diaryRows ?? []) {
    const title = String(row.Name ?? row.name ?? "").trim();
    const year = String(row.Year ?? row.year ?? "").trim();
    if (!title) continue;
    const key = `${title} (${year || "n/a"})`;
    const r = Number.parseFloat(String(row.Rating ?? row.rating));
    if (!Number.isFinite(r)) continue;
    sum.set(key, (sum.get(key) || 0) + r);
    count.set(key, (count.get(key) || 0) + 1);
  }
  const out = new Map();
  for (const [k, s] of sum.entries()) {
    const n = count.get(k) || 0;
    if (n) out.set(k, s / n);
  }
  return out;
}

function computeRuntimeBins(runtimes) {
  const bins = [
    { bin: "0-59", min: 0, max: 59, count: 0 },
    { bin: "60-89", min: 60, max: 89, count: 0 },
    { bin: "90-119", min: 90, max: 119, count: 0 },
    { bin: "120-149", min: 120, max: 149, count: 0 },
    { bin: "150-179", min: 150, max: 179, count: 0 },
    { bin: "180+", min: 180, max: Infinity, count: 0 },
  ];
  for (const r of runtimes) {
    const n = Number(r);
    if (!Number.isFinite(n) || n <= 0) continue;
    const b = bins.find((x) => n >= x.min && n <= x.max);
    if (b) b.count += 1;
  }
  return bins;
}

function computeEnrichedAggregatesForDiary(diaryRows, enrichmentByFilm, { mapped = 0, failed = 0 } = {}) {
  if (!enrichmentByFilm || !(enrichmentByFilm instanceof Map)) return null;

  const filmKeys = new Set();
  for (const row of diaryRows ?? []) {
    const title = String(row.Name ?? row.name ?? "").trim();
    const year = String(row.Year ?? row.year ?? "").trim();
    if (!title) continue;
    filmKeys.add(`${title} (${year || "n/a"})`);
  }

  const filmAvgRatings = computeFilmAvgRatingsByKey(diaryRows);
  const directorCounts = new Map();
  const genreCounts = new Map();
  const runtimes = [];
  const ratingRuntimePoints = [];
  const ratingReleaseYearPoints = [];

  for (const filmKey of filmKeys) {
    const info = enrichmentByFilm.get(filmKey);
    if (!info) continue;

    for (const name of info.genres ?? []) {
      if (!name) continue;
      genreCounts.set(name, (genreCounts.get(name) || 0) + 1);
    }
    for (const name of info.directors ?? []) {
      if (!name) continue;
      directorCounts.set(name, (directorCounts.get(name) || 0) + 1);
    }
    if (info.runtime) runtimes.push(info.runtime);

    const avgRating = filmAvgRatings.get(filmKey) ?? null;
    if (avgRating != null && Number.isFinite(avgRating)) {
      if (Number.isFinite(info.runtime) && info.runtime > 0) {
        ratingRuntimePoints.push({ runtime: info.runtime, rating: avgRating });
      }
      if (Number.isFinite(info.releaseYear)) {
        ratingReleaseYearPoints.push({ year: info.releaseYear, rating: avgRating });
      }
    }
  }

  const topDirectors = Array.from(directorCounts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
  const topGenres = Array.from(genreCounts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
  const runtimeBins = computeRuntimeBins(runtimes);

  return { topDirectors, topGenres, runtimeBins, ratingRuntimePoints, ratingReleaseYearPoints, mapped, failed };
}

// Run the generator
main();
