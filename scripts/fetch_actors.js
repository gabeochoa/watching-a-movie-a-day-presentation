#!/usr/bin/env node
/**
 * Extracts actors for each movie watched in 2025 from the cached TMDB data,
 * counts appearances, and outputs the top 20 actors.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { openDb } from './lib/db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// Load data files
const filmsPath = path.join(ROOT, 'build/data/films.json');
const enrichmentPath = path.join(ROOT, '02_tmdb_db_info/enrichment_by_film.json');

function main() {
  // Open the cache database
  const cacheDb = openDb({ dataDir: path.join(ROOT, '02_tmdb_db_info') });

  // Load films
  const films = JSON.parse(fs.readFileSync(filmsPath, 'utf-8'));
  
  // Load enrichment data to get tmdb IDs
  const enrichmentRaw = JSON.parse(fs.readFileSync(enrichmentPath, 'utf-8'));
  const enrichmentMap = new Map(enrichmentRaw);

  // Filter for movies watched in 2025
  const films2025 = films.filter(f => 
    f.watchDates && f.watchDates.some(d => d.startsWith('2025'))
  );

  console.log(`Found ${films2025.length} movies watched in 2025`);

  // Count actors
  const actorCounts = new Map();
  const actorNames = new Map(); // id -> name
  
  let processed = 0;
  let notFound = 0;
  
  for (const film of films2025) {
    const enrichment = enrichmentMap.get(film.key);
    if (!enrichment || !enrichment.tmdbId) {
      console.log(`No tmdb ID for: ${film.key}`);
      notFound++;
      continue;
    }
    
    // Get credits from cache
    const cacheKey = `tmdb:v3:/movie/${enrichment.tmdbId}/credits`;
    const cached = cacheDb.get(cacheKey);
    
    if (!cached || !cached.payload || !cached.payload.cast) {
      console.log(`No cached credits for: ${film.key} (${cacheKey})`);
      notFound++;
      continue;
    }
    
    const credits = cached.payload;
    
    // Count top billed actors (first 10 in cast)
    const topCast = credits.cast.slice(0, 10);
    for (const actor of topCast) {
      const count = actorCounts.get(actor.id) || 0;
      actorCounts.set(actor.id, count + 1);
      actorNames.set(actor.id, actor.name);
    }
    
    processed++;
  }

  console.log(`\nProcessed ${processed} movies with credits`);
  console.log(`Not found: ${notFound}`);

  // Sort by count and get top 20
  const sorted = [...actorCounts.entries()]
    .map(([id, count]) => ({ id, name: actorNames.get(id), count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  console.log('\n=== TOP 20 ACTORS ===\n');
  sorted.forEach((actor, i) => {
    console.log(`${(i + 1).toString().padStart(2)}. ${actor.name} (${actor.count} films)`);
  });

  // Save to JSON for the slide
  const outputPath = path.join(ROOT, 'build/data/top_actors.json');
  fs.writeFileSync(outputPath, JSON.stringify(sorted, null, 2));
  console.log(`\nSaved to ${outputPath}`);
}

main();
