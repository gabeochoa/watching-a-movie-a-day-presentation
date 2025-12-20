import { el, on, setText } from "./ui/dom.js";
import { parseLetterboxdZip } from "./letterboxd/parseZip.js";
import { computeFromLetterboxd } from "./analytics/compute.js";
import { renderBarChart } from "./charts/d3charts.js";
import { fetchTmdbMovie } from "./api/tmdb.js";

const state = {
  parsed: null,
  computed: null,
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
}

function resetAll() {
  state.parsed = null;
  state.computed = null;
  setText(el("#log"), "");
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
      render();
      logLine("Rendered charts.");
    } catch (e) {
      logLine(`Analyze failed: ${String(e)}`);
    }
  });

  on(el("#resetBtn"), "click", resetAll);

  on(el("#fetchMovieBtn"), "click", async () => {
    const id = String(el("#demoTmdbId").value || "").trim();
    if (!id) return logLine("Enter a TMDB ID first.");
    try {
      const { ok, status, cache, payload } = await fetchTmdbMovie(id);
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
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  logLine(`Fatal: ${String(e)}`);
});

