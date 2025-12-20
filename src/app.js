import { el, on, setText, downloadTextFile, safeJsonParse } from "./ui/dom.js";
import {
  createEmptyCache,
  mergeCaches,
  normalizeCacheOrThrow,
  cacheStats,
  cacheGet,
  cacheSet,
  exportDeltaCache,
} from "./tmdb/cache.js";
import { createTmdbClient } from "./tmdb/client.js";

const REPO_CACHE_URL = "./cache/tmdb.v1.json";
const LS_TMDB_KEY = "wrapboxd:tmdbApiKey";
const LS_LOCAL_CACHE = "wrapboxd:localCache.v1";

const state = {
  // Cache sources:
  // - portableCache: imported by the user (cross-user)
  // - repoCache: shipped with the repo
  // - localCache: persisted per-device (optional convenience)
  portableCache: createEmptyCache({ source: "portable" }),
  repoCache: createEmptyCache({ source: "repo" }),
  localCache: createEmptyCache({ source: "local" }),

  // Newly fetched entries during this session (for export delta)
  sessionNewEntries: new Set(),
};

function logLine(msg) {
  const node = el("#log");
  const ts = new Date().toISOString().replace("T", " ").replace("Z", "");
  node.textContent = `${node.textContent}${node.textContent ? "\n" : ""}[${ts}] ${msg}`;
  node.scrollTop = node.scrollHeight;
}

function getMergedCache() {
  // Lookup priority: portable → repo → local
  // Merge strategy: by default, prefer earlier sources (portable highest)
  const merged = createEmptyCache({ source: "merged" });
  const { mergedCache: m1 } = mergeCaches(merged, state.localCache, { mode: "prefer-incoming" });
  const { mergedCache: m2 } = mergeCaches(m1, state.repoCache, { mode: "prefer-incoming" });
  const { mergedCache: m3 } = mergeCaches(m2, state.portableCache, { mode: "prefer-incoming" });
  return m3;
}

function updateRepoCachePill(ok, text) {
  const dot = el("#repoCacheDot");
  const t = el("#repoCacheText");
  dot.classList.remove("ok", "bad");
  dot.classList.add(ok ? "ok" : "bad");
  setText(t, text);
}

function updateStats() {
  const merged = getMergedCache();
  const portable = cacheStats(state.portableCache);
  const repo = cacheStats(state.repoCache);
  const local = cacheStats(state.localCache);
  const mergedStats = cacheStats(merged);

  setText(
    el("#cacheStats"),
    [
      `portable entries: ${portable.entries}`,
      `repo entries:     ${repo.entries}`,
      `local entries:    ${local.entries}`,
      `merged entries:   ${mergedStats.entries}`,
      `session new:      ${state.sessionNewEntries.size}`,
    ].join("\n"),
  );
}

function readLocalCache() {
  const raw = localStorage.getItem(LS_LOCAL_CACHE);
  if (!raw) return;
  const parsed = safeJsonParse(raw);
  if (!parsed) return;
  try {
    state.localCache = normalizeCacheOrThrow(parsed, { source: "local" });
  } catch (e) {
    console.warn("Invalid local cache, ignoring:", e);
  }
}

function persistLocalCache() {
  localStorage.setItem(LS_LOCAL_CACHE, JSON.stringify(state.localCache, null, 2));
}

