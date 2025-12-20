import { el, on, setText, downloadJson } from "./ui/dom.js";
import { parseLetterboxdZip } from "./letterboxd/parseZip.js";
import { computeFromLetterboxd } from "./analytics/compute.js";
import { renderBarChart, renderHorizontalBarChart, renderLineChart } from "./charts/d3charts.js";
import {
  fetchCacheStats,
  fetchTmdbCredits,
  fetchTmdbMovie,
  findTmdbByImdbId,
  searchTmdbMovie,
} from "./api/tmdb.js";

const state = {
  parsed: null,
  computed: null,
  enriched: null,
  tmdbRequestStats: { hit: 0, miss: 0, unknown: 0 },
};

function setServerPill(ok, text) {
  const dot = el("#serverDot");
  dot.classList.remove("ok", "bad");
  dot.classList.add(ok ? "ok" : "bad");
  setText(el("#serverText"), text);
}

function logLine(msg) {
  const node = el("#log");
  const ts = new Date().toISOString().replace("T", " ").replace("Z", "");
  node.textContent = `${node.textContent}${node.textContent ? "\n" : ""}[${ts}] ${msg}`;
  node.scrollTop = node.scrollHeight;
}

function bumpCacheCounter(cacheHeader) {
  const v = String(cacheHeader || "").toUpperCase();
  if (v === "HIT") state.tmdbRequestStats.hit += 1;
  else if (v === "MISS") state.tmdbRequestStats.miss += 1;
  else state.tmdbRequestStats.unknown += 1;
}

async function checkServer() {
  try {
    const res = await fetch("/api/health");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    setServerPill(true, "Server: OK");
  } catch (e) {
    setServerPill(false, "Server: not reachable");
    logLine(`Server health check failed: ${String(e)}`);
  }
}

async function refreshCacheStatsUi() {
  try {
    const { ok, payload } = await fetchCacheStats();
    if (!ok) return;
    setText(
      el("#cacheStats"),
      [
        `sqlite cache entries: ${payload.entries}`,
        `oldest fetched: ${payload.oldestFetchedAt ?? "n/a"}`,
        `newest fetched: ${payload.newestFetchedAt ?? "n/a"}`,
        `client tmdb calls: HIT=${state.tmdbRequestStats.hit} MISS=${state.tmdbRequestStats.miss} UNKNOWN=${state.tmdbRequestStats.unknown}`,
      ].join("\n"),
    );
  } catch {
    // ignore
  }
}

function render() {
  const statsEl = el("#stats");
  if (!state.computed) {
    setText(statsEl, "No data loaded yet.");
    return;
  }

  const { counts, series } = state.computed;
  setText(
    statsEl,
    [
      `diary rows: ${counts.diaryEntries}`,
      `films rows: ${counts.films}`,
      `parsed watches: ${counts.watches}`,
      `parsed ratings: ${counts.ratings}`,
      `rewatches: ${counts.rewatches}`,
      `avg rating: ${counts.avgRating == null ? "n/a" : counts.avgRating.toFixed(2)}`,
    ].join("\n"),
  );

  renderBarChart(el("#chartRatings"), series.ratingsHistogram, {
    xKey: "rating",
    yKey: "count",
    xLabelFormatter: (v) => v,
  });

  renderBarChart(el("#chartMonths"), series.watchesByMonth, {
    xKey: "yearMonth",
    yKey: "count",
    xLabelFormatter: (v) => v.slice(2), // YY-MM
  });

  renderBarChart(el("#chartYears"), series.releaseYears, {
    xKey: "year",
    yKey: "count",
    xLabelFormatter: (v) => v,
  });

  renderLineChart(el("#chartAvgRating"), series.avgRatingByMonth, {
    xKey: "yearMonth",
    yKey: "avgRating",
  });

  // TMDB-enriched charts (if present)
  if (state.enriched) {
    renderHorizontalBarChart(el("#chartDirectors"), state.enriched.topDirectors, {
      xKey: "count",
      yKey: "name",
      maxBars: 15,
    });
    renderHorizontalBarChart(el("#chartGenres"), state.enriched.topGenres, {
      xKey: "count",
      yKey: "name",
      maxBars: 15,
    });
    renderBarChart(el("#chartRuntime"), state.enriched.runtimeBins, {
      xKey: "bin",
      yKey: "count",
      xLabelFormatter: (v) => v,
    });
  }
}

function resetAll() {
  state.parsed = null;
  state.computed = null;
  state.enriched = null;
  state.tmdbRequestStats = { hit: 0, miss: 0, unknown: 0 };
  setText(el("#log"), "");
  setText(el("#cacheStats"), "");
  render();
}

