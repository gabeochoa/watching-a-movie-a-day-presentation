import { tmdbMovieDetailsKey } from "./keys.js";

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function nowIso() {
  return new Date().toISOString();
}

async function fetchJson(fetchImpl, url, { apiKey } = {}) {
  const res = await fetchImpl(url, {
    headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : undefined,
  });
  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const payload = isJson ? await res.json() : await res.text();
  return { status: res.status, ok: res.ok, payload };
}

/**
 * Creates a tiny TMDB client with cache-first behavior.
 *
 * apiKey:
 * - Browser UI stores this locally; not committed.
 * - We support v4-style bearer tokens and (optionally) v3 keys.
 *
 * cache keys are versioned and deterministic.
 */
export function createTmdbClient({
  apiKey,
  fetchImpl,
  getCached,
  setCached,
  log = () => {},
} = {}) {
  if (!fetchImpl) throw new Error("fetchImpl is required");
  if (!getCached || !setCached) throw new Error("getCached/setCached are required");

  // Minimal rate limit guard: keep at least 250ms between network calls.
  let lastNetworkAt = 0;
  async function throttledFetch(url) {
    const elapsed = Date.now() - lastNetworkAt;
    if (elapsed < 250) await sleep(250 - elapsed);
    lastNetworkAt = Date.now();
    return fetchJson(fetchImpl, url, { apiKey });
  }

  async function getMovieDetails(tmdbId) {
    const key = tmdbMovieDetailsKey(tmdbId);
    const cached = getCached(key);
    if (cached) {
      log(`Cache hit: ${key}`);
      if (cached.status >= 200 && cached.status < 300) return cached.payload;
      throw new Error(`Cached TMDB error (status=${cached.status})`);
    }

    log(`Cache miss: ${key}`);
    if (!apiKey) throw new Error("No TMDB API key configured (needed for cache misses).");

    // Use v3 endpoint; authorization header works with v4 bearer token.
    const url = `https://api.themoviedb.org/3/movie/${encodeURIComponent(String(tmdbId))}`;
    const { status, ok, payload } = await throttledFetch(url);

    setCached(key, { fetchedAt: nowIso(), status, payload });
    if (!ok) throw new Error(`TMDB request failed (status=${status})`);
    return payload;
  }

  return { getMovieDetails };
}

