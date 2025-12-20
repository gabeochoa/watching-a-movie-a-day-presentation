// TMDB API Integration Module
// Handles all interactions with The Movie Database API
//
// Features:
// - Persistent JSON-based caching (git-friendly file storage)
// - In-memory caching for fast access within sessions
// - Automatic cache expiration (30 days)
// - Fallback to fresh API calls when cache misses
// - Export/import cache as JSON files for version control
// - Cross-user data sharing (if users share the same cache file)

// TMDB API Configuration
const TMDB_API_KEY = window.TMDB_API_KEY || 'your_tmdb_api_key_here';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// Cache configuration
const CACHE_FILE_NAME = 'tmdb-cache.json';
const CACHE_TTL_DAYS = 30; // Cache entries expire after 30 days

// Persistent cache storage (loaded from/saved to file)
let persistentCache = {
    directors: {},
    genres: {},
    runtimes: {},
    metadata: {
        version: '1.0',
        lastUpdated: null,
        exportFormat: 'wrapboxd-tmdb-cache'
    }
};

// In-memory caches for current session (fast access)
const directorCache = new Map();
const genreCache = new Map();
const runtimeCache = new Map();

// File handle for automatic cache saving (File System Access API)
let cacheFileHandle = null;

// Initialize JSON cache
async function initCache() {
    try {
        // Try to load existing cache from localStorage first (for quick access)
        const savedCache = localStorage.getItem('tmdb_cache_data');
        if (savedCache) {
            persistentCache = JSON.parse(savedCache);
            console.log('TMDB cache loaded from localStorage');
        }

        // Try to load from server if available
        try {
            const response = await fetch('/api/cache/load');
            if (response.ok) {
                persistentCache = await response.json();
                console.log('TMDB cache loaded from server');
            }
        } catch (serverError) {
            // Server not available, use localStorage data
        }

        console.log('TMDB JSON cache initialized');
        return true;
    } catch (error) {
        console.warn('Failed to initialize cache:', error);
        return false;
    }
}

// Request permission to save cache automatically to a file
async function requestCacheFileAccess() {
    try {
        if ('showDirectoryPicker' in window) {
            // Use File System Access API
            const dirHandle = await window.showDirectoryPicker({
                mode: 'readwrite',
                startIn: 'documents'
            });

            // Create or get the cache file
            cacheFileHandle = await dirHandle.getFileHandle('tmdb-cache.json', { create: true });

            console.log('Cache file access granted. Cache will be saved automatically.');
            return true;
        } else {
            console.warn('File System Access API not supported. Cache will be saved to localStorage only.');
            return false;
        }
    } catch (error) {
        if (error.name !== 'AbortError') {
            console.warn('File access denied or failed:', error);
        }
        return false;
    }
}

// Save cache to file (if access granted) and localStorage (fallback)
async function saveCacheToStorage() {
    try {
        persistentCache.metadata.lastUpdated = new Date().toISOString();

        // Try to save to file if access granted
        if (cacheFileHandle) {
            try {
                const writable = await cacheFileHandle.createWritable();
                await writable.write(JSON.stringify(persistentCache, null, 2));
                await writable.close();
                console.log('Cache saved to file');
            } catch (fileError) {
                console.warn('File save failed:', fileError);
                cacheFileHandle = null; // Reset on failure
            }
        }

        // Try to save to server if available
        try {
            const response = await fetch('/api/cache/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(persistentCache)
            });

            if (response.ok) {
                console.log('Cache saved to server');
                return;
            }
        } catch (serverError) {
            // Server not available, continue to localStorage
        }

        // Fallback to localStorage
        localStorage.setItem('tmdb_cache_data', JSON.stringify(persistentCache));
    } catch (error) {
        console.warn('Failed to save cache:', error);
    }
}

// Export cache as downloadable JSON file
function exportCacheAsFile() {
    try {
        persistentCache.metadata.lastUpdated = new Date().toISOString();

        const dataStr = JSON.stringify(persistentCache, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });

        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = CACHE_FILE_NAME;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        console.log('Cache exported as file:', CACHE_FILE_NAME);
        return true;
    } catch (error) {
        console.error('Failed to export cache:', error);
        return false;
    }
}

