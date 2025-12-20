# TMDB Cache Data

This directory contains git-friendly cache files for TMDB API data.

## Files

- `tmdb-cache.json` - TMDB API cache data (directors, genres, runtimes)

## Cache System

The TMDB cache stores API responses to reduce API calls and improve performance:

- **Directors**: Movie director names by title/year
- **Genres**: Movie genre lists by title/year
- **Runtimes**: Movie durations by title/year

### Cache Features

- 30-day expiration (TTL)
- JSON format for easy version control
- Export/import functionality in the UI
- Automatic localStorage persistence during sessions

### Usage

1. **Export Cache**: Use the "📤 Export Cache" button in the app to download `tmdb-cache.json`
2. **Import Cache**: Use the "📥 Import Cache" button to load a previously exported cache file
3. **Version Control**: Commit the `tmdb-cache.json` file to git to share cache data with team members

### File Format

```json
{
  "directors": {
    "Movie Title_2023": {
      "data": "Director Name",
      "timestamp": 1234567890123
    }
  },
  "genres": {
    "Movie Title_2023": {
      "data": ["Action", "Drama"],
      "timestamp": 1234567890123
    }
  },
  "runtimes": {
    "Movie Title_2023": {
      "data": 120,
      "timestamp": 1234567890123
    }
  },
  "metadata": {
    "version": "1.0",
    "lastUpdated": "2024-01-01T00:00:00.000Z",
    "exportFormat": "wrapboxd-tmdb-cache"
  }
}
```
