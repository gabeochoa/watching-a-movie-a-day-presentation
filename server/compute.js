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

function truthyFlag(x) {
  const s = String(x ?? "").trim().toLowerCase();
  return s === "yes" || s === "true" || s === "1" || s === "rewatch";
}

export function computeFromLetterboxd({ diary, films }) {
  // Minimal normalized model for charts:
  // - watches: [{ date, yearMonth }]
  // - ratings: numeric values
  // - releaseYears: numeric values

  const watches = [];
  const ratings = [];
  let rewatches = 0;
  let ratingSum = 0;
  const uniqueFilmKeys = new Set();

  for (const row of diary ?? []) {
    const d = parseDate(row.Date || row.date);
    if (!d) continue;
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    watches.push({ date: d, yearMonth: ym });

    const r = toFloat(row.Rating || row.rating);
    if (r != null) {
      ratings.push(r);
      ratingSum += r;
    }

    const isRewatch = truthyFlag(row.Rewatch || row.rewatch);
    if (isRewatch) rewatches += 1;

    const title = String(row.Name || row.name || "").trim();
    const year = String(row.Year || row.year || "").trim();
    if (title) uniqueFilmKeys.add(`${title} (${year || "n/a"})`);
  }

  // Release year distribution should reflect *watched* films in the selected date range.
  // Prefer diary-derived years (from watched entries). Fall back to films.csv only if diary is missing.
  const releaseYears = [];
  if ((diary ?? []).length) {
    for (const row of diary ?? []) {
      const y = toInt(row.Year || row.year);
      if (y != null) releaseYears.push(y);
    }
  } else {
    for (const row of films ?? []) {
      const y = toInt(row.Year || row.year);
      if (y != null) releaseYears.push(y);
    }
  }

  // Aggregate series
  const watchesByMonth = new Map();
  for (const w of watches) watchesByMonth.set(w.yearMonth, (watchesByMonth.get(w.yearMonth) || 0) + 1);

  const watchesByYear = new Map();
  for (const w of watches) {
    const y = w.date.getFullYear();
    watchesByYear.set(y, (watchesByYear.get(y) || 0) + 1);
  }

  const rewatchesByMonth = new Map();
  for (const row of diary ?? []) {
    const d = parseDate(row.Date || row.date);
    if (!d) continue;
    const isRewatch = truthyFlag(row.Rewatch || row.rewatch);
    if (!isRewatch) continue;
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    rewatchesByMonth.set(ym, (rewatchesByMonth.get(ym) || 0) + 1);
  }

  const watchesByWeekday = new Map();
  for (const w of watches) {
    const dow = w.date.getDay(); // 0=Sun
    watchesByWeekday.set(dow, (watchesByWeekday.get(dow) || 0) + 1);
  }

  const ratingSumByMonth = new Map();
  const ratingCountByMonth = new Map();
  for (const row of diary ?? []) {
    const d = parseDate(row.Date || row.date);
    if (!d) continue;
    const r = toFloat(row.Rating || row.rating);
    if (r == null) continue;
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    ratingSumByMonth.set(ym, (ratingSumByMonth.get(ym) || 0) + r);
    ratingCountByMonth.set(ym, (ratingCountByMonth.get(ym) || 0) + 1);
  }

  const ratingSumByReleaseYear = new Map();
  const ratingCountByReleaseYear = new Map();
  for (const row of diary ?? []) {
    const y = toInt(row.Year || row.year);
    if (y == null) continue;
    const r = toFloat(row.Rating || row.rating);
    if (r == null) continue;
    ratingSumByReleaseYear.set(y, (ratingSumByReleaseYear.get(y) || 0) + r);
    ratingCountByReleaseYear.set(y, (ratingCountByReleaseYear.get(y) || 0) + 1);
  }

  const ratingsBins = new Map();
  for (const r of ratings) {
    const key = String(r);
    ratingsBins.set(key, (ratingsBins.get(key) || 0) + 1);
  }

  const yearsBins = new Map();
  for (const y of releaseYears) yearsBins.set(y, (yearsBins.get(y) || 0) + 1);

  const watchesByMonthSeries = Array.from(watchesByMonth.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([yearMonth, count]) => ({ yearMonth, count }));

  let cumulative = 0;
  const cumulativeWatches = watchesByMonthSeries.map((p) => {
    cumulative += p.count;
    return { yearMonth: p.yearMonth, cumulative };
  });

  const topMonths = [...watchesByMonthSeries]
    .sort((a, b) => b.count - a.count)
    .slice(0, 12)
    .map((d) => ({ label: d.yearMonth, count: d.count }));

  const topYears = Array.from(watchesByYear.entries())
    .map(([year, count]) => ({ label: String(year), count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    counts: {
      diaryEntries: (diary ?? []).length,
      films: (films ?? []).length,
      watches: watches.length,
      ratings: ratings.length,
      rewatches,
      uniqueFilms: uniqueFilmKeys.size,
      avgRating: ratings.length ? ratingSum / ratings.length : null,
    },
    series: {
      watchesByMonth: watchesByMonthSeries,
      cumulativeWatches,
      rewatchesByMonth: Array.from(rewatchesByMonth.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([yearMonth, count]) => ({ yearMonth, count })),
      watchesByWeekday: [0, 1, 2, 3, 4, 5, 6].map((dow) => ({
        weekday: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][dow],
        count: watchesByWeekday.get(dow) || 0,
      })),
      topMonths,
      topYears,
      avgRatingByMonth: Array.from(ratingSumByMonth.entries())
        .map(([yearMonth, sum]) => {
          const n = ratingCountByMonth.get(yearMonth) || 0;
          return { yearMonth, avgRating: n ? sum / n : 0 };
        })
        .sort((a, b) => a.yearMonth.localeCompare(b.yearMonth)),
      avgRatingByReleaseYear: Array.from(ratingSumByReleaseYear.entries())
        .map(([year, sum]) => {
          const n = ratingCountByReleaseYear.get(year) || 0;
          return { year, avgRating: n ? sum / n : 0 };
        })
        .sort((a, b) => a.year - b.year),
      ratingsHistogram: Array.from(ratingsBins.entries())
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([rating, count]) => ({ rating: Number(rating), count })),
      releaseYears: Array.from(yearsBins.entries())
        .sort(([a], [b]) => a - b)
        .map(([year, count]) => ({ year, count })),
    },
  };
}