function normalizeDiaryFilms(parsed) {
  // Create a unique film list from diary entries.
  const films = new Map(); // key -> { title, year, imdbId? }

  // Try to build a lookup from films.csv for IMDb IDs, if present.
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

async function promisePool(items, worker, { concurrency = 3 } = {}) {
  const executing = new Set();
  const results = new Array(items.length);

  async function runOne(i) {
    try {
      results[i] = await worker(items[i], i);
    } finally {
      executing.delete(p);
    }
  }

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

async function enrichWithTmdb() {
  if (!state.parsed || !state.computed) {
    logLine("Analyze a Letterboxd ZIP first.");
    return;
  }

  const films = normalizeDiaryFilms(state.parsed);
  if (!films.length) {
    logLine("No diary films found to enrich.");
    return;
  }

  logLine(`Enriching ${films.length} films with TMDB (cached by server)…`);

  const directorCounts = new Map();
  const genreCounts = new Map();
  const runtimes = [];
  let mapped = 0;
  let failed = 0;

  await promisePool(
    films,
    async (film) => {
      try {
        let tmdbId = null;
        if (film.imdbId) {
          const r = await findTmdbByImdbId(film.imdbId);
          bumpCacheCounter(r.cache);
          const id = r.payload?.movie_results?.[0]?.id ?? null;
          tmdbId = id ? String(id) : null;
        }

        if (!tmdbId) {
          const r = await searchTmdbMovie({ query: film.title, year: film.year ?? undefined });
          bumpCacheCounter(r.cache);
          const id = r.payload?.results?.[0]?.id ?? null;
          tmdbId = id ? String(id) : null;
        }

        if (!tmdbId) {
          failed += 1;
          return null;
        }

        const detailsRes = await fetchTmdbMovie(tmdbId);
        bumpCacheCounter(detailsRes.cache);
        if (!detailsRes.ok) throw new Error(`details status ${detailsRes.status}`);
        const details = detailsRes.payload;

        const creditsRes = await fetchTmdbCredits(tmdbId);
        bumpCacheCounter(creditsRes.cache);
        if (!creditsRes.ok) throw new Error(`credits status ${creditsRes.status}`);
        const credits = creditsRes.payload;

        mapped += 1;

        // Genres
        for (const g of details.genres ?? []) {
          const name = String(g.name ?? "").trim();
          if (!name) continue;
          genreCounts.set(name, (genreCounts.get(name) || 0) + 1);
        }

        // Runtime
        if (details.runtime) runtimes.push(details.runtime);

        // Directors
        const dirs = (credits.crew ?? []).filter((c) => c && c.job === "Director");
        for (const d of dirs) {
          const name = String(d.name ?? "").trim();
          if (!name) continue;
          directorCounts.set(name, (directorCounts.get(name) || 0) + 1);
        }

        return { filmKey: film.key, tmdbId };
      } catch (e) {
        failed += 1;
        logLine(`Enrich failed for "${film.title}" (${film.year ?? "n/a"}): ${String(e)}`);
        return null;
      } finally {
        if ((mapped + failed) % 10 === 0) {
          logLine(`Progress: mapped=${mapped} failed=${failed}`);
          await refreshCacheStatsUi();
        }
      }
    },
    { concurrency: 3 },
  );

  const topDirectors = Array.from(directorCounts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
  const topGenres = Array.from(genreCounts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
  const runtimeBins = computeRuntimeBins(runtimes);

  state.enriched = { topDirectors, topGenres, runtimeBins, mapped, failed };
  logLine(`Enrichment complete: mapped=${mapped} failed=${failed}`);
  await refreshCacheStatsUi();
  render();
}

function initUi() {
  on(el("#analyzeBtn"), "click", async () => {
    const zipFile = el("#lbZip").files?.[0];
    if (!zipFile) {
      logLine("Pick a Letterboxd export .zip first.");
      return;
    }
    try {
      logLine(`Parsing zip: ${zipFile.name}`);
      state.parsed = await parseLetterboxdZip(zipFile);
      logLine(`Found files: ${JSON.stringify(state.parsed.filesFound)}`);
      state.computed = computeFromLetterboxd(state.parsed);
      state.enriched = null;
      render();
      logLine("Rendered charts.");
      await refreshCacheStatsUi();
    } catch (e) {
      logLine(`Analyze failed: ${String(e)}`);
    }
  });

  on(el("#enrichBtn"), "click", enrichWithTmdb);

  on(el("#resetBtn"), "click", resetAll);

  on(el("#exportAnalysisBtn"), "click", () => {
    if (!state.computed) return logLine("Nothing to export (analyze first).");
    downloadJson("wrapboxd-analysis.json", {
      computed: state.computed,
      enriched: state.enriched,
      tmdbRequestStats: state.tmdbRequestStats,
    });
    logLine("Exported analysis JSON.");
  });

  on(el("#exportConfigBtn"), "click", () => {
    downloadJson("wrapboxd-config.json", {
      version: 1,
      note: "Placeholder config export (expand as we add settings).",
    });
    logLine("Exported config JSON.");
  });

  on(el("#exportCacheStatsBtn"), "click", async () => {
    const res = await fetchCacheStats();
    downloadJson("wrapboxd-cache-stats.json", res.payload);
    logLine("Exported cache stats JSON.");
  });

  on(el("#fetchMovieBtn"), "click", async () => {
    const id = String(el("#demoTmdbId").value || "").trim();
    if (!id) return logLine("Enter a TMDB ID first.");
    try {
      const { ok, status, cache, payload } = await fetchTmdbMovie(id);
      bumpCacheCounter(cache);
      await refreshCacheStatsUi();
      if (!ok) {
        logLine(`TMDB error status=${status} cache=${cache} payload=${JSON.stringify(payload)}`);
        return;
      }
      logLine(`TMDB movie status=${status} cache=${cache} title=${payload.title ?? "n/a"}`);
    } catch (e) {
      logLine(`TMDB request failed: ${String(e)}`);
    }
  });
}

async function main() {
  initUi();
  render();
  await checkServer();
  await refreshCacheStatsUi();
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  logLine(`Fatal: ${String(e)}`);
});

