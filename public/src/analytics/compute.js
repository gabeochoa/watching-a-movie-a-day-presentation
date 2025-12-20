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

  for (const row of diary ?? []) {
    const d = parseDate(row.Date || row.date);
    if (!d) continue;
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    watches.push({ date: d, yearMonth: ym });

    const r = toFloat(row.Rating ?? row.rating);
    if (r != null) {
      ratings.push(r);
      ratingSum += r;
    }

    const isRewatch = truthyFlag(row.Rewatch ?? row.rewatch);
    if (isRewatch) rewatches += 1;
  }

  const releaseYears = [];
  for (const row of films ?? []) {
    const y = toInt(row.Year ?? row.year);
    if (y != null) releaseYears.push(y);
  }

  // Aggregate series
  const watchesByMonth = new Map();
  for (const w of watches) watchesByMonth.set(w.yearMonth, (watchesByMonth.get(w.yearMonth) || 0) + 1);

  const ratingSumByMonth = new Map();
  const ratingCountByMonth = new Map();
  for (const row of diary ?? []) {
    const d = parseDate(row.Date || row.date);
    if (!d) continue;
    const r = toFloat(row.Rating ?? row.rating);
    if (r == null) continue;
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    ratingSumByMonth.set(ym, (ratingSumByMonth.get(ym) || 0) + r);
    ratingCountByMonth.set(ym, (ratingCountByMonth.get(ym) || 0) + 1);
  }

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
      rewatches,
      avgRating: ratings.length ? ratingSum / ratings.length : null,
    },
    series: {
      watchesByMonth: Array.from(watchesByMonth.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([yearMonth, count]) => ({ yearMonth, count })),
      avgRatingByMonth: Array.from(ratingSumByMonth.entries())
        .map(([yearMonth, sum]) => {
          const n = ratingCountByMonth.get(yearMonth) || 0;
          return { yearMonth, avgRating: n ? sum / n : 0 };
        })
        .sort((a, b) => a.yearMonth.localeCompare(b.yearMonth)),
      ratingsHistogram: Array.from(ratingsBins.entries())
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([rating, count]) => ({ rating: Number(rating), count })),
      releaseYears: Array.from(yearsBins.entries())
        .sort(([a], [b]) => a - b)
        .map(([year, count]) => ({ year, count })),
    },
  };
}

