function toInt(x) {
  const n = Number.parseInt(String(x), 10);
  return Number.isFinite(n) ? n : null;
}

function toFloat(x) {
  const n = Number.parseFloat(String(x));
  return Number.isFinite(n) ? n : null;
}

function parseDate(dateStr) {
  if (!dateStr) return null;
  // Letterboxd diary "Date" is usually YYYY-MM-DD.
  const d = new Date(dateStr);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function computeFromLetterboxd({ diary, films }) {
  // Minimal normalized model for charts:
  // - watches: [{ date, yearMonth }]
  // - ratings: numeric values
  // - releaseYears: numeric values

  const watches = [];
  const ratings = [];

  for (const row of diary ?? []) {
    const d = parseDate(row.Date || row.date);
    if (!d) continue;
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    watches.push({ date: d, yearMonth: ym });

    const r = toFloat(row.Rating ?? row.rating);
    if (r != null) ratings.push(r);
  }

  const releaseYears = [];
  for (const row of films ?? []) {
    const y = toInt(row.Year ?? row.year);
    if (y != null) releaseYears.push(y);
  }

  // Aggregate series
  const watchesByMonth = new Map();
  for (const w of watches) watchesByMonth.set(w.yearMonth, (watchesByMonth.get(w.yearMonth) || 0) + 1);

  const ratingsBins = new Map();
  for (const r of ratings) {
    const key = String(r);
    ratingsBins.set(key, (ratingsBins.get(key) || 0) + 1);
  }

  const yearsBins = new Map();
  for (const y of releaseYears) yearsBins.set(y, (yearsBins.get(y) || 0) + 1);

  return {
    counts: {
      diaryEntries: (diary ?? []).length,
      films: (films ?? []).length,
      watches: watches.length,
      ratings: ratings.length,
    },
    series: {
      watchesByMonth: Array.from(watchesByMonth.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([yearMonth, count]) => ({ yearMonth, count })),
      ratingsHistogram: Array.from(ratingsBins.entries())
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([rating, count]) => ({ rating: Number(rating), count })),
      releaseYears: Array.from(yearsBins.entries())
        .sort(([a], [b]) => a - b)
        .map(([year, count]) => ({ year, count })),
    },
  };
}

