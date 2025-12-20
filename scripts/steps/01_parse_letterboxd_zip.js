#!/usr/bin/env node

import path from "node:path";
import fs from "fs-extra";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

import { parseLetterboxdZipFromPath } from "../lib/letterboxd_zip_node.js";
import { normalizeDiaryFilms } from "../lib/enrichment.js";

const argv = yargs(hideBin(process.argv))
  .option("zip", { type: "string", demandOption: true, describe: "Path to Letterboxd export ZIP" })
  .option("out", { type: "string", default: "01_csvs_processed", describe: "Output directory" })
  .help()
  .argv;

async function main() {
  const zipPath = path.resolve(process.cwd(), String(argv.zip));
  const outDir = path.resolve(process.cwd(), String(argv.out));

  if (!await fs.pathExists(zipPath)) throw new Error(`ZIP not found: ${zipPath}`);
  await fs.ensureDir(outDir);

  const parsed = await parseLetterboxdZipFromPath(zipPath);
  const filmsNormalized = normalizeDiaryFilms(parsed);

  const summary = {
    zip: path.basename(zipPath),
    filesFound: parsed.filesFound,
    counts: {
      diary: parsed.diary.length,
      films: parsed.films.length,
      ratings: parsed.ratings.length,
      watched: parsed.watched.length,
      uniqueDiaryFilms: filmsNormalized.length,
    },
  };

  await fs.writeJson(path.join(outDir, "parsed.json"), parsed, { spaces: 2 });
  await fs.writeJson(path.join(outDir, "films_normalized.json"), filmsNormalized, { spaces: 2 });
  await fs.writeJson(path.join(outDir, "summary.json"), summary, { spaces: 2 });

  // eslint-disable-next-line no-console
  console.log(`✅ Wrote:`)
  // eslint-disable-next-line no-console
  console.log(`- ${path.join(outDir, "parsed.json")}`);
  // eslint-disable-next-line no-console
  console.log(`- ${path.join(outDir, "films_normalized.json")}`);
  // eslint-disable-next-line no-console
  console.log(`- ${path.join(outDir, "summary.json")}`);
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(`❌ ${e.message}`);
  process.exit(1);
});