// Import cache from uploaded file
async function importCacheFromFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const importedCache = JSON.parse(event.target.result);

                // Validate the cache format
                if (!importedCache.metadata || importedCache.metadata.exportFormat !== 'wrapboxd-tmdb-cache') {
                    throw new Error('Invalid cache file format');
                }

                // Merge imported cache with current cache
                persistentCache.directors = { ...persistentCache.directors, ...importedCache.directors };
                persistentCache.genres = { ...persistentCache.genres, ...importedCache.genres };
                persistentCache.runtimes = { ...persistentCache.runtimes, ...importedCache.runtimes };
                persistentCache.metadata = importedCache.metadata;

                // Save to server and localStorage
                saveCacheToStorage();

                // Clear in-memory caches to force reload from persistent cache
                directorCache.clear();
                genreCache.clear();
                runtimeCache.clear();

                console.log('Cache imported successfully');
                resolve(true);
            } catch (error) {
                console.error('Failed to import cache:', error);
                reject(error);
            }
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
    });
}

// Get cached data from JSON cache
async function getCachedData(cacheType, cacheKey) {
    await initCache();

    const cache = persistentCache[cacheType];
    if (!cache || !cache[cacheKey]) {
        return null;
    }

    const entry = cache[cacheKey];
    const now = Date.now();
    const entryAge = now - entry.timestamp;
    const maxAge = CACHE_TTL_DAYS * 24 * 60 * 60 * 1000; // Convert days to milliseconds

    if (entryAge > maxAge) {
        // Cache expired, remove it
        delete cache[cacheKey];
        saveCacheToStorage();
        return null;
    }

    return entry.data;
}

// Set cached data in JSON cache
async function setCachedData(cacheType, cacheKey, data) {
    await initCache();

    if (!persistentCache[cacheType]) {
        persistentCache[cacheType] = {};
    }

    persistentCache[cacheType][cacheKey] = {
        data: data,
        timestamp: Date.now()
    };

    // Auto-save to localStorage
    saveCacheToStorage();
}

// Clear all cached TMDB data (both memory and persistent)
async function clearTMDBCache() {
    // Clear in-memory caches
    directorCache.clear();
    genreCache.clear();
    runtimeCache.clear();

    // Clear persistent cache
    persistentCache.directors = {};
    persistentCache.genres = {};
    persistentCache.runtimes = {};
    persistentCache.metadata.lastUpdated = new Date().toISOString();

    // Clear localStorage
    localStorage.removeItem('tmdb_cache_data');

    console.log('All TMDB caches cleared (memory and persistent)');
}

// Get cache statistics
async function getCacheStats() {
    await initCache();

    let serverStats = null;

    // Try to get stats from server
    try {
        const response = await fetch('/api/cache/stats');
        if (response.ok) {
            serverStats = await response.json();
        }
    } catch (error) {
        console.warn('Could not get server cache stats:', error);
    }

    const stats = {
        persistent: true,
        directors: serverStats ? serverStats.directors : Object.keys(persistentCache.directors || {}).length,
        genres: serverStats ? serverStats.genres : Object.keys(persistentCache.genres || {}).length,
        runtimes: serverStats ? serverStats.runtimes : Object.keys(persistentCache.runtimes || {}).length,
        lastUpdated: serverStats ? serverStats.lastUpdated : persistentCache.metadata?.lastUpdated
    };

    // Add in-memory cache sizes
    stats.directors += directorCache.size;
    stats.genres += genreCache.size;
    stats.runtimes += runtimeCache.size;

    return stats;
}

/**
 * Generic TMDB API request helper
 * @param {string} endpoint - API endpoint (without base URL)
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} API response data
 */
async function tmdbRequest(endpoint, params = {}) {
    const url = new URL(`${TMDB_BASE_URL}${endpoint}`);
    url.searchParams.set('api_key', TMDB_API_KEY);

    // Add any additional parameters
    Object.entries(params).forEach(([key, value]) => {
        url.searchParams.set(key, value);
    });

    const response = await fetch(url.toString());

    if (!response.ok) {
        throw new Error(`TMDB API error: ${response.status} - ${response.statusText}`);
    }

    return await response.json();
}

