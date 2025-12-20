import { el, on, setText, downloadJson } from "./ui/dom.js";
import { parseLetterboxdZip } from "./letterboxd/parseZip.js";
import { computeFromLetterboxd } from "./analytics/compute.js";
import {
  renderBarChart,
  renderHorizontalBarChart,
  renderLineChart,
  renderScatterPlot,
} from "./charts/d3charts.js";

async function computeData(diary, films) {
  try {
    const payload = computeFromLetterboxd({ diary, films });
    return { status: 200, ok: true, payload };
  } catch (e) {
    return { status: 500, ok: false, payload: { error: String(e) } };
  }
}

const state = {
  parsed: null,
  computed: null, // current (filtered) computed
  computedAll: null, // full-range computed
  enriched: null,
  enrichmentByFilm: null, // Map(filmKey -> { tmdbId, runtime, releaseYear, genres[], directors[] })
  tmdbRequestStats: { hit: 0, miss: 0, unknown: 0 }, // generation-time only (static mode)
  staticMeta: null, // generation metadata (if present)
  staticCacheStats: null, // generation-time cache stats (if present)
  runToken: 0,
  dateRange: { start: null, end: null }, // YYYY-MM-DD strings
};

function logLine(msg) {
  const node = el("#log");
  const ts = new Date().toISOString().replace("T", " ").replace("Z", "");
  node.textContent = `${node.textContent}${node.textContent ? "\n" : ""}[${ts}] ${msg}`;
  node.scrollTop = node.scrollHeight;
}

function showTab(which) {
  const isPresentation = which === "presentation";
  el("#tabPresentation").hidden = !isPresentation;
  el("#tabData").hidden = isPresentation;

  el("#tabBtnPresentation").setAttribute("aria-selected", isPresentation ? "true" : "false");
  el("#tabBtnData").setAttribute("aria-selected", isPresentation ? "false" : "true");

  // When showing presentation, re-render so D3 can measure actual widths.
  if (isPresentation && state.computed) {
    setTimeout(() => render(), 0);
  }
}

function clearTmdbError() {
  const node = document.querySelector("#tmdbError");
  if (node) setText(node, "");
}

function setTmdbError(msg) {
  const node = document.querySelector("#tmdbError");
  if (node) setText(node, msg);
  logLine(msg);
  showTab("data");
}

