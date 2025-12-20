function nowIso() {
  return new Date().toISOString();
}

function tmdbKeyFor(pathname, query) {
  // Keep keys stable and explicit. We only allow a small set of endpoints.
  // Example: tmdb:v3:/movie/550
  const qs = new URLSearchParams(query);
  qs.sort();
  const q = qs.toString();
  return `tmdb:v3:${pathname}${q ? `?${q}` : ""}`;
}

function getTmdbAuthHeaders() {
  // Prefer bearer token (TMDB v4 read token). Allow v3 api key too.
  const bearer = process.env.TMDB_BEARER_TOKEN?.trim();
  if (bearer) return { Authorization: `Bearer ${bearer}` };
  return null;
}

function getTmdbApiKey() {
  return process.env.TMDB_API_KEY?.trim() || null;
}

export function createTmdbService({ db, fetchImpl = fetch } = {}) {
  if (!db) throw new Error("db is required");

  async function fetchFromTmdb(pathname, query) {
    const base = "https://api.themoviedb.org/3";
    const url = new URL(`${base}${pathname}`);

    const apiKey = getTmdbApiKey();
    for (const [k, v] of Object.entries(query ?? {})) url.searchParams.set(k, v);
    if (apiKey) url.searchParams.set("api_key", apiKey);

    const headers = getTmdbAuthHeaders() ?? undefined;
    const res = await fetchImpl(url, { headers });
    const contentType = res.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");
    const payload = isJson ? await res.json() : await res.text();
    return { status: res.status, ok: res.ok, payload };
  }

  async function getCachedOrFetch(pathname, query) {
    const cacheKey = tmdbKeyFor(pathname, query);
    const cached = db.get(cacheKey);
    if (cached) {
      return { cacheKey, cacheHit: true, ...cached };
    }

    const { status, payload } = await fetchFromTmdb(pathname, query);
    db.set(cacheKey, { status, fetchedAt: nowIso(), payload });
    return { cacheKey, cacheHit: false, status, fetchedAt: nowIso(), payload };
  }

  return { getCachedOrFetch };
}