/**
 * Search for a movie by title and year
 * @param {string} title - Movie title
 * @param {number} year - Release year
 * @returns {Promise<Object|null>} Movie data or null if not found
 */
async function searchMovie(title, year) {
    try {
        const data = await tmdbRequest('/search/movie', {
            query: title,
            year: year,
            include_adult: false
        });

        return data.results && data.results.length > 0 ? data.results[0] : null;
    } catch (error) {
        console.warn(`Failed to search for movie "${title}":`, error);
        return null;
    }
}

/**
 * Get detailed movie information including credits and runtime
 * @param {number} movieId - TMDB movie ID
 * @returns {Promise<Object|null>} Detailed movie data
 */
async function getMovieDetails(movieId) {
    try {
        const data = await tmdbRequest(`/movie/${movieId}`);
        return data;
    } catch (error) {
        console.warn(`Failed to get movie details for ID ${movieId}:`, error);
        return null;
    }
}

/**
 * Get movie credits (cast and crew)
 * @param {number} movieId - TMDB movie ID
 * @returns {Promise<Object|null>} Credits data
 */
async function getMovieCredits(movieId) {
    try {
        const data = await tmdbRequest(`/movie/${movieId}/credits`);
        return data;
    } catch (error) {
        console.warn(`Failed to get credits for movie ID ${movieId}:`, error);
        return null;
    }
}

/**
 * Fetch director data from TMDB API with persistent caching
 * @param {string} movieTitle - Movie title
 * @param {number} releaseYear - Release year
 * @returns {Promise<string|null>} Director name or null
 */
async function fetchDirectorFromTMDB(movieTitle, releaseYear) {
    const cacheKey = `${movieTitle}_${releaseYear}`;

    // Check in-memory cache first (fastest)
    if (directorCache.has(cacheKey)) {
        return directorCache.get(cacheKey);
    }

    // Check persistent cache
    const persistentData = await getCachedData('directors', cacheKey);
    if (persistentData !== null) {
        // Store in memory cache for faster future access
        directorCache.set(cacheKey, persistentData);
        return persistentData;
    }

    // No cache hit, make API call
    try {
        const movie = await searchMovie(movieTitle, releaseYear);
        if (!movie) {
            directorCache.set(cacheKey, null);
            await setCachedData('directors', cacheKey, null);
            return null;
        }

        const credits = await getMovieCredits(movie.id);
        if (!credits || !credits.crew) {
            directorCache.set(cacheKey, null);
            await setCachedData('directors', cacheKey, null);
            return null;
        }

        // Find the director (job: "Director")
        const director = credits.crew.find(person => person.job === 'Director');
        const directorName = director ? director.name : null;

        // Cache the result
        directorCache.set(cacheKey, directorName);
        await setCachedData('directors', cacheKey, directorName);

        return directorName;

    } catch (error) {
        console.warn(`Failed to fetch director for "${movieTitle} (${releaseYear})":`, error);
        directorCache.set(cacheKey, null);
        await setCachedData('directors', cacheKey, null);
        return null;
    }
}

/**
 * Fetch genre data from TMDB API with persistent caching
 * @param {string} movieTitle - Movie title
 * @param {number} releaseYear - Release year
 * @returns {Promise<string[]>} Array of genre names
 */
async function fetchGenresFromTMDB(movieTitle, releaseYear) {
    const cacheKey = `${movieTitle}_${releaseYear}`;

    // Check in-memory cache first (fastest)
    if (genreCache.has(cacheKey)) {
        return genreCache.get(cacheKey);
    }

    // Check persistent cache
    const persistentData = await getCachedData('genres', cacheKey);
    if (persistentData !== null) {
        // Store in memory cache for faster future access
        genreCache.set(cacheKey, persistentData);
        return persistentData;
    }

    // No cache hit, make API call
    try {
        const movie = await searchMovie(movieTitle, releaseYear);
        if (!movie) {
            genreCache.set(cacheKey, []);
            await setCachedData('genres', cacheKey, []);
            return [];
        }

        const movieDetails = await getMovieDetails(movie.id);
        if (!movieDetails || !movieDetails.genres) {
            genreCache.set(cacheKey, []);
            await setCachedData('genres', cacheKey, []);
            return [];
        }

        // Extract genre names from genre objects
        const genres = movieDetails.genres.map(genre => genre.name);
        genreCache.set(cacheKey, genres);
        await setCachedData('genres', cacheKey, genres);
        return genres;

    } catch (error) {
        console.warn(`Failed to fetch genres for "${movieTitle} (${releaseYear})":`, error);
        genreCache.set(cacheKey, []);
        await setCachedData('genres', cacheKey, []);
        return [];
    }
}

