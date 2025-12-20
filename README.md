# Wrapboxd - Letterboxd Analytics

A simple, client-side web application to analyze your Letterboxd movie watching patterns.

## Features

- 📊 **Movie Statistics**: Total films, average ratings, rewatches
- 📅 **Release Year Analysis**: Distribution of film release years
- ⭐ **Rating Analysis**: Your rating patterns (0.5-5 stars, including half-stars)
- 📈 **Timeline View**: Monthly watching patterns
- 🎨 **Beautiful Charts**: Interactive D3.js visualizations
- 🌙 **Dark Mode**: Modern dark theme by default
- 📱 **Responsive**: Works on desktop and mobile

## Quick Start

### Option 1: Try with Sample Data (Recommended)
1. Open `index.html?example=true` in your browser
2. See the app in action with **2025 movies** instantly
3. Switch between different years using the dropdown
4. No download or setup required!

### Option 2: Use Your Own Data
1. Export your data from Letterboxd Settings → Import & Export
2. Download the ZIP file
3. Open `index.html` in your browser
4. Upload your ZIP file
5. Explore your personalized movie analytics!

## TMDB API Integration ✅

This app is fully integrated with TMDB (The Movie Database) API for enhanced movie data:

### 🎯 **Active Features**
- 🎬 **Director Analysis**: Real director data from TMDB
- 🎭 **Genre Analysis**: Accurate genre classifications
- ⏱️ **Runtime Analysis**: Actual movie runtimes

### 💾 **Smart Caching System**
- **Cross-User Sharing**: TMDB data cached locally and shared between users
- **Performance**: Dramatically faster load times for popular movies
- **API Efficiency**: Reduces TMDB API calls by caching results
- **Offline Resilience**: Cached data available even during API outages
- **Automatic Cleanup**: Old cache entries expire after 30 days

### 📤 **Export Features**
- **📦 Export All**: Complete data package (analysis + config + cache info)
- **📊 Export Data**: Your movie analysis and statistics as JSON
- **⚙️ Export Config**: App settings and chart preferences
- **💾 Cache Info**: TMDB cache statistics and management details
- 📊 **All Charts**: Enhanced with real movie metadata

### 🔑 **API Configuration**
- **API Key**: Configured and active ✅
- **Rate Limits**: Respects TMDB's fair usage policy
- **Caching**: Intelligent caching to minimize API calls
- **Error Handling**: Graceful fallbacks for API failures

### 📜 **Attribution & Compliance**
- ✅ Proper attribution to TMDB as required by [Terms of Use](https://www.themoviedb.org/api-terms-of-use)
- ✅ Official TMDB logo in app footer
- ✅ "Movie data courtesy of The Movie Database (TMDB)" disclaimer
- ✅ No endorsement claim (as required)

### 🔧 **Technical Details**
- **API Version**: TMDB API v3
- **Authentication**: API Key authentication
- **Module**: Dedicated `tmdb-api.js` module for all TMDB interactions
- **Caching**: Multi-layer caching system:
  - **In-Memory**: Fast session-based caching
  - **Persistent**: IndexedDB storage shared across users/sessions
  - **TTL**: 30-day cache expiration
  - **Cross-User**: Data shared between users who watch the same movies
- **Async/Await**: Proper async handling throughout the application
- **Error Recovery**: Continues working even if some API calls fail
- **Rate Limiting**: Respects TMDB's fair usage policy

## How It Works

- **100% Client-Side**: No data leaves your computer
- **Secure**: ZIP bomb protection and content whitelisting
- **Fast**: Processes large datasets in seconds
- **Private**: All analysis happens locally in your browser

## Project Structure

```
wrapboxd/
├── index.html          # Main application (single file)
├── README.md          # This file
├── WRAPBOXD_PLAN.md   # Development planning
└── example/           # Sample data for testing
    ├── letterboxd-*.zip
    └── *.csv files
```

## Technical Details

- **Libraries**: D3.js, PapaParse, JSZip
- **Data Source**: Letterboxd CSV export (diary.csv, reviews.csv)
- **Charts**: Interactive SVG visualizations
- **Storage**: Browser local storage (optional)
- **Security**: Client-side ZIP validation and safe extraction

## Privacy & Security

- ✅ No backend servers
- ✅ No data transmission
- ✅ Files processed locally only
- ✅ ZIP extraction with safety checks
- ✅ No external API calls required

---

Built with vanilla JavaScript for simplicity and privacy. 🎬📊
# watching-a-movie-a-day-presentation
