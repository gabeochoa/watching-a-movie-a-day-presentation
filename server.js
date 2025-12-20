const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const chokidar = require('chokidar');

const app = express();
const PORT = process.env.PORT || 3000;

// Set up file watching for development feedback
let watcher;

try {
    watcher = chokidar.watch([
        path.join(__dirname, 'app'),
        path.join(__dirname, 'README.md')
    ], {
        ignored: /(^|[\/\\])\../, // ignore dotfiles
        persistent: true
    });

    watcher.on('change', (filePath) => {
        const relativePath = path.relative(__dirname, filePath);
        console.log(`📝 File changed: ${relativePath} - use Ctrl+R or 🔄 Refresh button`);
    });

    console.log('✅ File watching enabled');
} catch (error) {
    console.log('⚠️  File watching not available');
    watcher = null;
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'app')));

// Serve index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'app', 'index.html'));
});

// Serve the main app
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'app', 'index.html'));
});

// API endpoint to save cache
app.post('/api/cache/save', (req, res) => {
    try {
        const cacheData = req.body;
        const cachePath = path.join(__dirname, 'app', 'data', 'tmdb-cache.json');

        // Ensure data directory exists
        const dataDir = path.join(__dirname, 'app', 'data');
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }

        // Save cache data
        fs.writeFileSync(cachePath, JSON.stringify(cacheData, null, 2));

        console.log('Cache saved to file:', cachePath);
        res.json({ success: true, message: 'Cache saved successfully' });
    } catch (error) {
        console.error('Error saving cache:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// API endpoint to load cache
app.get('/api/cache/load', (req, res) => {
    try {
        const cachePath = path.join(__dirname, 'app', 'data', 'tmdb-cache.json');

        if (fs.existsSync(cachePath)) {
            const cacheData = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
            res.json(cacheData);
        } else {
            // Return empty cache structure
            res.json({
                directors: {},
                genres: {},
                runtimes: {},
                metadata: {
                    version: '1.0',
                    lastUpdated: null,
                    exportFormat: 'wrapboxd-tmdb-cache'
                }
            });
        }
    } catch (error) {
        console.error('Error loading cache:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// API endpoint to get cache stats
app.get('/api/cache/stats', (req, res) => {
    try {
        const cachePath = path.join(__dirname, 'app', 'data', 'tmdb-cache.json');

        if (fs.existsSync(cachePath)) {
            const cacheData = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
            const stats = {
                directors: Object.keys(cacheData.directors || {}).length,
                genres: Object.keys(cacheData.genres || {}).length,
                runtimes: Object.keys(cacheData.runtimes || {}).length,
                lastUpdated: cacheData.metadata?.lastUpdated
            };
            res.json(stats);
        } else {
            res.json({ directors: 0, genres: 0, runtimes: 0, lastUpdated: null });
        }
    } catch (error) {
        console.error('Error getting cache stats:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Wrapboxd server running at http://localhost:${PORT}`);
    console.log(`🔄 Development mode: File changes trigger console notifications`);
    console.log(`📁 Cache files will be saved to: ${path.join(__dirname, 'app', 'data')}`);
    console.log(`💡 Use Ctrl+R or 🔄 Refresh button to reload after changes`);
});
