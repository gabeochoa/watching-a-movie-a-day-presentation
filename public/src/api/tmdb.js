export async function fetchTmdbMovie(id) {
  const res = await fetch(`/api/tmdb/movie/${encodeURIComponent(String(id))}`);
  const cache = res.headers.get("X-Wrapboxd-Cache") || "UNKNOWN";
  const payload = await res.json();
  return { status: res.status, ok: res.ok, cache, payload };
}

