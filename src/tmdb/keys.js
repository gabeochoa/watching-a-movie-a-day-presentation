export function tmdbMovieDetailsKey(tmdbId) {
  return `tmdb:v3:movie:${String(tmdbId)}`;
}

export function tmdbMovieCreditsKey(tmdbId) {
  return `tmdb:v3:movie:${String(tmdbId)}:credits`;
}

