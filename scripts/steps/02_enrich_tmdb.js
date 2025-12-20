#!/usr/bin/env node

import path from "node:path";
import fs from "fs-extra";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

import { openDb } from "../lib/db.js";
import { createTmdbService } from "../lib/tmdb.js";
import { loadSecrets } from "../lib/secrets.js";
import {
  normalizeDiaryFilms,
  enrichFilmsWithTmdb,
  computeEnrichedAggregatesForDiary,
} from "../lib/enrichment.js";

const argv = yargs(hideBin(process.argv))
  .option("in", { type: "string", demandOption: true, describe: "Path to 01_csvs_processed/parsed.json" })
  .option("out", { type: "string", default: "02_tmdb_db_info", describe: "Output directory for enrichment artifacts" })
  .option("cache-dir", { type: "string", default: "02_tmdb_db_info", describe: "Directory for SQLite cache.sqlite" })
  .option("concurrency", { type: "number", default: 3, describe: "Max concurrent TMDB requests" })
  .help()
  .argv;

async function main() {
  const inPath = path.resolve(process.cwd(), String(argv.in));
  const outDir = path.resolve(process.cwd(), String(argv.out));
  const cacheDir = path.resolve(process.cwd(), String(argv["cache-dir"]));
  const concurrency = Number(argv.concurrency) || 3;

  if (!await fs.pathExists(inPath)) throw new Error(`Input not found: ${inPath}`);
  await fs.ensureDir(outDir);
  await fs.ensureDir(cacheDir);

  const parsed = await fs.readJson(inPath);
  const films = normalizeDiaryFilms(parsed);

  const secrets = await loadSecrets({ rootDir: path.resolve(process.cwd()) });
  const bearer = (secrets?.TMDB_BEARER_TOKEN || process.env.TMDB_BEARER_TOKEN || "").trim();
  const apiKey = (secrets?.TMDB_API_KEY || process.env.TMDB_API_KEY || "").trim();
  if (!bearer && !apiKey) {
    throw new Error("Missing TMDB credentials. Set TMDB_BEARER_TOKEN (preferred) or TMDB_API_KEY (in secrets.js or env).");
  }

  const tmdbRequestStats = { hit: 0, miss: 0, unknown: 0 };
  const db = openDb({ dataDir: cacheDir });
  const tmdb = createTmdbService({ db, bearerToken: bearer, apiKey });

  // eslint-disable-next-line no-console
  console.log(`🧠 Enriching with TMDB (films: ${films.length}, concurrency: ${concurrency})`);

  const result = await enrichFilmsWithTmdb({ films, tmdb, tmdbRequestStats, concurrency });
  const enrichmentEntries = Array.from(result.perFilm.entries()).sort(([a], [b]) => a.localeCompare(b));
  const aggregates = computeEnrichedAggregatesForDiary(parsed.diary, result.perFilm, { mapped: result.mapped, failed: result.failed });

  await fs.writeJson(path.join(outDir, "enrichment_by_film.json"), enrichmentEntries, { spaces: 2 });
  await fs.writeJson(path.join(outDir, "enriched_aggregates.json"), aggregates, { spaces: 2 });
  await fs.writeJson(path.join(outDir, "tmdb_request_stats.json"), tmdbRequestStats, { spaces: 2 });
  await fs.writeJson(path.join(outDir, "tmdb_cache_stats.json"), db.stats(), { spaces: 2 });

  // eslint-disable-next-line no-console
  console.log(`✅ Wrote:`)
  // eslint-disable-next-line no-console
  console.log(`- ${path.join(outDir, "enrichment_by_film.json")}`);
  // eslint-disable-next-line no-console
  console.log(`- ${path.join(outDir, "enriched_aggregates.json")}`);
  // eslint-disable-next-line no-console
  console.log(`- ${path.join(outDir, "tmdb_request_stats.json")}`);
  // eslint-disable-next-line no-console
  console.log(`- ${path.join(outDir, "tmdb_cache_stats.json")}`);
  // eslint-disable-next-line no-console
  console.log(`ℹ️  cache.sqlite lives in: ${cacheDir}`);
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(`❌ ${e.message}`);
  process.exit(1);
});

