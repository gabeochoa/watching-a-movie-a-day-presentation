#!/usr/bin/env node

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { openDb } from "./lib/db.js";
import { createTmdbService } from "./lib/tmdb.js";
import { loadSecrets } from "./lib/secrets.js";
import { computeFromLetterboxd } from "../public/src/analytics/compute.js";
import { parseLetterboxdZipFromPath } from "./lib/letterboxd_zip_node.js";
import { generateRevealSite, generatePromptsFile } from "./lib/presentation.js";
import {
  normalizeDiaryFilms,
  enrichFilmsWithTmdb,
  computeEnrichedAggregatesForDiary,
} from "./lib/enrichment.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const argv = yargs(hideBin(process.argv))
  .option('zip', {
    alias: 'z',
    describe: 'Path to Letterboxd export ZIP file',
    type: 'string',
    demandOption: false
  })
  .option('json', {
    alias: 'j',
    describe: 'Path to a Wrapboxd JSON export (wrapboxd-complete-export-*.json)',
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
  let zipPath = argv.zip;
  let jsonPath = argv.json;
  const outputDir = argv.output;
  const dataDir = argv['data-dir'];
  const noTmdb = Boolean(argv['no-tmdb']);
  const concurrency = Number(argv.concurrency) || 3;
  const title = argv.title || 'Wrapboxd';
  const extrasPathRaw = argv.extras;
  let useExample = Boolean(argv.example);

  console.log(`🎬 Wrapboxd Static Site Generator (Reveal.js)`);
  console.log(`📤 Output directory: ${outputDir}`);

  try {
    // Convenience default: if neither --zip nor --json nor --example is provided,
    // try to auto-detect a Wrapboxd JSON export first, then a single .zip.
    if (!useExample && !zipPath && !jsonPath) {
      const cwd = process.cwd();
      const entries = await fs.readdir(cwd);
      const jsonCandidates = entries
        .filter((f) => String(f).toLowerCase().endsWith(".json"))
        .filter((f) => String(f).toLowerCase().includes("wrapboxd-complete-export"));
      if (jsonCandidates.length >= 1) {
        // Prefer most recently modified
        const withMtime = await Promise.all(jsonCandidates.map(async (f) => {
          const p = path.join(cwd, f);
          const stat = await fs.stat(p);
          return { f, p, mtimeMs: stat.mtimeMs };
        }));
        withMtime.sort((a, b) => b.mtimeMs - a.mtimeMs);
        jsonPath = withMtime[0].p;
      } else {
        const zips = entries.filter((f) => String(f).toLowerCase().endsWith(".zip"));
        if (zips.length === 1) {
          zipPath = path.join(cwd, zips[0]);
        } else {
          useExample = true;
        }
      }
    }

    if (useExample) {
      console.log(`🧪 Using built-in example data`);
      if (!argv.example && !argv.zip && !argv.json) {
        console.log(`ℹ️  Tip: pass --zip path/to/export.zip (or --json wrapboxd-complete-export.json) to generate your real deck`);
      }
    } else {
      if (jsonPath) {
        jsonPath = path.resolve(process.cwd(), String(jsonPath));
        console.log(`📄 Processing JSON export: ${jsonPath}`);
        if (!await fs.pathExists(jsonPath)) throw new Error(`JSON export file not found: ${jsonPath}`);
      } else {
        if (!zipPath) throw new Error("Missing --zip/--json (or pass --example).");
        console.log(`📁 Processing ZIP: ${zipPath}`);
        if (!await fs.pathExists(zipPath)) throw new Error(`ZIP file not found: ${zipPath}`);
      }
    }

    // Create output directory
    await fs.ensureDir(outputDir);

    // Parse inputs (Node)
    const parsed = useExample
      ? buildExampleParsed()
      : (jsonPath ? await processWrapboxdJsonExport(jsonPath) : await processZipFile(zipPath));

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
    const secrets = useExample ? {} : await loadSecrets({ rootDir: path.join(__dirname, "..") });
    const tmdbEnabled = !useExample
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
        sourceZip: useExample ? "example" : path.basename(jsonPath || zipPath),
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
  const parsed = await parseLetterboxdZipFromPath(zipPath);
  console.log(`  📈 Diary entries: ${parsed.diary.length}`);
  console.log(`  🎞️ Films rows: ${parsed.films.length}`);
  console.log(`  ⭐ Ratings rows: ${parsed.ratings.length}`);
  console.log(`  👀 Watched rows: ${parsed.watched.length}`);
  return parsed;
}

async function processWrapboxdJsonExport(jsonPath) {
  const raw = await fs.readJson(jsonPath);
  const timeline = raw?.analysis?.charts?.timeline || raw?.analysis?.timeline || [];
  if (!Array.isArray(timeline) || timeline.length === 0) {
    throw new Error("Invalid Wrapboxd JSON export: missing analysis.charts.timeline array");
  }

  const diary = [];
  for (const month of timeline) {
    const films = month?.films || [];
    for (const f of films) {
      const watched = f?.watchedDate || f?.diaryDate || null;
      const watchedDate = watched ? String(watched).slice(0, 10) : null;
      if (!watchedDate) continue;
      diary.push({
        Date: watchedDate,
        "Watched Date": watchedDate,
        Name: String(f?.title ?? "").trim(),
        Year: f?.releaseYear != null ? String(f.releaseYear) : "",
        Rating: f?.rating != null ? String(f.rating) : "",
        Rewatch: f?.rewatch ? "Yes" : "",
        Tags: String(f?.tags ?? "").trim(),
      });
    }
  }

  if (!diary.length) {
    throw new Error("Invalid Wrapboxd JSON export: timeline had no watchable film entries");
  }

  return {
    zipFileNames: [path.basename(jsonPath)],
    filesFound: { diary: path.basename(jsonPath), films: null, ratings: null, watched: null },
    diary,
    films: [],
    ratings: [],
    watched: [],
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

// (presentation generation lives in scripts/lib/presentation.js)

// (TMDB enrichment helpers live in scripts/lib/enrichment.js)

// Run the generator
main();
