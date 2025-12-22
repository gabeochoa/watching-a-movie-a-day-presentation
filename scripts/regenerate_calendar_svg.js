#!/usr/bin/env node
/**
 * Regenerate the calendar heatmap SVG for slide-009.html
 * 
 * Usage: node scripts/regenerate_calendar_svg.js --zip raw_data/letterboxd-*.zip
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

function generateCalendarSVG(watchDates, year) {
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const DAYS = ["S", "M", "T", "W", "T", "F", "S"];
  
  // Convert watch dates to a Set for quick lookup
  const watchSet = new Set(watchDates);
  
  // SVG building
  const cellSize = 20;
  const cellGap = 2;
  const monthWidth = 185; // Width for each month column
  const monthsPerRow = 6;
  const headerHeight = 60;
  const rowHeight = 180;
  
  let svg = [];
  
  for (let m = 0; m < 12; m++) {
    const row = Math.floor(m / monthsPerRow);
    const col = m % monthsPerRow;
    const baseX = 40 + col * monthWidth;
    const baseY = row === 0 ? 40 : 220;
    
    // Month label
    svg.push(`<text x="${baseX}" y="${baseY}" fill="rgba(255,255,255,0.5)" font-size="14" font-family="Inter, sans-serif" font-weight="600">${MONTHS[m]}</text>`);
    
    // Day of week headers
    for (let d = 0; d < 7; d++) {
      const x = baseX + 10 + d * (cellSize + cellGap);
      svg.push(`<text x="${x}" y="${baseY + 20}" fill="rgba(255,255,255,0.3)" font-size="9" font-family="Inter, sans-serif" text-anchor="middle">${DAYS[d]}</text>`);
    }
    
    // Get first day of month and number of days
    const firstDay = new Date(year, m, 1);
    const daysInMonth = new Date(year, m + 1, 0).getDate();
    const startDayOfWeek = firstDay.getDay();
    
    // Generate calendar cells
    let week = 0;
    for (let day = 1; day <= daysInMonth; day++) {
      const dayOfWeek = (startDayOfWeek + day - 1) % 7;
      if (day > 1 && dayOfWeek === 0) week++;
      
      const x = baseX + dayOfWeek * (cellSize + cellGap);
      const y = baseY + 28 + week * (cellSize + cellGap);
      
      // Check if this date had a watch
      const dateStr = `${year}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const hasWatch = watchSet.has(dateStr);
      
      const fill = hasWatch ? "rgba(74,222,128,0.7)" : "rgba(255,255,255,0.08)";
      svg.push(`<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" rx="2" fill="${fill}"/>`);
    }
  }
  
  return `<svg viewBox="0 0 1150 400" preserveAspectRatio="xMidYMid meet" style="width: 100%; height: auto;">
          ${svg.join('')}
        </svg>`;
}

async function main() {
  const zipPath = path.resolve(RAW_DATA_DIR, String(argv.zip));
  const isDryRun = argv["dry-run"];
  
  console.log("━━━ CALENDAR HEATMAP REGENERATOR ━━━\n");
  
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
    return dateStr && dateStr.startsWith(String(YEAR));
  });
  
  console.log(`   Found ${diary2025.length} diary entries in ${YEAR}`);
  
  // 2. Extract unique watch dates
  const watchDates = [...new Set(diary2025.map(entry => entry['Watched Date'] || entry.Date))];
  console.log(`📅 Unique watch days: ${watchDates.length}`);
  
  // 3. Generate the new SVG
  console.log("\n🎨 Generating calendar heatmap SVG...");
  const newSVG = generateCalendarSVG(watchDates, YEAR);
  
  // 4. Update slide-009.html
  const slidePath = path.join(SLIDES_DIR, "slide-009.html");
  let content = await fs.readFile(slidePath, "utf8");
  
  // Find and replace the existing SVG in calendar-top div
  const svgRegex = /<div class="calendar-top">\s*<svg[\s\S]*?<\/svg>\s*<\/div>/;
  const match = content.match(svgRegex);
  
  if (!match) {
    throw new Error("Could not find calendar-top SVG in slide-009.html");
  }
  
  const oldSVG = match[0];
  const newContent = content.replace(svgRegex, `<div class="calendar-top">
        ${newSVG}
      </div>`);
  
  console.log("\n━━━ CHANGES ━━━\n");
  console.log(`Old SVG length: ${oldSVG.length} chars`);
  console.log(`New SVG length: ${newSVG.length} chars`);
  
  // Show Dec dates that are now green
  const decDates = watchDates.filter(d => d.startsWith(`${YEAR}-12`)).sort();
  console.log(`\nDecember watch dates: ${decDates.join(', ')}`);
  
  if (isDryRun) {
    console.log(`\n🔍 DRY RUN: Would update slide-009.html`);
    console.log(`   Run without --dry-run to apply changes.\n`);
  } else {
    await fs.writeFile(slidePath, newContent);
    console.log(`\n✅ Updated slide-009.html with new calendar heatmap`);
    console.log(`   Run "node scripts/sync_views.js" to update index.html\n`);
  }
}

main().catch(e => {
  console.error(`❌ ${e.message}`);
  process.exit(1);
});

