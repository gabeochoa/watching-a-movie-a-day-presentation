#!/usr/bin/env node
/**
 * Extract sequel/collection data from TMDB cache
 * Shows which sequels were watched in 2025 and whether other movies in the series were also watched
 */

import Database from "better-sqlite3";
import fs from "node:fs";

// Load films data
const films = JSON.parse(fs.readFileSync("build/data/films.json", "utf8"));

// Open TMDB cache
const db = new Database("02_tmdb_db_info/cache.sqlite");

// Build map of film keys to their watch data
const filmMap = new Map(films.map(f => [f.key, f]));

// Get enrichment data (film key -> tmdbId)
const enrichment = JSON.parse(fs.readFileSync("02_tmdb_db_info/enrichment_by_film.json", "utf8"));
const enrichmentMap = new Map(enrichment);

// Get all movie details with collection info from cache
const stmt = db.prepare("SELECT cache_key, payload_json FROM tmdb_cache WHERE cache_key LIKE 'tmdb:v3:/movie/%' AND cache_key NOT LIKE '%/credits'");
const rows = stmt.all();

// Build tmdbId -> movie details map
const tmdbMovies = new Map();
for (const row of rows) {
  const payload = JSON.parse(row.payload_json);
  if (payload.id) {
    tmdbMovies.set(String(payload.id), payload);
  }
}

// Build collection info
// collectionId -> { name, movies: [{tmdbId, title, release_date}] }
const collections = new Map();

for (const [tmdbId, movie] of tmdbMovies) {
  if (movie.belongs_to_collection) {
    const colId = movie.belongs_to_collection.id;
    if (!collections.has(colId)) {
      collections.set(colId, {
        id: colId,
        name: movie.belongs_to_collection.name,
        movies: []
      });
    }
    collections.get(colId).movies.push({
      tmdbId: String(movie.id),
      title: movie.title,
      release_date: movie.release_date,
      year: movie.release_date ? parseInt(movie.release_date.substring(0, 4)) : null
    });
  }
}

// Sort movies in each collection by release date
for (const col of collections.values()) {
  col.movies.sort((a, b) => (a.release_date || "").localeCompare(b.release_date || ""));
}

// Find which watched films are part of collections
// Map: tmdbId -> filmKey
const tmdbToFilm = new Map();
for (const [filmKey, data] of enrichmentMap) {
  if (data.tmdbId) {
    tmdbToFilm.set(String(data.tmdbId), filmKey);
  }
}

// Find sequels watched in 2025
const watchedCollections = [];

for (const [filmKey, film] of filmMap) {
  const enrichData = enrichmentMap.get(filmKey);
  if (!enrichData?.tmdbId) continue;
  
  const tmdbId = String(enrichData.tmdbId);
  const movie = tmdbMovies.get(tmdbId);
  if (!movie?.belongs_to_collection) continue;
  
  const colId = movie.belongs_to_collection.id;
  const collection = collections.get(colId);
  if (!collection || collection.movies.length < 2) continue; // Only interested in actual series
  
  // Find position in collection
  const positionInSeries = collection.movies.findIndex(m => m.tmdbId === tmdbId);
  
  // Check which other movies in the collection were also watched
  const seriesStatus = collection.movies.map(m => {
    const watchedFilmKey = tmdbToFilm.get(m.tmdbId);
    const wasWatched = watchedFilmKey && filmMap.has(watchedFilmKey);
    return {
      ...m,
      watched: wasWatched,
      filmKey: watchedFilmKey || null
    };
  });
  
  // Count how many in the series were watched
  const watchedCount = seriesStatus.filter(m => m.watched).length;
  
  watchedCollections.push({
    filmKey,
    title: film.title,
    year: film.year,
    userRating: film.userRating,
    collectionName: collection.name,
    collectionId: colId,
    positionInSeries: positionInSeries + 1,
    totalInSeries: collection.movies.length,
    watchedCount,
    series: seriesStatus
  });
}

// Remove duplicates (same collection might appear multiple times if multiple movies from it were watched)
const seenCollections = new Set();
const uniqueCollections = [];
for (const item of watchedCollections) {
  if (!seenCollections.has(item.collectionId)) {
    seenCollections.add(item.collectionId);
    uniqueCollections.push(item);
  } else {
    // Update the existing entry to reflect all watched movies
    const existing = uniqueCollections.find(c => c.collectionId === item.collectionId);
    // Already handled by seriesStatus
  }
}

// Group by collection to get proper view
const collectionSummaries = [];
for (const colId of seenCollections) {
  const col = collections.get(colId);
  const seriesStatus = col.movies.map(m => {
    const watchedFilmKey = tmdbToFilm.get(m.tmdbId);
    const film = watchedFilmKey ? filmMap.get(watchedFilmKey) : null;
    return {
      ...m,
      watched: !!film,
      filmKey: watchedFilmKey || null,
      userRating: film?.userRating || null
    };
  });
  
  const watchedCount = seriesStatus.filter(m => m.watched).length;
  
  collectionSummaries.push({
    collectionId: colId,
    collectionName: col.name,
    totalInSeries: col.movies.length,
    watchedCount,
    series: seriesStatus,
    // For sorting: prioritize interesting cases
    interestingScore: (watchedCount === 1 ? 10 : 0) + (col.movies.length > 2 ? 5 : 0)
  });
}

// Sort by interesting score (first movie only watched, or longer series)
collectionSummaries.sort((a, b) => b.interestingScore - a.interestingScore || a.collectionName.localeCompare(b.collectionName));

console.log("=== SEQUEL/COLLECTION ANALYSIS ===\n");
console.log(`Found ${collectionSummaries.length} collections where at least one movie was watched\n`);

// Show interesting cases: watched only one movie from a multi-movie series
console.log("=== PARTIAL SERIES (Watched 1 out of 2+) ===\n");
const partialSeries = collectionSummaries.filter(c => c.watchedCount === 1 && c.totalInSeries >= 2);
for (const col of partialSeries.slice(0, 20)) {
  console.log(`${col.collectionName} (${col.watchedCount}/${col.totalInSeries})`);
  for (const m of col.series) {
    const marker = m.watched ? "✓" : "○";
    console.log(`  ${marker} ${m.title} (${m.year || "?"})`);
  }
  console.log();
}

console.log("\n=== COMPLETE SERIES (Watched all) ===\n");
const completeSeries = collectionSummaries.filter(c => c.watchedCount === c.totalInSeries);
for (const col of completeSeries.slice(0, 10)) {
  console.log(`${col.collectionName} (${col.watchedCount}/${col.totalInSeries})`);
  for (const m of col.series) {
    console.log(`  ✓ ${m.title} (${m.year || "?"})`);
  }
  console.log();
}

// Output JSON for slide generation
const output = {
  partialSeries: partialSeries.map(c => ({
    name: c.collectionName.replace(" Collection", ""),
    watched: c.watchedCount,
    total: c.totalInSeries,
    movies: c.series.map(m => ({
      title: m.title,
      year: m.year,
      watched: m.watched,
      rating: m.userRating
    }))
  })),
  completeSeries: completeSeries.map(c => ({
    name: c.collectionName.replace(" Collection", ""),
    watched: c.watchedCount,
    total: c.totalInSeries,
    movies: c.series.map(m => ({
      title: m.title,
      year: m.year,
      watched: m.watched,
      rating: m.userRating
    }))
  }))
};

fs.writeFileSync("build/data/sequels.json", JSON.stringify(output, null, 2));
console.log("\nWrote build/data/sequels.json");

