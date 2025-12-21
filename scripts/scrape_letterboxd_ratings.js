#!/usr/bin/env node
/**
 * Scrape Letterboxd for average ratings and top reviews
 * Uses curl for reliability (works with VPN/proxy)
 */

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'build', 'data');
const CACHE_FILE = path.join(DATA_DIR, 'letterboxd_cache.json');

const DELAY_MS = 600;
const MAX_FILMS = 100;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function readJson(filepath) {
  return JSON.parse(fs.readFileSync(filepath, 'utf8'));
}

function writeJson(filepath, data) {
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
}

function curlGet(url) {
  try {
    const html = execSync(
      `curl -k -s -L --max-redirs 5 -A "Mozilla/5.0" "${url}"`,
      { encoding: 'utf8', timeout: 15000, maxBuffer: 10 * 1024 * 1024 }
    );
    return html;
  } catch (error) {
    throw new Error(`curl failed: ${error.message}`);
  }
}

// Extract film slug from boxd.it redirect
// boxd.it/xxx -> letterboxd.com/username/film/slug/ -> extract "slug"
function extractFilmSlug(html) {
  // Look for the film link in the HTML
  // Pattern: href="/film/slug/" or og:url containing /film/slug/
  const filmMatch = html.match(/href="\/film\/([^\/]+)\/"/);
  if (filmMatch) return filmMatch[1];
  
  // Try og:url
  const ogMatch = html.match(/property="og:url"[^>]*content="[^"]*\/film\/([^\/]+)\/"/);
  if (ogMatch) return ogMatch[1];
  
  // Try canonical link
  const canonicalMatch = html.match(/letterboxd\.com\/film\/([^\/]+)/);
  if (canonicalMatch) return canonicalMatch[1];
  
  return null;
}

function parseAverageRating(html) {
  // <meta name="twitter:data2" content="3.78 out of 5">
  const match = html.match(/name="twitter:data2"\s+content="([\d.]+)\s+out\s+of\s+5"/);
  if (match) return parseFloat(match[1]);
  return null;
}

function parseTopReviews(html, limit = 5) {
  const reviews = [];
  const pattern = /<div[^>]*class="[^"]*body-text[^"]*-prose[^"]*"[^>]*>([\s\S]*?)<\/div>/g;
  
  let match;
  while ((match = pattern.exec(html)) !== null && reviews.length < limit) {
    let text = match[1]
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
    
    if (text.length > 15) {
      reviews.push({ text: text.slice(0, 200) + (text.length > 200 ? '...' : '') });
    }
  }
  return reviews;
}

async function scrapeFilm(film, cache) {
  const { letterboxdUri, title, year, userRating } = film;
  const cacheKey = `${title} (${year})`;
  
  // Check cache
  if (cache[cacheKey]?.letterboxdRating !== undefined && cache[cacheKey].letterboxdRating !== null) {
    return cache[cacheKey];
  }
  
  if (!letterboxdUri) {
    return { letterboxdRating: null, topReviews: [], error: 'no_uri' };
  }
  
  try {
    console.log(`   📄 "${title}" (${year})...`);
    
    // Step 1: Follow the boxd.it redirect to get the film slug
    const reviewPageHtml = curlGet(letterboxdUri);
    const slug = extractFilmSlug(reviewPageHtml);
    
    if (!slug) {
      console.log(`      ⚠️  Could not find film slug`);
      cache[cacheKey] = { letterboxdRating: null, error: 'no_slug' };
      return cache[cacheKey];
    }
    
    // Step 2: Fetch the actual film page
    await sleep(DELAY_MS);
    const filmPageUrl = `https://letterboxd.com/film/${slug}/`;
    const filmPageHtml = curlGet(filmPageUrl);
    const letterboxdRating = parseAverageRating(filmPageHtml);
    
    if (letterboxdRating === null) {
      console.log(`      ⚠️  Could not parse rating`);
      cache[cacheKey] = { letterboxdRating: null, letterboxdSlug: slug, error: 'no_rating' };
      return cache[cacheKey];
    }
    
    // Step 3: Get top reviews
    let topReviews = [];
    await sleep(DELAY_MS);
    try {
      const reviewsHtml = curlGet(`https://letterboxd.com/film/${slug}/reviews/by/activity/`);
      topReviews = parseTopReviews(reviewsHtml);
    } catch (e) {
      // Reviews optional
    }
    
    const diff = userRating - letterboxdRating;
    const diffStr = diff >= 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1);
    console.log(`      ✅ You: ${userRating}★ | LB: ${letterboxdRating}★ (${diffStr})`);
    
    const result = {
      letterboxdRating,
      letterboxdSlug: slug,
      topReviews,
      userRating,
      ratingDiff: diff,
    };
    
    cache[cacheKey] = result;
    return result;
    
  } catch (error) {
    console.log(`      ❌ ${error.message}`);
    cache[cacheKey] = { letterboxdRating: null, error: error.message };
    return cache[cacheKey];
  }
}

