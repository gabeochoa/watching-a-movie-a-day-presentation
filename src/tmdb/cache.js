function nowIso() {
  return new Date().toISOString();
}

/**
 * Cache schema v1:
 * {
 *   cacheSchemaVersion: 1,
 *   source?: string,
 *   generatedAt?: string,
 *   entries: {
 *     [cacheKey]: {
 *       fetchedAt: string,
 *       status: number, // HTTP-like status (200, 404, ...)
 *       payload: any
 *     }
 *   }
 * }
 */

export function createEmptyCache({ source } = {}) {
  return {
    cacheSchemaVersion: 1,
    source,
    generatedAt: nowIso(),
    entries: {},
  };
}

export function normalizeCacheOrThrow(raw, { source } = {}) {
  if (!raw || typeof raw !== "object") throw new Error("Cache must be an object.");
  if (raw.cacheSchemaVersion !== 1) throw new Error("Unsupported cache schema version.");
  if (!raw.entries || typeof raw.entries !== "object") throw new Error("Cache entries missing.");

  // normalize: only keep expected fields, shallow-validate entries
  const entries = {};
  for (const [key, val] of Object.entries(raw.entries)) {
    if (!val || typeof val !== "object") continue;
    const fetchedAt = typeof val.fetchedAt === "string" ? val.fetchedAt : nowIso();
    const status = typeof val.status === "number" ? val.status : 200;
    entries[key] = { fetchedAt, status, payload: val.payload };
  }

  return {
    cacheSchemaVersion: 1,
    source: source ?? raw.source,
    generatedAt: typeof raw.generatedAt === "string" ? raw.generatedAt : nowIso(),
    entries,
  };
}

export function cacheStats(cache) {
  return { entries: Object.keys(cache.entries ?? {}).length };
}

export function cacheGet(cache, key) {
  return cache.entries[key] ?? null;
}

export function cacheSet(cache, key, entry) {
  const next = {
    ...cache,
    generatedAt: nowIso(),
    entries: { ...cache.entries },
  };
  next.entries[key] = entry;
  return next;
}

export function sortCache(cache) {
  const keys = Object.keys(cache.entries).sort();
  const sortedEntries = {};
  for (const k of keys) sortedEntries[k] = cache.entries[k];
  return { ...cache, entries: sortedEntries };
}

/**
 * Merge `incoming` into `base`.
 *
 * mode:
 * - prefer-existing: keep base value if key exists
 * - prefer-incoming: overwrite base with incoming
 */
export function mergeCaches(base, incoming, { mode = "prefer-existing" } = {}) {
  const b = normalizeCacheOrThrow(base);
  const inc = normalizeCacheOrThrow(incoming);

  const merged = createEmptyCache({ source: b.source ?? "merged" });
  merged.entries = { ...b.entries };

  const conflicts = [];
  for (const [key, val] of Object.entries(inc.entries)) {
    if (!merged.entries[key]) {
      merged.entries[key] = val;
      continue;
    }

    const existing = merged.entries[key];
    const same =
      existing.status === val.status &&
      JSON.stringify(existing.payload) === JSON.stringify(val.payload);

    if (!same) conflicts.push({ key });

    if (mode === "prefer-incoming") {
      merged.entries[key] = val;
    }
  }

  return { mergedCache: sortCache(merged), conflicts };
}

export function exportDeltaCache(mergedCache, keysSet, { source } = {}) {
  const merged = normalizeCacheOrThrow(mergedCache);
  const delta = createEmptyCache({ source });
  for (const key of keysSet) {
    if (merged.entries[key]) delta.entries[key] = merged.entries[key];
  }
  return sortCache(delta);
}

