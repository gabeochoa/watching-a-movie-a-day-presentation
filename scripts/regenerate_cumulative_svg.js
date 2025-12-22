#!/usr/bin/env node
/**
 * Regenerate the cumulative chart SVG for slide-003.html
 * 
 * Usage: node scripts/regenerate_cumulative_svg.js --zip raw_data/letterboxd-*.zip
 */

import path from "node:path";
import fs from "fs-extra";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { parseLetterboxdZipFromPath } from "./lib/letterboxd_zip_node.js";

const ROOT = process.cwd();
const RAW_DATA_DIR = path.join(ROOT, "raw_data");
const SLIDES_DIR = path.join(ROOT, "build", "presentation", "slides");

const argv = yargs(hideBin(process.argv))
  .option("zip", { type: "string", demandOption: true, describe: "Path to Letterboxd export ZIP" })
  .option("dry-run", { type: "boolean", default: false, describe: "Preview changes without applying" })
  .help()
  .argv;

function generateCumulativeSVG(dailyCounts) {
  // SVG dimensions from the original
  const viewWidth = 1920;
  const viewHeight = 1080;
  const xStart = 60;
  const xEnd = 1860;
  const yBottom = 850;  // 0 films
  const yTop = 200;     // max films
  
  const totalDays = dailyCounts.length;
  const xStep = (xEnd - xStart) / (totalDays - 1);
  const yRange = yBottom - yTop;
  
  // Calculate cumulative totals
  let cumulative = 0;
  const cumulativeData = dailyCounts.map((count, i) => {
    cumulative += count;
    return { day: i, cumulative };
  });
  
  const maxFilms = cumulative;
  const yScale = yRange / maxFilms;
  
  // Generate polyline points
  const polylinePoints = cumulativeData.map(d => {
    const x = xStart + d.day * xStep;
    const y = yBottom - (d.cumulative * yScale);
    return `${x},${y}`;
  }).join(" ");
  
  // Generate polygon points (for the filled area)
  const polygonPoints = [
    `${xStart},${yBottom}`,  // Start at bottom-left
    ...cumulativeData.map(d => {
      const x = xStart + d.day * xStep;
      const y = yBottom - (d.cumulative * yScale);
      return `${x},${y}`;
    }),
    `${xEnd},${yBottom}`  // End at bottom-right
  ].join(" ");
  
  // Month labels (positioned at mid-month)
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthLabels = months.map((month, i) => {
    // Calculate x position for mid-month (15th day of each month)
    const daysInMonthStart = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
    const midMonthDay = daysInMonthStart[i] + 15;
    const x = xStart + midMonthDay * xStep;
    return `<text x="${x}" y="920" fill="rgba(255,255,255,0.4)" font-size="24" text-anchor="middle" font-family="Inter, sans-serif">${month}</text>`;
  }).join("");
  
  return `<svg class="bg-chart" viewBox="0 0 ${viewWidth} ${viewHeight}" preserveAspectRatio="none">
        <polyline points="${polylinePoints}" fill="none" stroke="rgba(48, 209, 88, 0.22)" stroke-width="4"/>
        <polygon points="${polygonPoints}" fill="rgba(48, 209, 88, 0.10)"/>
        ${monthLabels}
      </svg>`;
}

async function main() {
  const zipPath = path.resolve(RAW_DATA_DIR, String(argv.zip));
  const isDryRun = argv["dry-run"];
  
  console.log("━━━ CUMULATIVE CHART REGENERATOR ━━━\n");
  
  if (!await fs.pathExists(zipPath)) {
    throw new Error(`ZIP not found: ${zipPath}`);
  }
  
  // 1. Parse the Letterboxd zip
  console.log(`📦 Parsing ZIP: ${path.basename(zipPath)}`);
  const parsed = await parseLetterboxdZipFromPath(zipPath);
  
  // Filter to 2025
  const YEAR = 2025;
  const diary2025 = parsed.diary.filter(entry => {
    const dateStr = entry['Watched Date'] || entry.Date;
    return dateStr && new Date(dateStr).getFullYear() === YEAR;
  });
  
  console.log(`   Found ${diary2025.length} diary entries in ${YEAR}`);
  
  // 2. Build daily counts for the entire year
  const dailyCounts = [];
  const startDate = new Date(`${YEAR}-01-01`);
  const endDate = new Date(`${YEAR}-12-31`);
  
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    const watchedToday = diary2025.filter(entry => {
      const entryDate = entry['Watched Date'] || entry.Date;
      return entryDate === dateStr;
    }).length;
    dailyCounts.push(watchedToday);
  }
  
  // Calculate total
  const totalFilms = dailyCounts.reduce((a, b) => a + b, 0);
  console.log(`📊 Total films in ${YEAR}: ${totalFilms}`);
  
  // 3. Generate the new SVG
  console.log("\n🎨 Generating cumulative chart SVG...");
  const newSVG = generateCumulativeSVG(dailyCounts);
  
  // 4. Update slide-003.html
  const slidePath = path.join(SLIDES_DIR, "slide-003.html");
  let content = await fs.readFile(slidePath, "utf8");
  
  // Find and replace the existing SVG
  const svgRegex = /<svg class="bg-chart"[\s\S]*?<\/svg>/;
  const match = content.match(svgRegex);
  
  if (!match) {
    throw new Error("Could not find bg-chart SVG in slide-003.html");
  }
  
  const oldSVG = match[0];
  const newContent = content.replace(svgRegex, newSVG);
  
  console.log("\n━━━ CHANGES ━━━\n");
  console.log(`Old SVG length: ${oldSVG.length} chars`);
  console.log(`New SVG length: ${newSVG.length} chars`);
  
  if (isDryRun) {
    console.log(`\n🔍 DRY RUN: Would update slide-003.html`);
    console.log(`   Run without --dry-run to apply changes.\n`);
  } else {
    await fs.writeFile(slidePath, newContent);
    console.log(`\n✅ Updated slide-003.html with new cumulative chart`);
    console.log(`   Run "node scripts/sync_views.js" to update index.html\n`);
  }
}

main().catch(e => {
  console.error(`❌ ${e.message}`);
  process.exit(1);
});