function toYmd(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseYmd(ymd) {
  if (!ymd) return null;
  const d = new Date(`${ymd}T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function diaryRowDate(row) {
  const raw = String(row?.Date ?? row?.date ?? "").trim();
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

function getDiaryDateBounds(diaryRows) {
  let min = null;
  let max = null;
  for (const row of diaryRows ?? []) {
    const d = diaryRowDate(row);
    if (!d) continue;
    if (!min || d < min) min = d;
    if (!max || d > max) max = d;
  }
  return { min, max };
}

function filterDiaryByRange(diaryRows, { start, end }) {
  const startD = parseYmd(start);
  const endD = parseYmd(end);
  if (!startD && !endD) return diaryRows ?? [];
  return (diaryRows ?? []).filter((row) => {
    const d = diaryRowDate(row);
    if (!d) return false;
    if (startD && d < startD) return false;
    if (endD && d > endD) return false;
    return true;
  });
}

function getFilmKeysFromDiary(diaryRows) {
  const keys = new Set();
  for (const row of diaryRows ?? []) {
    const title = String(row.Name ?? row.name ?? "").trim();
    const year = String(row.Year ?? row.year ?? "").trim();
    if (!title) continue;
    keys.add(`${title} (${year || "n/a"})`);
  }
  return keys;
}

async function refreshCacheStatsUi() {
  const payload = state.staticCacheStats;
  if (!payload) {
    setText(
      el("#cacheStats"),
      [
        "cache stats: n/a",
        "note: this is a static report; TMDB requests happen during generation only.",
      ].join("\n"),
    );
    return;
  }
  setText(
    el("#cacheStats"),
    [
      `sqlite cache entries: ${payload.entries}`,
      `oldest fetched: ${payload.oldestFetchedAt ?? "n/a"}`,
      `newest fetched: ${payload.newestFetchedAt ?? "n/a"}`,
      `generation tmdb calls: HIT=${state.tmdbRequestStats.hit} MISS=${state.tmdbRequestStats.miss} UNKNOWN=${state.tmdbRequestStats.unknown}`,
    ].join("\n"),
  );
}

function render() {
  const statsEl = el("#stats");
  if (!state.computed) {
    setText(statsEl, "No data loaded yet.");
    return;
  }

  const filteredDiary = filterDiaryByRange(state.parsed?.diary ?? [], state.dateRange);
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

  // This chart does NOT require TMDB. (Release year + rating are in the Letterboxd export.)
  renderScatterPlot(el("#chartRatingReleaseYear"), computeRatingReleaseYearPointsFromDiary(filteredDiary), {
    xKey: "year",
    yKey: "rating",
    xLabel: "release year",
    yLabel: "rating",
  });

  // TMDB-enriched charts (if present)
  if (state.enriched) {
    renderScatterPlot(el("#chartRatingRuntime"), state.enriched.ratingRuntimePoints, {
      xKey: "runtime",
      yKey: "rating",
      xLabel: "runtime (min)",
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
  } else {
    // Clear TMDB-only charts so they don't look "broken" when enrichment wasn't generated.
    renderScatterPlot(el("#chartRatingRuntime"), [], {
      xKey: "runtime",
      yKey: "rating",
      xLabel: "runtime (min)",
      yLabel: "rating",
    });
    renderHorizontalBarChart(el("#chartDirectors"), [], { xKey: "count", yKey: "name", maxBars: 15 });
    renderHorizontalBarChart(el("#chartGenres"), [], { xKey: "count", yKey: "name", maxBars: 15 });
    renderBarChart(el("#chartRuntime"), [], { xKey: "bin", yKey: "count", xLabelFormatter: (v) => v });
  }
}

function resetAll() {
  state.parsed = null;
  state.computed = null;
  state.computedAll = null;
  state.enriched = null;
  state.enrichmentByFilm = null;
  state.tmdbRequestStats = { hit: 0, miss: 0, unknown: 0 };
  state.runToken += 1; // invalidate in-flight work
  setText(el("#log"), "");
  setText(el("#cacheStats"), "");
  clearTmdbError();
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

function computeRatingReleaseYearPointsFromDiary(diaryRows) {
  // One point per film: avg rating vs release year (Letterboxd-only).
  const filmAvgRatings = computeFilmAvgRatingsByKey(diaryRows);
  const releaseYearByKey = new Map();

  for (const row of diaryRows ?? []) {
    const title = String(row.Name ?? row.name ?? "").trim();
    const yearRaw = String(row.Year ?? row.year ?? "").trim();
    if (!title) continue;
    const key = `${title} (${yearRaw || "n/a"})`;
    const y = Number.parseInt(yearRaw, 10);
    if (Number.isFinite(y)) releaseYearByKey.set(key, y);
  }

  const points = [];
  for (const [key, avgRating] of filmAvgRatings.entries()) {
    const year = releaseYearByKey.get(key);
    if (!Number.isFinite(year) || !Number.isFinite(avgRating)) continue;
    points.push({ year, rating: avgRating });
  }
  return points;
}

function toReleaseYearFromTmdb(details) {
  const d = String(details?.release_date ?? "").trim();
  const y = Number.parseInt(d.slice(0, 4), 10);
  return Number.isFinite(y) ? y : null;
}

function computeEnrichedAggregatesForDiary(diaryRows) {
  if (!state.enrichmentByFilm) return null;

  const filmKeys = getFilmKeysFromDiary(diaryRows);
  const filmAvgRatings = computeFilmAvgRatingsByKey(diaryRows);

  const directorCounts = new Map();
  const genreCounts = new Map();
  const runtimes = [];
  const ratingRuntimePoints = [];
  const ratingReleaseYearPoints = [];

  for (const filmKey of filmKeys) {
    const info = state.enrichmentByFilm.get(filmKey);
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

  return { topDirectors, topGenres, runtimeBins, ratingRuntimePoints, ratingReleaseYearPoints };
}

async function recomputeForCurrentRange() {
  if (!state.parsed) return;
  const filteredDiary = filterDiaryByRange(state.parsed.diary, state.dateRange);
  const { ok, payload } = await computeData(filteredDiary, state.parsed.films);
  if (!ok) {
    logLine(`Computation failed: ${JSON.stringify(payload)}`);
    return;
  }
  state.computed = payload;

  // Recompute enriched aggregates for just the visible range (no refetch).
  const agg = computeEnrichedAggregatesForDiary(filteredDiary);
  if (agg) {
    // keep mapped/failed metadata if present
    const meta = state.enriched ? { mapped: state.enriched.mapped, failed: state.enriched.failed } : {};
    state.enriched = { ...agg, ...meta };
  }

  render();
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

async function analyzeZipFile(zipFile, { auto = false } = {}) {
  if (!zipFile) return;
  const myToken = (state.runToken += 1);

  try {
    clearTmdbError();
    if (auto) logLine(`ZIP selected: ${zipFile.name} — analyzing locally…`);
    else logLine(`Parsing zip: ${zipFile.name}`);

    state.parsed = await parseLetterboxdZip(zipFile);
    if (myToken !== state.runToken) return;

    logLine(`Found files: ${JSON.stringify(state.parsed.filesFound)}`);
    // Default range: full diary bounds (if present)
    const bounds = getDiaryDateBounds(state.parsed.diary);
    const start = bounds.min ? toYmd(bounds.min) : null;
    const end = bounds.max ? toYmd(bounds.max) : null;
    state.dateRange = { start, end };

    // Initialize the range picker UI
    const startEl = document.querySelector("#rangeStart");
    const endEl = document.querySelector("#rangeEnd");
    if (startEl) {
      startEl.min = start ?? "";
      startEl.max = end ?? "";
      startEl.value = start ?? "";
    }
    if (endEl) {
      endEl.min = start ?? "";
      endEl.max = end ?? "";
      endEl.value = end ?? "";
    }

    const { ok, payload } = await computeData(state.parsed.diary, state.parsed.films);
    if (!ok) {
      logLine(`Computation failed: ${JSON.stringify(payload)}`);
      return;
    }
    state.computedAll = payload;
    // Current view starts as full range
    state.computed = state.computedAll;
    state.enriched = null;
    state.enrichmentByFilm = null;
    if (myToken !== state.runToken) return;

    render();
    logLine("Rendered charts.");
    await refreshCacheStatsUi();
  } catch (e) {
    if (auto) logLine(`Auto analyze failed: ${String(e)}`);
    else logLine(`Analyze failed: ${String(e)}`);
  }
}

function initUi() {
  // Tabs: robust event handling with delegation
  document.addEventListener("click", (e) => {
    const target = e.target;
    if (target.id === "tabBtnPresentation") {
      e.preventDefault();
      showTab("presentation");
    } else if (target.id === "tabBtnData") {
      e.preventDefault();
      showTab("data");
    }
  });

  // In static mode we do not require uploading a ZIP, but we keep the parser available
  // for convenience if the template is reused elsewhere.
  const lbZip = document.querySelector("#lbZip");
  if (lbZip) {
    on(el("#lbZip"), "change", async () => {
      const zipFile = el("#lbZip").files?.[0];
      await analyzeZipFile(zipFile, { auto: true });
    });
  }

  on(el("#applyRangeBtn"), "click", async () => {
    state.dateRange = {
      start: String(el("#rangeStart").value || "") || null,
      end: String(el("#rangeEnd").value || "") || null,
    };
    await recomputeForCurrentRange();
  });

  on(el("#show2025Btn"), "click", async () => {
    el("#rangeStart").value = "2025-01-01";
    el("#rangeEnd").value = "2025-12-31";
    state.dateRange = { start: "2025-01-01", end: "2025-12-31" };
    await recomputeForCurrentRange();
  });

  on(el("#clearRangeBtn"), "click", async () => {
    const bounds = state.parsed ? getDiaryDateBounds(state.parsed.diary) : { min: null, max: null };
    const start = bounds.min ? toYmd(bounds.min) : "";
    const end = bounds.max ? toYmd(bounds.max) : "";
    el("#rangeStart").value = start;
    el("#rangeEnd").value = end;
    state.dateRange = { start: start || null, end: end || null };
    await recomputeForCurrentRange();
  });


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
    downloadJson("wrapboxd-cache-stats.json", state.staticCacheStats ?? { note: "n/a (static report)" });
    logLine("Exported cache stats JSON.");
  });

  on(el("#exportAllBtn"), "click", async () => {
    try {
      const JSZip = window.JSZip;
      if (!JSZip) throw new Error("JSZip not loaded.");
      const zip = new JSZip();

      const cacheStats = { payload: state.staticCacheStats ?? { note: "n/a (static report)" } };
      const analysis = state.computed
        ? {
            computed: state.computed,
            enriched: state.enriched,
            tmdbRequestStats: state.tmdbRequestStats,
            meta: state.staticMeta,
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
}

function tryLoadStaticPayload() {
  const payload = window.WRAPBOXD_STATIC_DATA;
  if (!payload || typeof payload !== "object") return false;

  try {
    state.staticMeta = payload.meta ?? null;
    state.staticCacheStats = payload.tmdbCacheStats ?? null;
    state.tmdbRequestStats = payload.tmdbRequestStats ?? { hit: 0, miss: 0, unknown: 0 };

    state.parsed = payload.parsed ?? null;
    state.computedAll = payload.computedAll ?? null;
    state.computed = payload.computedAll ?? null;

    const entries = payload.enrichmentByFilm ?? [];
    if (Array.isArray(entries) && entries.length) {
      state.enrichmentByFilm = new Map(entries);
    } else {
      state.enrichmentByFilm = null;
    }
    state.enriched = payload.enrichedAll ?? null;

    if (state.parsed?.diary) {
      const bounds = getDiaryDateBounds(state.parsed.diary);
      const start = bounds.min ? toYmd(bounds.min) : null;
      const end = bounds.max ? toYmd(bounds.max) : null;
      state.dateRange = { start, end };

      const startEl = document.querySelector("#rangeStart");
      const endEl = document.querySelector("#rangeEnd");
      if (startEl) {
        startEl.min = start ?? "";
        startEl.max = end ?? "";
        startEl.value = start ?? "";
      }
      if (endEl) {
        endEl.min = start ?? "";
        endEl.max = end ?? "";
        endEl.value = end ?? "";
      }
    }

    logLine("Loaded embedded static report data.");
    return true;
  } catch (e) {
    logLine(`Failed to load embedded static report data: ${String(e)}`);
    return false;
  }
}

async function main() {
  initUi();
  showTab("data");
  render();
  const loaded = tryLoadStaticPayload();
  render();
  if (loaded) showTab("presentation");
  await refreshCacheStatsUi();

  window.addEventListener("resize", () => {
    if (!el("#tabPresentation").hidden && state.computed) render();
  });
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  logLine(`Fatal: ${String(e)}`);
});

