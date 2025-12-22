#!/usr/bin/env node
/**
 * Patch slides with updated Letterboxd data
 * 
 * This script:
 * 1. Parses a new Letterboxd ZIP export
 * 2. Calculates updated stats
 * 3. Surgically updates only the numeric values in slide HTML files
 * 4. Verifies that only numbers changed (not structure/styles)
 * 
 * Usage:
 *   node scripts/patch_slides.js --zip raw_data/letterboxd-choicehoney-2025-12-22.zip
 *   node scripts/patch_slides.js --zip raw_data/letterboxd-choicehoney-2025-12-22.zip --dry-run
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { parseLetterboxdZipFromPath } from './lib/letterboxd_zip_node.js';
import { 
  calculateStats, 
  loadCurrentInsights, 
  generatePatches,
  SLIDE_PATCHES 
} from './lib/slide_patches.js';
import {
  createStructuralFingerprint,
  verifyStructure,
  formatPatchReport,
} from './lib/verification.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const SLIDES_DIR = path.join(ROOT, 'build', 'presentation', 'slides');
const ENRICHED_DIR = path.join(ROOT, '02_tmdb_db_info');

const argv = yargs(hideBin(process.argv))
  .option('zip', { 
    type: 'string', 
    demandOption: true, 
    describe: 'Path to new Letterboxd export ZIP' 
  })
  .option('dry-run', { 
    type: 'boolean', 
    default: false, 
    describe: 'Preview changes without modifying files' 
  })
  .option('verbose', { 
    type: 'boolean', 
    default: false, 
    describe: 'Show detailed diff for each slide' 
  })
  .help()
  .argv;

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  const zipPath = path.resolve(process.cwd(), String(argv.zip));
  const dryRun = argv['dry-run'];
  const verbose = argv.verbose;

  console.log('━━━ SLIDE PATCHER ━━━\n');
  
  // 1. Parse new zip
  console.log(`📦 Parsing ZIP: ${path.basename(zipPath)}`);
  if (!fs.existsSync(zipPath)) {
    console.error(`❌ ZIP not found: ${zipPath}`);
    process.exit(1);
  }
  
  const parsed = await parseLetterboxdZipFromPath(zipPath);
  console.log(`   Found ${parsed.diary.length} diary entries`);

  // 2. Load enrichment data for runtimes
  const enrichmentPath = path.join(ENRICHED_DIR, 'enrichment_by_film.json');
  let enrichment = new Map();
  if (fs.existsSync(enrichmentPath)) {
    const enrichmentRaw = JSON.parse(fs.readFileSync(enrichmentPath, 'utf8'));
    enrichment = new Map(enrichmentRaw);
    console.log(`🎬 Loaded ${enrichment.size} enriched films`);
  } else {
    console.log('⚠️  No enrichment data found - runtimes will be estimated');
  }

  // 3. Calculate new stats
  console.log('\n📊 Calculating stats...');
  const newStats = calculateStats(parsed.diary, enrichment);
  
  // 4. Load current insights for comparison
  const currentInsights = loadCurrentInsights();
  
  // 5. Show comparison
  console.log('\n━━━ STAT CHANGES ━━━\n');
  const statDiffs = [
    { name: 'Total Films', old: currentInsights.summary.totalFilms, new: newStats.totalFilms },
    { name: 'Total Watches', old: currentInsights.summary.totalWatches, new: newStats.totalWatches },
    { name: 'Total Hours', old: currentInsights.summary.totalHours, new: newStats.totalHours },
    { name: 'Total Days', old: currentInsights.summary.totalDays, new: newStats.totalDays },
    { name: 'Avg Rating', old: currentInsights.summary.avgRating, new: newStats.avgRating },
    { name: '1-star count', old: currentInsights.ratings.distribution['1'], new: newStats.ratingCounts[1] },
    { name: '2-star count', old: currentInsights.ratings.distribution['2'], new: newStats.ratingCounts[2] },
    { name: '3-star count', old: currentInsights.ratings.distribution['3'], new: newStats.ratingCounts[3] },
    { name: '4-star count', old: currentInsights.ratings.distribution['4'], new: newStats.ratingCounts[4] },
    { name: '5-star count', old: currentInsights.ratings.distribution['5'], new: newStats.ratingCounts[5] },
    { name: 'Dec count', old: currentInsights.temporal.monthlyData.find(m => m.month === '2025-12')?.count || 0, new: newStats.monthlyData['2025-12'] || 0 },
  ];

  for (const diff of statDiffs) {
    const changed = diff.old !== diff.new;
    const symbol = changed ? '→' : '=';
    const color = changed ? '\x1b[33m' : '\x1b[90m';
    console.log(`${color}  ${diff.name}: ${diff.old} ${symbol} ${diff.new}\x1b[0m`);
  }

  // 6. Generate patches for each slide
  console.log('\n━━━ PATCH REPORT ━━━\n');
  
  const results = [];
  let allStructuresValid = true;

  for (const [slideFile, patchDefs] of Object.entries(SLIDE_PATCHES)) {
    const slidePath = path.join(SLIDES_DIR, slideFile);
    
    if (!fs.existsSync(slidePath)) {
      console.log(`⚠️  ${slideFile}: not found, skipping`);
      continue;
    }

    const originalContent = fs.readFileSync(slidePath, 'utf8');
    const originalFingerprint = createStructuralFingerprint(originalContent);
    
    // Generate and apply patches
    const patches = generatePatches(patchDefs, currentInsights, newStats);
    let newContent = originalContent;
    const appliedChanges = [];

    for (const patch of patches) {
      const beforeContent = newContent;
      newContent = newContent.replace(patch.find, patch.replace);
      
      if (beforeContent !== newContent) {
        appliedChanges.push({
          description: patch.description,
          from: patch.oldValue,
          to: patch.newValue,
        });
      }
    }

    // Verify structure
    const newFingerprint = createStructuralFingerprint(newContent);
    const structureValid = verifyStructure(originalFingerprint, newFingerprint);
    
    if (!structureValid) {
      allStructuresValid = false;
    }

    results.push({
      file: slideFile,
      structureValid,
      changes: appliedChanges,
      originalContent,
      newContent,
      hasChanges: originalContent !== newContent,
    });

    // Print result for this slide
    console.log(`${slideFile}:`);
    console.log(`  ${structureValid ? '✓' : '✗'} Structure ${structureValid ? 'unchanged' : 'CHANGED - VERIFY MANUALLY!'}`);
    
    if (appliedChanges.length > 0) {
      console.log('  Changes:');
      for (const change of appliedChanges) {
        console.log(`    - ${change.description}: "${change.from}" → "${change.to}"`);
      }
    } else {
      console.log('  No changes needed');
    }
    console.log();
  }

  // 7. Verification summary
  console.log('━━━ VERIFICATION ━━━\n');
  
  if (allStructuresValid) {
    console.log('✓ All slides: Only numeric values changed');
  } else {
    console.log('✗ WARNING: Some slides had structural changes!');
    console.log('  Review the changes manually before proceeding.');
  }

  // 8. Apply changes (if not dry-run)
  const slidesWithChanges = results.filter(r => r.hasChanges);
  
  if (slidesWithChanges.length === 0) {
    console.log('\n📝 No changes to apply.');
    return;
  }

  if (dryRun) {
    console.log(`\n🔍 DRY RUN: Would update ${slidesWithChanges.length} slides`);
    console.log('   Run without --dry-run to apply changes.');
  } else {
    console.log(`\n📝 Applying changes to ${slidesWithChanges.length} slides...`);
    
    for (const result of slidesWithChanges) {
      const slidePath = path.join(SLIDES_DIR, result.file);
      fs.writeFileSync(slidePath, result.newContent, 'utf8');
      console.log(`   ✓ Updated ${result.file}`);
    }
    
    console.log('\n✅ Done! Run "node scripts/sync_views.js" to update index.html');
  }
}

main().catch((e) => {
  console.error(`❌ Error: ${e.message}`);
  if (argv.verbose) console.error(e.stack);
  process.exit(1);
});