/**
 * Fetch runtime data from TMDB API with persistent caching
 * @param {string} movieTitle - Movie title
 * @param {number} releaseYear - Release year
 * @returns {Promise<number|null>} Runtime in minutes or null
 */
async function fetchRuntimeFromTMDB(movieTitle, releaseYear) {
    const cacheKey = `${movieTitle}_${releaseYear}`;

    // Check in-memory cache first (fastest)
    if (runtimeCache.has(cacheKey)) {
        return runtimeCache.get(cacheKey);
    }

    // Check persistent cache
    const persistentData = await getCachedData('runtimes', cacheKey);
    if (persistentData !== null) {
        // Store in memory cache for faster future access
        runtimeCache.set(cacheKey, persistentData);
        return persistentData;
    }

    // No cache hit, make API call
    try {
        const movie = await searchMovie(movieTitle, releaseYear);
        if (!movie) {
            runtimeCache.set(cacheKey, null);
            await setCachedData('runtimes', cacheKey, null);
            return null;
        }

        const movieDetails = await getMovieDetails(movie.id);
        const runtime = movieDetails ? movieDetails.runtime : null;

        runtimeCache.set(cacheKey, runtime);
        await setCachedData('runtimes', cacheKey, runtime);
        return runtime;

    } catch (error) {
        console.warn(`Failed to fetch runtime for "${movieTitle} (${releaseYear})":`, error);
        runtimeCache.set(cacheKey, null);
        await setCachedData('runtimes', cacheKey, null);
        return null;
    }
}

/**
 * Check if TMDB API is configured and available
 * @returns {boolean} True if API key is configured
 */
function isTMDBConfigured() {
    return TMDB_API_KEY && TMDB_API_KEY !== 'your_tmdb_api_key_here';
}

/**
 * Clear all TMDB caches (useful for testing or memory management)
 */
function clearTMDBCaches() {
    directorCache.clear();
    genreCache.clear();
    runtimeCache.clear();
    console.log('TMDB caches cleared');
}

// Export functions for use in other modules
window.TMDB_API = {
    fetchDirectorFromTMDB,
    fetchGenresFromTMDB,
    fetchRuntimeFromTMDB,
    isTMDBConfigured,
    clearTMDBCaches, // Legacy name, kept for compatibility
    clearTMDBCache,   // New comprehensive clear function
    getCacheStats,
    exportCacheAsFile,
    importCacheFromFile,
    requestCacheFileAccess, // Enable automatic file saving
    // Internal functions exposed for testing/advanced usage
    searchMovie,
    getMovieDetails,
    getMovieCredits,
    // Cache management (advanced usage)
    initCache,
    getCachedData,
    setCachedData
};

// Debug utility: Check cache stats in browser console
// Usage: TMDB_API.logCacheStats()
window.TMDB_API.logCacheStats = async () => {
    const stats = await window.TMDB_API.getCacheStats();
    console.log('TMDB Cache Statistics:', stats);
    console.log('Cache TTL:', CACHE_TTL_DAYS, 'days');
    console.log('Available cache management functions:');
    console.log('- TMDB_API.clearTMDBCache() - Clear all caches');
    console.log('- TMDB_API.getCacheStats() - Get detailed stats');
    console.log('- TMDB_API.exportCacheAsFile() - Download cache as JSON file');
    console.log('- TMDB_API.importCacheFromFile(file) - Import cache from JSON file');
    console.log('Cache file format: tmdb-cache.json (git-friendly)');
    return stats;
};
