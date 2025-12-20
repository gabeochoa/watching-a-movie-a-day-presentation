export async function fetchTmdbMovie(id) {
  const res = await fetch(`/api/tmdb/movie/${encodeURIComponent(String(id))}`);
  const cache = res.headers.get("X-Wrapboxd-Cache") || "UNKNOWN";
  const payload = await res.json();
  return { status: res.status, ok: res.ok, cache, payload };
}

export async function fetchTmdbCredits(id) {
  const res = await fetch(`/api/tmdb/movie/${encodeURIComponent(String(id))}/credits`);
  const cache = res.headers.get("X-Wrapboxd-Cache") || "UNKNOWN";
  const payload = await res.json();
  return { status: res.status, ok: res.ok, cache, payload };
}

export async function searchTmdbMovie({ query, year }) {
  const url = new URL("/api/tmdb/search/movie", window.location.origin);
  url.searchParams.set("query", query);
  if (year) url.searchParams.set("year", String(year));
  const res = await fetch(url.toString());
  const cache = res.headers.get("X-Wrapboxd-Cache") || "UNKNOWN";
  const payload = await res.json();
  return { status: res.status, ok: res.ok, cache, payload };
}

export async function findTmdbByImdbId(imdbId) {
  const res = await fetch(`/api/tmdb/find/imdb/${encodeURIComponent(String(imdbId))}`);
  const cache = res.headers.get("X-Wrapboxd-Cache") || "UNKNOWN";
  const payload = await res.json();
  return { status: res.status, ok: res.ok, cache, payload };
}

export async function fetchCacheStats() {
  const res = await fetch("/api/cache/stats");
  const payload = await res.json();
  return { status: res.status, ok: res.ok, payload };
}

export async function pingTmdb() {
  const res = await fetch("/api/tmdb/ping");
  const cache = res.headers.get("X-Wrapboxd-Cache") || "UNKNOWN";
  const payload = await res.json();
  return { status: res.status, ok: res.ok, cache, payload };
}

