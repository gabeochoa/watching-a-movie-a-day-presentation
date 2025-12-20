import Database from "better-sqlite3";
import path from "node:path";

export function openDb({ dataDir } = {}) {
  const dbPath = path.join(dataDir ?? "data", "cache.sqlite");
  const db = new Database(dbPath);

  db.pragma("journal_mode = WAL");
  db.pragma("synchronous = NORMAL");

  db.exec(`
    CREATE TABLE IF NOT EXISTS tmdb_cache (
      cache_key TEXT PRIMARY KEY,
      status INTEGER NOT NULL,
      fetched_at TEXT NOT NULL,
      payload_json TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS tmdb_cache_fetched_at_idx ON tmdb_cache(fetched_at);
  `);

  const getStmt = db.prepare(
    "SELECT cache_key, status, fetched_at, payload_json FROM tmdb_cache WHERE cache_key = ?",
  );
  const setStmt = db.prepare(
    `
      INSERT INTO tmdb_cache (cache_key, status, fetched_at, payload_json)
      VALUES (@cache_key, @status, @fetched_at, @payload_json)
      ON CONFLICT(cache_key) DO UPDATE SET
        status=excluded.status,
        fetched_at=excluded.fetched_at,
        payload_json=excluded.payload_json
    `,
  );

  const countStmt = db.prepare("SELECT COUNT(1) AS n FROM tmdb_cache");
  const newestStmt = db.prepare("SELECT MAX(fetched_at) AS newest FROM tmdb_cache");
  const oldestStmt = db.prepare("SELECT MIN(fetched_at) AS oldest FROM tmdb_cache");

  return {
    db,
    get(cacheKey) {
      const row = getStmt.get(cacheKey);
      if (!row) return null;
      return {
        cacheKey: row.cache_key,
        status: row.status,
        fetchedAt: row.fetched_at,
        payload: JSON.parse(row.payload_json),
      };
    },
    set(cacheKey, { status, fetchedAt, payload }) {
      setStmt.run({
        cache_key: cacheKey,
        status,
        fetched_at: fetchedAt,
        payload_json: JSON.stringify(payload),
      });
    },
    stats() {
      return {
        entries: countStmt.get().n,
        oldestFetchedAt: oldestStmt.get().oldest ?? null,
        newestFetchedAt: newestStmt.get().newest ?? null,
      };
    },
  };
}

