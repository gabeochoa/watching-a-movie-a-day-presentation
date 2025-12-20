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

function getTmdbAuthHeaders({ bearerToken } = {}) {
  // Prefer bearer token (TMDB v4 read token). Allow v3 api key too.
  const bearer = bearerToken?.trim() || process.env.TMDB_BEARER_TOKEN?.trim();
  if (bearer) return { Authorization: `Bearer ${bearer}` };
  return null;
}

function getTmdbApiKey({ apiKey } = {}) {
  return apiKey?.trim() || process.env.TMDB_API_KEY?.trim() || null;
}

function getCacheTtlDays() {
  const raw = process.env.TMDB_CACHE_TTL_DAYS?.trim();
  if (!raw) return 0; // default: never expire unless configured
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return 0;
  return n;
}

function isExpired(fetchedAt, ttlDays) {
  if (!ttlDays) return false;
  const ts = Date.parse(fetchedAt);
  if (Number.isNaN(ts)) return true;
  const ageMs = Date.now() - ts;
  return ageMs > ttlDays * 24 * 60 * 60 * 1000;
}

function isInvalidApiKeyPayload(payload) {
  // TMDB commonly returns:
  // { status_code: 7, status_message: "Invalid API key: You must be granted a valid key.", ... }
  return (
    payload &&
    typeof payload === "object" &&
    Number(payload.status_code) === 7
  );
}

export function createTmdbService({ db, fetchImpl = fetch, bearerToken, apiKey } = {}) {
  if (!db) throw new Error("db is required");
  const ttlDays = getCacheTtlDays();

  async function fetchFromTmdb(pathname, query) {
    const base = "https://api.themoviedb.org/3";
    const url = new URL(`${base}${pathname}`);

    const resolvedApiKey = getTmdbApiKey({ apiKey });
    for (const [k, v] of Object.entries(query ?? {})) url.searchParams.set(k, v);
    if (resolvedApiKey) url.searchParams.set("api_key", resolvedApiKey);

    const headers = getTmdbAuthHeaders({ bearerToken }) ?? undefined;
    const res = await fetchImpl(url, { headers });
    const contentType = res.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");
    const payload = isJson ? await res.json() : await res.text();
    return { status: res.status, ok: res.ok, payload };
  }

  async function getCachedOrFetch(pathname, query) {
    const cacheKey = tmdbKeyFor(pathname, query);
    const cached = db.get(cacheKey);
    if (cached && !isExpired(cached.fetchedAt, ttlDays)) {
      return { cacheKey, cacheHit: true, ...cached };
    }

    const { status, payload } = await fetchFromTmdb(pathname, query);
    // If TMDB says the API key/token is invalid, do NOT cache the error payload.
    // This avoids poisoning the shared cache for all users.
    if (isInvalidApiKeyPayload(payload)) {
      return { cacheKey, cacheHit: false, noCache: true, status, fetchedAt: nowIso(), payload };
    }

    db.set(cacheKey, { status, fetchedAt: nowIso(), payload });
    return { cacheKey, cacheHit: false, status, fetchedAt: nowIso(), payload };
  }

  return { getCachedOrFetch };
}