async function main() {
  console.log('🔍 Scraping Letterboxd for ratings...\n');
  
  const films = readJson(path.join(DATA_DIR, 'films.json'));
  console.log(`📖 Loaded ${films.length} films`);
  
  let cache = {};
  if (fs.existsSync(CACHE_FILE)) {
    cache = readJson(CACHE_FILE);
    const validCached = Object.values(cache).filter(c => c.letterboxdRating !== null).length;
    console.log(`💾 Cache: ${validCached} valid ratings`);
  }
  
  // Prioritize: 1-star, 2-star, 5-star, sample of others
  const oneStarFilms = films.filter(f => f.userRating === 1);
  const twoStarFilms = films.filter(f => f.userRating === 2);
  const fiveStarFilms = films.filter(f => f.userRating === 5);
  const otherRated = films.filter(f => f.userRating && f.userRating > 2 && f.userRating < 5);
  
  const prioritized = [
    ...oneStarFilms,
    ...twoStarFilms,
    ...fiveStarFilms,
    ...otherRated.slice(0, 15),
  ];
  
  console.log(`\n🎯 Processing ${Math.min(prioritized.length, MAX_FILMS)} films`);
  console.log(`   1★: ${oneStarFilms.length} | 2★: ${twoStarFilms.length} | 5★: ${fiveStarFilms.length}\n`);
  
  const results = {};
  let scraped = 0;
  
  for (const film of prioritized.slice(0, MAX_FILMS)) {
    const result = await scrapeFilm(film, cache);
    results[film.key] = { ...result, title: film.title, year: film.year, userRating: film.userRating };
    scraped++;
    
    if (scraped % 10 === 0) {
      writeJson(CACHE_FILE, cache);
      console.log(`   💾 Saved cache\n`);
    }
    
    await sleep(100);
  }
  
  writeJson(CACHE_FILE, cache);
  
  // Analyze
  const withRatings = Object.values(results).filter(r => r.letterboxdRating !== null);
  const byControversy = [...withRatings].sort((a, b) => Math.abs(b.ratingDiff) - Math.abs(a.ratingDiff));
  const underrated = withRatings.filter(r => r.ratingDiff > 0).sort((a, b) => b.ratingDiff - a.ratingDiff);
  const overrated = withRatings.filter(r => r.ratingDiff < 0).sort((a, b) => a.ratingDiff - b.ratingDiff);
  
  const controversy = {
    meta: { scrapedAt: new Date().toISOString(), total: scraped, withRatings: withRatings.length },
    mostControversial: byControversy.slice(0, 10),
    underrated: underrated.slice(0, 10),
    overrated: overrated.slice(0, 10),
    allResults: results,
  };
  
  writeJson(path.join(DATA_DIR, 'controversy.json'), controversy);
  
  console.log('\n' + '='.repeat(50));
  console.log('🔥 RESULTS');
  console.log('='.repeat(50));
  console.log(`\nScraped ${scraped} films, ${withRatings.length} with ratings\n`);
  
  if (byControversy.length > 0) {
    console.log('🎯 MOST CONTROVERSIAL:');
    byControversy.slice(0, 5).forEach(r => {
      const d = r.ratingDiff >= 0 ? `+${r.ratingDiff.toFixed(1)}` : r.ratingDiff.toFixed(1);
      console.log(`   ${r.title}: You ${r.userRating}★ vs LB ${r.letterboxdRating}★ (${d})`);
    });
  }
  
  if (overrated.length > 0) {
    console.log('\n👇 OVERRATED (they loved, you didn\'t):');
    overrated.slice(0, 5).forEach(r => {
      console.log(`   ${r.title}: You ${r.userRating}★ vs LB ${r.letterboxdRating}★`);
    });
  }
  
  if (underrated.length > 0) {
    console.log('\n👆 UNDERRATED (you loved, they didn\'t):');
    underrated.slice(0, 5).forEach(r => {
      console.log(`   ${r.title}: You ${r.userRating}★ vs LB ${r.letterboxdRating}★`);
    });
  }
  
  console.log('\n' + '='.repeat(50));
}

main().catch(console.error);
