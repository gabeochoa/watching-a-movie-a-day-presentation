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

### Option 1: Development Mode (Recommended - automatic cache saving + file watching)
1. Install dependencies: `npm install`
2. Start the development server: `npm run dev`
3. Open http://localhost:3000 in your browser
4. **🔄 Use manual refresh when files change (see below)**
5. Upload your Letterboxd ZIP file
6. TMDB cache is automatically saved to `app/data/tmdb-cache.json`

#### Development Features
- **Manual Refresh Options**:
  - 🔄 **Refresh button** in the app interface
  - `Ctrl+R` or `F5`: Standard browser refresh
  - `Ctrl+Shift+R`: Development refresh (with console logging)
  - `window.refresh()`: Console command for refresh
- **File Watching**: Server monitors file changes and logs notifications
- **Cache Persistence**: TMDB data stays cached across refreshes
- **Development Helpers**: Keyboard shortcuts and console commands

### Option 2: Try with Sample Data (Client-side only)
1. Open `app/index.html?example=true` in your browser
2. See the app in action with **2025 movies** instantly
3. Switch between different years using the dropdown
4. Cache is stored in browser localStorage only

### Option 3: Use Your Own Data (Client-side only)
1. Export your data from Letterboxd Settings → Import & Export
2. Download the ZIP file
3. Open `app/index.html` in your browser
4. Upload your ZIP file
5. Explore your personalized movie analytics!
6. Use "📤 Export Cache" to manually save TMDB cache

## TMDB API Integration ✅

This app is fully integrated with TMDB (The Movie Database) API for enhanced movie data:

### 🎯 **Active Features**
- 🎬 **Director Analysis**: Real director data from TMDB
- 🎭 **Genre Analysis**: Accurate genre classifications
- ⏱️ **Runtime Analysis**: Actual movie runtimes

### 💾 **Smart Caching System**
- **Server Mode**: Automatic saving to `app/data/tmdb-cache.json` (git-friendly)
- **Client Mode**: Browser localStorage with manual export/import
- **Performance**: Dramatically faster load times for popular movies
- **API Efficiency**: Reduces TMDB API calls by caching results
- **Offline Resilience**: Cached data available even during API outages
- **Automatic Cleanup**: Old cache entries expire after 30 days
- **Cross-User Sharing**: Cache files can be committed to git

### 📤 **Export Features**
- **📦 Export All**: Complete data package (analysis + config + cache info)
- **📊 Export Data**: Your movie analysis and statistics as JSON
- **⚙️ Export Config**: App settings and chart preferences
- **💾 Cache Info**: TMDB cache statistics and management details
- **💾 Auto-Save**: Enable automatic cache saving to a local folder (File System Access API)
- 📊 **All Charts**: Enhanced with real movie metadata

### 🔑 **API Configuration**
- **API Key**: Configured in `secrets.js` (gitignored for security) ✅
- **Rate Limits**: Respects TMDB's fair usage policy
- **Caching**: Intelligent caching to minimize API calls
- **Error Handling**: Graceful fallbacks for API failures

#### Setup Instructions
1. Copy `app/js/secrets.js.example` to `app/js/secrets.js`
2. Get your TMDB API key from [TMDB Settings](https://www.themoviedb.org/settings/api)
3. Add your API key to `secrets.js`
4. The `secrets.js` file is automatically gitignored

### 📜 **Attribution & Compliance**
- ✅ Proper attribution to TMDB as required by [Terms of Use](https://www.themoviedb.org/api-terms-of-use)
- ✅ Official TMDB logo in app footer
- ✅ "Movie data courtesy of The Movie Database (TMDB)" disclaimer
- ✅ No endorsement claim (as required)

## Development Workflow

### 🚀 **Getting Started**
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:3000 in browser
```

### 🔄 **File Editing & Refresh**
When you edit files during development:

1. **Edit any file** in the `app/` directory
2. **Check server console** - file changes are logged automatically
3. **Refresh browser** using one of these methods:
   - Click 🔄 **Refresh button** in the app interface
   - Press `Ctrl+R` or `F5` (standard refresh)
   - Press `Ctrl+Shift+R` (development refresh with logging)
   - Run `window.refresh()` in browser console

### 📁 **File Watching**
- Server automatically monitors `app/` directory and `README.md`
- File changes trigger console notifications
- No auto-refresh (works in all environments)
- Manual refresh provides instant feedback

### 🔧 **Technical Details**
- **API Version**: TMDB API v3
- **Authentication**: API Key authentication
- **Module**: Dedicated `tmdb-api.js` module for all TMDB interactions
- **Caching**: Multi-layer caching system:
  - **In-Memory**: Fast session-based caching
  - **Auto-Save Mode**: Direct file saving using File System Access API
  - **Server Mode**: Automatic JSON file storage in `app/data/` (requires `npm start`)
  - **Client Mode**: Browser localStorage fallback
  - **TTL**: 30-day cache expiration
  - **Git-Friendly**: Cache files can be version controlled
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
├── index.html              # Main application (single file)
├── README.md              # This file
├── WRAPBOXD_PLAN.md       # Development planning
├── .gitignore             # Git ignore rules
├── app/                   # Application files
│   ├── index.html         # Main HTML file
│   ├── styles.css         # Application styles
│   ├── js/                # JavaScript modules
│   │   ├── config.js      # Main configuration
│   │   ├── secrets.js     # API keys (gitignored)
│   │   ├── secrets.js.example  # API key template
│   │   ├── tmdb-api.js    # TMDB API integration
│   │   └── ...            # Other modules
│   └── data/              # Data files
│       ├── tmdb-cache.json # TMDB cache (git-tracked)
│       └── README.md      # Cache documentation
└── example/               # Sample data for testing
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
