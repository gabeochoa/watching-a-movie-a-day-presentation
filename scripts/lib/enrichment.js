function toReleaseYearFromTmdb(details) {
  const d = String(details?.release_date ?? "").trim();
  const y = Number.parseInt(d.slice(0, 4), 10);
  return Number.isFinite(y) ? y : null;
}

function bumpCacheCounter(tmdbRequestStats, cacheHit, noCache) {
  if (cacheHit) tmdbRequestStats.hit += 1;
  else if (noCache) tmdbRequestStats.unknown += 1;
  else tmdbRequestStats.miss += 1;
}

export function normalizeDiaryFilms(parsed) {
  const films = new Map(); // key -> { key, title, year, imdbId? }
  const imdbByTitleYear = new Map();
  for (const row of parsed.films ?? []) {
    const title = String(row.Name ?? row.name ?? "").trim();
    const year = String(row.Year ?? row.year ?? "").trim();
    const imdbId = String(row["IMDb ID"] ?? row.ImdbID ?? row.imdb_id ?? "").trim();
    if (title && year && imdbId) imdbByTitleYear.set(`${title} (${year})`, imdbId);
  }
  for (const row of parsed.diary ?? []) {
    const title = String(row.Name ?? row.name ?? "").trim();
    const year = String(row.Year ?? row.year ?? "").trim();
    if (!title) continue;
    const key = `${title} (${year || "n/a"})`;
    if (films.has(key)) continue;
    films.set(key, {
      key,
      title,
      year: year ? Number(year) : null,
      imdbId: year ? imdbByTitleYear.get(`${title} (${year})`) ?? null : null,
    });
  }
  return Array.from(films.values());
}

export async function promisePool(items, worker, { concurrency = 3 } = {}) {
  const executing = new Set();
  const results = new Array(items.length);
  for (let i = 0; i < items.length; i += 1) {
    const p = (async () => worker(items[i], i))();
    executing.add(p);
    p.then((r) => {
      results[i] = r;
    }).finally(() => {
      executing.delete(p);
    });
    if (executing.size >= concurrency) {
      // eslint-disable-next-line no-await-in-loop
      await Promise.race(executing);
    }
  }
  await Promise.all(executing);
  return results;
}

export async function enrichFilmsWithTmdb({ films, tmdb, tmdbRequestStats, concurrency }) {
  const perFilm = new Map();
  let mapped = 0;
  let failed = 0;

  await promisePool(
    films,
    async (film) => {
      try {
        let tmdbId = null;

        if (film.imdbId) {
          const r = await tmdb.getCachedOrFetch(`/find/${film.imdbId}`, { external_source: "imdb_id" });
          bumpCacheCounter(tmdbRequestStats, r.cacheHit, r.noCache);
          const id = r.payload?.movie_results?.[0]?.id ?? null;
          tmdbId = id ? String(id) : null;
        }

        if (!tmdbId) {
          const q = { query: film.title };
          if (film.year) q.year = String(film.year);
          const r = await tmdb.getCachedOrFetch(`/search/movie`, q);
          bumpCacheCounter(tmdbRequestStats, r.cacheHit, r.noCache);
          const id = r.payload?.results?.[0]?.id ?? null;
          tmdbId = id ? String(id) : null;
        }

        if (!tmdbId) {
          failed += 1;
          return null;
        }

        const detailsRes = await tmdb.getCachedOrFetch(`/movie/${tmdbId}`, {});
        bumpCacheCounter(tmdbRequestStats, detailsRes.cacheHit, detailsRes.noCache);
        if (detailsRes.status !== 200) throw new Error(`details status ${detailsRes.status}`);
        const details = detailsRes.payload;

        const creditsRes = await tmdb.getCachedOrFetch(`/movie/${tmdbId}/credits`, {});
        bumpCacheCounter(tmdbRequestStats, creditsRes.cacheHit, creditsRes.noCache);
        if (creditsRes.status !== 200) throw new Error(`credits status ${creditsRes.status}`);
        const credits = creditsRes.payload;

        mapped += 1;

        const genres = (details.genres ?? [])
          .map((g) => String(g?.name ?? "").trim())
          .filter(Boolean);

        const dirs = (credits.crew ?? [])
          .filter((c) => c && c.job === "Director")
          .map((d) => String(d?.name ?? "").trim())
          .filter(Boolean);

        const runtime = Number(details.runtime);
        const releaseYear = film.year ?? toReleaseYearFromTmdb(details);
        perFilm.set(film.key, {
          tmdbId,
          runtime: Number.isFinite(runtime) ? runtime : null,
          releaseYear: Number.isFinite(releaseYear) ? releaseYear : null,
          genres,
          directors: dirs,
        });

        return { filmKey: film.key, tmdbId };
      } catch {
        failed += 1;
        return null;
      }
    },
    { concurrency },
  );

  return { perFilm, mapped, failed };
}

