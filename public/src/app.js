import { el, on, setText, downloadJson } from "./ui/dom.js";
import { parseLetterboxdZip } from "./letterboxd/parseZip.js";
import { computeFromLetterboxd } from "./analytics/compute.js";
import {
  renderBarChart,
  renderHorizontalBarChart,
  renderLineChart,
  renderScatterPlot,
} from "./charts/d3charts.js";
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
  runToken: 0,
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
      `unique films: ${counts.uniqueFilms}`,
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

  renderLineChart(el("#chartCumulative"), series.cumulativeWatches, {
    xKey: "yearMonth",
    yKey: "cumulative",
  });

  renderBarChart(el("#chartRewatches"), series.rewatchesByMonth, {
    xKey: "yearMonth",
    yKey: "count",
    xLabelFormatter: (v) => v.slice(2),
  });

  renderBarChart(el("#chartWeekdays"), series.watchesByWeekday, {
    xKey: "weekday",
    yKey: "count",
    xLabelFormatter: (v) => v,
  });

  renderLineChart(el("#chartRatingByYear"), series.avgRatingByReleaseYear, {
    xKey: "year",
    yKey: "avgRating",
  });

  renderHorizontalBarChart(el("#chartTopMonths"), series.topMonths, {
    xKey: "count",
    yKey: "label",
    maxBars: 12,
  });

  renderHorizontalBarChart(el("#chartTopYears"), series.topYears, {
    xKey: "count",
    yKey: "label",
    maxBars: 10,
  });

  // TMDB-enriched charts (if present)
  if (state.enriched) {
    renderScatterPlot(el("#chartRatingRuntime"), state.enriched.ratingRuntimePoints, {
      xKey: "runtime",
      yKey: "rating",
      xLabel: "runtime (min)",
      yLabel: "rating",
    });
    renderScatterPlot(el("#chartRatingReleaseYear"), state.enriched.ratingReleaseYearPoints, {
      xKey: "year",
      yKey: "rating",
      xLabel: "release year",
      yLabel: "rating",
    });

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
  state.runToken += 1; // invalidate in-flight work
  setText(el("#log"), "");
  setText(el("#cacheStats"), "");
  const inp = document.querySelector("#lbZip");
  if (inp) inp.value = "";
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

function toReleaseYearFromTmdb(details) {
  const d = String(details?.release_date ?? "").trim();
  const y = Number.parseInt(d.slice(0, 4), 10);
  return Number.isFinite(y) ? y : null;
}

async function promisePool(items, worker, { concurrency = 3 } = {}) {
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

  const filmAvgRatings = computeFilmAvgRatingsByKey(state.parsed.diary);
  const directorCounts = new Map();
  const genreCounts = new Map();
  const runtimes = [];
  const ratingRuntimePoints = [];
  const ratingReleaseYearPoints = [];
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

        // Scatter points (use average rating per filmKey if present)
        const avgRating = filmAvgRatings.get(film.key) ?? null;
        if (avgRating != null && Number.isFinite(avgRating)) {
          const runtime = Number(details.runtime);
          if (Number.isFinite(runtime) && runtime > 0) {
            ratingRuntimePoints.push({ runtime, rating: avgRating });
          }
          const year = film.year ?? toReleaseYearFromTmdb(details);
          if (Number.isFinite(year)) {
            ratingReleaseYearPoints.push({ year, rating: avgRating });
          }
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

  state.enriched = {
    topDirectors,
    topGenres,
    runtimeBins,
    ratingRuntimePoints,
    ratingReleaseYearPoints,
    mapped,
    failed,
  };
  logLine(`Enrichment complete: mapped=${mapped} failed=${failed}`);
  await refreshCacheStatsUi();
  render();
}

async function analyzeZipFile(zipFile, { auto = false } = {}) {
  if (!zipFile) return;
  const myToken = (state.runToken += 1);

  try {
    if (auto) logLine(`ZIP selected: ${zipFile.name} — auto analyzing…`);
    else logLine(`Parsing zip: ${zipFile.name}`);

    state.parsed = await parseLetterboxdZip(zipFile);
    if (myToken !== state.runToken) return;

    logLine(`Found files: ${JSON.stringify(state.parsed.filesFound)}`);
    state.computed = computeFromLetterboxd(state.parsed);
    state.enriched = null;
    if (myToken !== state.runToken) return;

    render();
    logLine("Rendered charts.");
    await refreshCacheStatsUi();

    // Auto-enrich immediately after analysis. If TMDB isn't configured on the server,
    // we keep the app usable and just log the failure.
    logLine("Auto enriching with TMDB…");
    await enrichWithTmdb();
  } catch (e) {
    if (auto) logLine(`Auto analyze failed: ${String(e)}`);
    else logLine(`Analyze failed: ${String(e)}`);
  }
}

function initUi() {
  on(el("#lbZip"), "change", async () => {
    const zipFile = el("#lbZip").files?.[0];
    await analyzeZipFile(zipFile, { auto: true });
  });

  on(el("#analyzeBtn"), "click", async () => {
    const zipFile = el("#lbZip").files?.[0];
    if (!zipFile) {
      logLine("Pick a Letterboxd export .zip first.");
      return;
    }
    await analyzeZipFile(zipFile, { auto: false });
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

  on(el("#exportAllBtn"), "click", async () => {
    try {
      const JSZip = window.JSZip;
      if (!JSZip) throw new Error("JSZip not loaded.");
      const zip = new JSZip();

      const cacheStats = await fetchCacheStats();
      const analysis = state.computed
        ? {
            computed: state.computed,
            enriched: state.enriched,
            tmdbRequestStats: state.tmdbRequestStats,
          }
        : { error: "No analysis yet (run Analyze first)." };
      const config = { version: 1 };

      zip.file("analysis.json", JSON.stringify(analysis, null, 2));
      zip.file("config.json", JSON.stringify(config, null, 2));
      zip.file("cache-stats.json", JSON.stringify(cacheStats.payload, null, 2));

      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "wrapboxd-export.zip";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      logLine("Exported wrapboxd-export.zip.");
    } catch (e) {
      logLine(`Export all failed: ${String(e)}`);
    }
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

