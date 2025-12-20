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
    default: 'raw_data/letterboxd-export.zip',
    demandOption: true
  })
  .option('extras', {
    alias: 'x',
    describe: 'Optional path to a JSON file with extra inputs (presentation context, manual answers, etc.)',
    type: 'string',
    demandOption: false
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
    const resolvedZipPath = path.resolve(process.cwd(), String(zipPath));
    console.log(`📁 Processing ZIP: ${resolvedZipPath}`);
    if (!await fs.pathExists(resolvedZipPath)) throw new Error(`ZIP file not found: ${resolvedZipPath}`);

    // Create output directory
    await fs.ensureDir(outputDir);

    // Parse inputs (Node) — zip is the only supported input.
    const parsed = await processZipFile(resolvedZipPath);

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
    const secrets = await loadSecrets({ rootDir: path.join(__dirname, "..") });
    const tmdbEnabled = !noTmdb && Boolean(
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
        sourceZip: path.basename(resolvedZipPath),
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

// (presentation generation lives in scripts/lib/presentation.js)

// (TMDB enrichment helpers live in scripts/lib/enrichment.js)

// Run the generator
main();
