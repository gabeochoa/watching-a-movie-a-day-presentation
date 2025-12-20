import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { openDb } from "./db.js";
import { createTmdbService } from "./tmdb.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "..", "data");
const PUBLIC_DIR = path.join(__dirname, "..", "public");

async function loadLocalSecrets() {
  try {
    const mod = await import(path.join(__dirname, "..", "app", "secrets.js"));
    return mod?.default ?? {};
  } catch {
    return {};
  }
}

const db = openDb({ dataDir: DATA_DIR });
const secrets = await loadLocalSecrets();
const tmdb = createTmdbService({
  db,
  bearerToken: secrets.TMDB_BEARER_TOKEN,
  apiKey: secrets.TMDB_API_KEY,
});

const app = express();
app.disable("x-powered-by");

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/cache/stats", (_req, res) => {
  res.json(db.stats());
});

// Minimal TMDB proxy endpoints (cached in SQLite).
// We keep these narrow to avoid accidentally becoming a generic open proxy.
app.get("/api/tmdb/movie/:id", async (req, res) => {
  try {
    const id = String(req.params.id);
    const { cacheHit, noCache, status, payload } = await tmdb.getCachedOrFetch(`/movie/${id}`, {});
    res.setHeader("X-Wrapboxd-Cache", cacheHit ? "HIT" : noCache ? "BYPASS" : "MISS");
    res.status(status).json(payload);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.get("/api/tmdb/movie/:id/credits", async (req, res) => {
  try {
    const id = String(req.params.id);
    const { cacheHit, noCache, status, payload } = await tmdb.getCachedOrFetch(`/movie/${id}/credits`, {});
    res.setHeader("X-Wrapboxd-Cache", cacheHit ? "HIT" : noCache ? "BYPASS" : "MISS");
    res.status(status).json(payload);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// Search by title (for mapping Letterboxd -> TMDB).
app.get("/api/tmdb/search/movie", async (req, res) => {
  try {
    const query = String(req.query.query || "").trim();
    const year = String(req.query.year || "").trim();
    if (!query) return res.status(400).json({ error: "Missing query" });

    const q = { query };
    if (year) q.year = year;
    const { cacheHit, noCache, status, payload } = await tmdb.getCachedOrFetch(`/search/movie`, q);
    res.setHeader("X-Wrapboxd-Cache", cacheHit ? "HIT" : noCache ? "BYPASS" : "MISS");
    res.status(status).json(payload);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// Lookup by IMDb id (if present in export); uses TMDB /find endpoint.
app.get("/api/tmdb/find/imdb/:imdbId", async (req, res) => {
  try {
    const imdbId = String(req.params.imdbId || "").trim();
    if (!imdbId) return res.status(400).json({ error: "Missing imdb id" });
    const { cacheHit, noCache, status, payload } = await tmdb.getCachedOrFetch(`/find/${imdbId}`, {
      external_source: "imdb_id",
    });
    res.setHeader("X-Wrapboxd-Cache", cacheHit ? "HIT" : noCache ? "BYPASS" : "MISS");
    res.status(status).json(payload);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// Static client
app.use(express.static(PUBLIC_DIR, { etag: true, immutable: false, maxAge: "1h" }));

// SPA-ish fallback: serve index.html for unknown non-API routes
app.get("*", (req, res) => {
  if (req.path.startsWith("/api/")) return res.status(404).json({ error: "Not found" });
  res.sendFile(path.join(PUBLIC_DIR, "index.html"));
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Wrapboxd server running on http://localhost:${PORT}`);
});