async function loadRepoCache() {
  try {
    const res = await fetch(REPO_CACHE_URL, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    state.repoCache = normalizeCacheOrThrow(json, { source: "repo" });
    updateRepoCachePill(true, "Repo cache: loaded");
  } catch (e) {
    updateRepoCachePill(false, "Repo cache: not loaded");
    logLine(
      `Repo cache load failed (${String(e)}). If you're using file://, run a static server.`,
    );
  }
}

async function importCacheFromFile(file, mergeMode) {
  const bytes = new Uint8Array(await file.arrayBuffer());

  let parsed;
  if (file.name.toLowerCase().endsWith(".zip")) {
    // Optional support; requires JSZip in window.
    // Expect a single JSON entry or a known path `tmdb.v1.json`.
    const JSZip = window.JSZip;
    if (!JSZip) throw new Error("JSZip not available (try reloading).");
    const zip = await JSZip.loadAsync(bytes);
    const candidates = ["tmdb.v1.json", "cache/tmdb.v1.json"];
    let entryName = candidates.find((n) => zip.file(n));
    if (!entryName) {
      // fallback: first json file
      const all = Object.keys(zip.files).filter((n) => n.toLowerCase().endsWith(".json"));
      entryName = all[0];
    }
    if (!entryName) throw new Error("No JSON file found in zip.");
    const jsonText = await zip.file(entryName).async("string");
    parsed = safeJsonParse(jsonText);
  } else {
    const text = new TextDecoder().decode(bytes);
    parsed = safeJsonParse(text);
  }

  if (!parsed) throw new Error("Unable to parse JSON.");
  const incoming = normalizeCacheOrThrow(parsed, { source: `import:${file.name}` });

  const mode = mergeMode === "prefer-incoming" ? "prefer-incoming" : "prefer-existing";
  const { mergedCache, conflicts } = mergeCaches(state.portableCache, incoming, { mode });
  state.portableCache = mergedCache;

  logLine(
    `Imported ${file.name}. Entries=${cacheStats(incoming).entries}. Conflicts=${conflicts.length}.`,
  );
  updateStats();
}

function initTmdbKeyUi() {
  const input = el("#tmdbKey");
  input.value = localStorage.getItem(LS_TMDB_KEY) ?? "";

  on(el("#saveKeyBtn"), "click", () => {
    localStorage.setItem(LS_TMDB_KEY, input.value.trim());
    logLine("TMDB key saved locally.");
  });
  on(el("#clearKeyBtn"), "click", () => {
    localStorage.removeItem(LS_TMDB_KEY);
    input.value = "";
    logLine("TMDB key cleared.");
  });
}

function initCacheUi() {
  on(el("#importCacheBtn"), "click", async () => {
    const file = el("#cacheFile").files?.[0];
    const mergeMode = el("#mergeMode").value;
    if (!file) {
      logLine("Pick a cache file to import first.");
      return;
    }
    try {
      await importCacheFromFile(file, mergeMode);
    } catch (e) {
      logLine(`Import failed: ${String(e)}`);
    }
  });

  on(el("#exportDeltaBtn"), "click", () => {
    const merged = getMergedCache();
    const delta = exportDeltaCache(merged, state.sessionNewEntries, {
      source: "wrapboxd-export:delta",
    });
    downloadTextFile("wrapboxd-cache.delta.json", JSON.stringify(delta, null, 2));
    logLine(`Exported delta with ${cacheStats(delta).entries} entries.`);
  });

  on(el("#exportFullBtn"), "click", () => {
    const merged = getMergedCache();
    downloadTextFile("wrapboxd-cache.full.json", JSON.stringify(merged, null, 2));
    logLine(`Exported full cache with ${cacheStats(merged).entries} entries.`);
  });

  on(el("#resetSessionBtn"), "click", () => {
    state.portableCache = createEmptyCache({ source: "portable" });
    state.sessionNewEntries.clear();
    logLine("Reset portable + session-new entries (repo/local unchanged).");
    updateStats();
  });
}

function initDemoTmdbFetch() {
  on(el("#fetchMovieBtn"), "click", async () => {
    const tmdbId = String(el("#demoTmdbId").value || "").trim();
    if (!tmdbId) {
      logLine("Enter a TMDB ID first.");
      return;
    }

    const apiKey = (localStorage.getItem(LS_TMDB_KEY) ?? "").trim();
    const client = createTmdbClient({
      apiKey,
      fetchImpl: fetch.bind(window),
      // cache accessors read from merged cache but write to local cache + sessionNewEntries
      getCached: (key) => {
        const merged = getMergedCache();
        return cacheGet(merged, key);
      },
      setCached: (key, entry) => {
        // Write new network results into local cache so it persists per-device,
        // but export is controlled by sessionNewEntries.
        state.localCache = cacheSet(state.localCache, key, entry);
        persistLocalCache();
        state.sessionNewEntries.add(key);
        updateStats();
      },
      log: logLine,
    });

    try {
      const movie = await client.getMovieDetails(tmdbId);
      logLine(`Movie: ${movie.title ?? "(no title)"} (${movie.release_date ?? "n/a"})`);
    } catch (e) {
      logLine(`TMDB fetch failed: ${String(e)}`);
    }
  });
}

async function main() {
  readLocalCache();
  initTmdbKeyUi();
  initCacheUi();
  initDemoTmdbFetch();

  updateStats();
  await loadRepoCache();
  updateStats();
}

main().catch((e) => {
  console.error(e);
  logLine(`Fatal error: ${String(e)}`);
});

