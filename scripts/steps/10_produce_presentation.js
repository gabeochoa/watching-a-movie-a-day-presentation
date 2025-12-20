#!/usr/bin/env node

import path from "node:path";
import fs from "fs-extra";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

import { computeFromLetterboxd } from "../../public/src/analytics/compute.js";
import { generateRevealSite, generatePromptsFile } from "../lib/presentation.js";

const argv = yargs(hideBin(process.argv))
  .option("parsed", { type: "string", demandOption: true, describe: "Path to 01_csvs_processed/parsed.json" })
  .option("enrichment", { type: "string", demandOption: false, describe: "Path to 02_tmdb_db_info/enrichment_by_film.json" })
  .option("enriched", { type: "string", demandOption: false, describe: "Path to 02_tmdb_db_info/enriched_aggregates.json" })
  .option("out", { type: "string", default: "10_produce_presentation/dist-reveal", describe: "Output directory for reveal deck" })
  .option("title", { type: "string", default: "Wrapboxd", describe: "Deck title" })
  .help()
  .argv;

async function main() {
  const parsedPath = path.resolve(process.cwd(), String(argv.parsed));
  const enrichmentPath = argv.enrichment ? path.resolve(process.cwd(), String(argv.enrichment)) : null;
  const enrichedPath = argv.enriched ? path.resolve(process.cwd(), String(argv.enriched)) : null;
  const outDir = path.resolve(process.cwd(), String(argv.out));
  const title = String(argv.title || "Wrapboxd");

  if (!await fs.pathExists(parsedPath)) throw new Error(`Parsed input not found: ${parsedPath}`);
  await fs.ensureDir(outDir);

  const parsed = await fs.readJson(parsedPath);
  const computedAll = computeFromLetterboxd({ diary: parsed.diary, films: parsed.films });

  let enrichmentByFilm = [];
  let enrichedAll = null;
  let tmdbEnabled = false;

  if (enrichmentPath && await fs.pathExists(enrichmentPath)) {
    enrichmentByFilm = await fs.readJson(enrichmentPath);
    tmdbEnabled = true;
  }

  if (enrichedPath && await fs.pathExists(enrichedPath)) {
    enrichedAll = await fs.readJson(enrichedPath);
    tmdbEnabled = true;
  }

  const payload = {
    meta: {
      generatedAt: new Date().toISOString(),
      source: "workflow",
      tmdbEnabled,
    },
    extras: null,
    parsed,
    computedAll,
    enrichmentByFilm,
    enrichedAll,
    tmdbCacheStats: null,
    tmdbRequestStats: { hit: 0, miss: 0, unknown: 0 },
  };

  const { slideCount } = await generateRevealSite(payload, outDir, { title });
  await generatePromptsFile(payload, outDir);

  // eslint-disable-next-line no-console
  console.log(`✅ Deck generated (${slideCount} slides): ${path.join(outDir, "index.html")}`);
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(`❌ ${e.message}`);
  process.exit(1);
});

