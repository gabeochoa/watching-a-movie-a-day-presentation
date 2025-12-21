#!/usr/bin/env node
/**
 * Fetch poster URLs from Letterboxd for each film
 * Uses the letterboxd cache slugs to construct poster URLs
 */

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'build', 'data');
const CACHE_FILE = path.join(DATA_DIR, 'poster_cache.json');

const DELAY_MS = 400;
const MAX_FILMS = 365; // Get posters for the whole year

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function readJson(filepath) {
  if (!fs.existsSync(filepath)) return null;
  return JSON.parse(fs.readFileSync(filepath, 'utf8'));
}

function writeJson(filepath, data) {
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
}

function curlGet(url) {
  try {
    const html = execSync(
      `curl -k -s -L --max-redirs 5 -A "Mozilla/5.0" "${url}"`,
      { encoding: 'utf8', timeout: 10000, maxBuffer: 5 * 1024 * 1024 }
    );
    return html;
  } catch (error) {
    return null;
  }
}

function extractPosterUrl(html) {
  if (!html) return null;
  
  // Look for og:image which contains the poster
  const match = html.match(/property="og:image"\s+content="([^"]+)"/);
  if (match) {
    return match[1];
  }
  
  // Try twitter:image
  const twitterMatch = html.match(/name="twitter:image"\s+content="([^"]+)"/);
  if (twitterMatch) {
    return twitterMatch[1];
  }
  
  return null;
}

async function main() {
  console.log('🖼️  Fetching poster URLs...\n');
  
  const films = readJson(path.join(DATA_DIR, 'films.json'));
  const lbCache = readJson(path.join(DATA_DIR, 'letterboxd_cache.json')) || {};
  
  if (!films) {
    console.error('❌ No films.json found');
    process.exit(1);
  }
  
  // Load existing poster cache
  let posterCache = readJson(CACHE_FILE) || {};
  console.log(`📖 ${films.length} films, ${Object.keys(posterCache).length} already cached`);
  
  // Sort films by watch date for chronological order
  const sortedFilms = [...films].sort((a, b) => {
    const dateA = a.watchDates?.[0] || '';
    const dateB = b.watchDates?.[0] || '';
    return dateA.localeCompare(dateB);
  });
  
  let fetched = 0;
  let newFetches = 0;
  
  for (const film of sortedFilms.slice(0, MAX_FILMS)) {
    const key = film.key;
    
    // Check if already cached
    if (posterCache[key]) {
      fetched++;
      continue;
    }
    
    // Get the slug from letterboxd cache or construct from URI
    const lbData = lbCache[key];
    let slug = lbData?.letterboxdSlug;
    
    if (!slug && film.letterboxdUri) {
      // Need to fetch to get the slug first
      console.log(`   📄 Getting slug for "${film.title}"...`);
      const html = curlGet(film.letterboxdUri);
      if (html) {
        const slugMatch = html.match(/letterboxd\.com\/film\/([^\/]+)/);
        slug = slugMatch ? slugMatch[1] : null;
      }
      await sleep(DELAY_MS);
    }
    
    if (!slug) {
      console.log(`   ⚠️  No slug for "${film.title}"`);
      posterCache[key] = { posterUrl: null, error: 'no_slug' };
      fetched++;
      continue;
    }
    
    // Fetch the film page to get the poster
    console.log(`   🖼️  "${film.title}"...`);
    const filmUrl = `https://letterboxd.com/film/${slug}/`;
    const html = curlGet(filmUrl);
    const posterUrl = extractPosterUrl(html);
    
    if (posterUrl) {
      console.log(`      ✅ Got poster`);
      posterCache[key] = { 
        posterUrl, 
        slug,
        watchDate: film.watchDates?.[0] || null,
      };
    } else {
      console.log(`      ⚠️  No poster found`);
      posterCache[key] = { posterUrl: null, slug, error: 'no_poster' };
    }
    
    fetched++;
    newFetches++;
    
    // Save periodically
    if (newFetches % 20 === 0) {
      writeJson(CACHE_FILE, posterCache);
      console.log(`   💾 Saved cache (${Object.keys(posterCache).length} entries)`);
    }
    
    await sleep(DELAY_MS);
  }
  
  // Final save
  writeJson(CACHE_FILE, posterCache);
  
  // Create a chronological list of posters by month
  const postersByMonth = {};
  for (const [key, data] of Object.entries(posterCache)) {
    if (data.posterUrl && data.watchDate) {
      const month = data.watchDate.substring(0, 7); // YYYY-MM
      if (!postersByMonth[month]) postersByMonth[month] = [];
      postersByMonth[month].push({
        key,
        posterUrl: data.posterUrl,
        watchDate: data.watchDate,
      });
    }
  }
  
  writeJson(path.join(DATA_DIR, 'posters_by_month.json'), postersByMonth);
  
  // Summary
  const withPosters = Object.values(posterCache).filter(p => p.posterUrl).length;
  console.log('\n' + '='.repeat(50));
  console.log(`✅ Done! ${withPosters}/${fetched} films have posters`);
  console.log('='.repeat(50));
}

main().catch(console.error);