function computeFilmAvgRatingsByKey(diaryRows) {
  const sum = new Map();
  const count = new Map();
  for (const row of diaryRows ?? []) {
    const title = String(row.Name ?? row.name ?? "").trim();
    const year = String(row.Year ?? row.year ?? "").trim();
    if (!title) continue;
    const key = `${title} (${year || "n/a"})`;
    const r = Number.parseFloat(String(row.Rating ?? row.rating));
    if (!Number.isFinite(r)) continue;
    sum.set(key, (sum.get(key) || 0) + r);
    count.set(key, (count.get(key) || 0) + 1);
  }
  const out = new Map();
  for (const [k, s] of sum.entries()) {
    const n = count.get(k) || 0;
    if (n) out.set(k, s / n);
  }
  return out;
}

function computeRuntimeBins(runtimes) {
  const bins = [
    { bin: "0-59", min: 0, max: 59, count: 0 },
    { bin: "60-89", min: 60, max: 89, count: 0 },
    { bin: "90-119", min: 90, max: 119, count: 0 },
    { bin: "120-149", min: 120, max: 149, count: 0 },
    { bin: "150-179", min: 150, max: 179, count: 0 },
    { bin: "180+", min: 180, max: Infinity, count: 0 },
  ];
  for (const r of runtimes) {
    const n = Number(r);
    if (!Number.isFinite(n) || n <= 0) continue;
    const b = bins.find((x) => n >= x.min && n <= x.max);
    if (b) b.count += 1;
  }
  return bins;
}

export function computeEnrichedAggregatesForDiary(diaryRows, enrichmentByFilm, { mapped = 0, failed = 0 } = {}) {
  if (!enrichmentByFilm || !(enrichmentByFilm instanceof Map)) return null;

  const filmKeys = new Set();
  for (const row of diaryRows ?? []) {
    const title = String(row.Name ?? row.name ?? "").trim();
    const year = String(row.Year ?? row.year ?? "").trim();
    if (!title) continue;
    filmKeys.add(`${title} (${year || "n/a"})`);
  }

  const filmAvgRatings = computeFilmAvgRatingsByKey(diaryRows);
  const directorCounts = new Map();
  const genreCounts = new Map();
  const runtimes = [];
  const ratingRuntimePoints = [];
  const ratingReleaseYearPoints = [];

  for (const filmKey of filmKeys) {
    const info = enrichmentByFilm.get(filmKey);
    if (!info) continue;

    for (const name of info.genres ?? []) {
      if (!name) continue;
      genreCounts.set(name, (genreCounts.get(name) || 0) + 1);
    }
    for (const name of info.directors ?? []) {
      if (!name) continue;
      directorCounts.set(name, (directorCounts.get(name) || 0) + 1);
    }
    if (info.runtime) runtimes.push(info.runtime);

    const avgRating = filmAvgRatings.get(filmKey) ?? null;
    if (avgRating != null && Number.isFinite(avgRating)) {
      if (Number.isFinite(info.runtime) && info.runtime > 0) {
        ratingRuntimePoints.push({ runtime: info.runtime, rating: avgRating });
      }
      if (Number.isFinite(info.releaseYear)) {
        ratingReleaseYearPoints.push({ year: info.releaseYear, rating: avgRating });
      }
    }
  }

  const topDirectors = Array.from(directorCounts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
  const topGenres = Array.from(genreCounts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
  const runtimeBins = computeRuntimeBins(runtimes);

  return { topDirectors, topGenres, runtimeBins, ratingRuntimePoints, ratingReleaseYearPoints, mapped, failed };
}

