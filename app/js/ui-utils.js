// DOM elements (safely accessed)
const statsSection = document.getElementById('statsSection');
const chartsSection = document.getElementById('chartsSection');
const statusMessage = document.getElementById('statusMessage');
const progressBar = document.getElementById('progressBar');
const progressFill = document.getElementById('progressFill');

// Safety check for DOM elements
if (!statusMessage || !progressBar || !progressFill) {
    console.warn('Some DOM elements not found. UI functions may not work properly.');
}

function displayStats(stats) {
    const statsGrid = document.getElementById('statsGrid');
    statsGrid.innerHTML = `
        <div class="stat-card">
            <div class="stat-number">${stats.totalFilms}</div>
            <div>Films Watched</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${stats.ratedFilms}</div>
            <div>Films Rated</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${stats.averageRating}</div>
            <div>Average Rating</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${stats.rewatches}</div>
            <div>Rewatches</div>
        </div>
    `;
}

function showChartSelection() {
    const container = document.getElementById('chartSelectionGrid');
    container.innerHTML = '';

    // Group charts by category
    const categories = {};
    availableCharts.forEach(chart => {
        if (!categories[chart.category]) {
            categories[chart.category] = [];
        }
        categories[chart.category].push(chart);
    });

    // Create chart options
    Object.keys(categories).forEach(category => {
        categories[category].forEach(chart => {
            const chartOption = document.createElement('div');
            chartOption.className = `chart-option ${selectedCharts.has(chart.id) ? 'selected' : ''}`;

            chartOption.innerHTML = `
                <div class="chart-category">${category}</div>
                <label>
                    <input type="checkbox"
                           ${selectedCharts.has(chart.id) ? 'checked' : ''}
                           onchange="toggleChart('${chart.id}', this.checked)">
                    ${chart.title}
                </label>
                <div class="chart-description">${chart.description}</div>
            `;

            container.appendChild(chartOption);
        });
    });

    document.getElementById('chartSelectionSection').classList.remove('hidden');
}

function toggleChart(chartId, checked) {
    const chartOption = event.target.closest('.chart-option');

    if (checked) {
        selectedCharts.add(chartId);
        chartOption.classList.add('selected');
    } else {
        selectedCharts.delete(chartId);
        chartOption.classList.remove('selected');
    }
}

function selectAllCharts() {
    selectedCharts = new Set(availableCharts.map(chart => chart.id));
    showChartSelection();
}

function clearAllCharts() {
    selectedCharts.clear();
    showChartSelection();
}

async function generateSelectedCharts() {
    if (selectedCharts.size === 0) {
        showStatus('Please select at least one chart to generate', 'error');
        return;
    }

    if (!processedData) {
        showStatus('No data available. Please upload a file first.', 'error');
        return;
    }

    showStatus('Generating selected charts...', 'info');
    await displayCharts(processedData);
    document.getElementById('chartsSection').classList.remove('hidden');
    showStatus('Charts generated successfully!', 'success');
}

function showStatus(message, type) {
    statusMessage.textContent = message;
    statusMessage.className = 'status ' + type;
    statusMessage.style.display = 'block';
}

function showProgress(show) {
    progressBar.classList.toggle('hidden', !show);
    if (!show) {
        progressFill.style.width = '0%';
    }
}

function updateProgress(percent) {
    progressFill.style.width = percent + '%';
}

function initializeYearDropdown(films) {
    const yearSelect = document.getElementById('yearSelect');
    const years = new Set();

    // Find all available years from watched dates
    films.forEach(film => {
        if (film.watchedDate) {
            years.add(film.watchedDate.getFullYear());
        }
    });

    // Convert to sorted array (newest first)
    const sortedYears = Array.from(years).sort((a, b) => b - a);

    // Clear existing options
    yearSelect.innerHTML = '';

    // Add options
    sortedYears.forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        if (year === selectedYear) {
            option.selected = true;
        }
        yearSelect.appendChild(option);
    });

    // Update display
    document.getElementById('selectedYear').textContent = selectedYear;
}

// Export functions
function exportAnalysisData() {
    if (!processedData) {
        showStatus('No data to export. Please upload and analyze your data first.', 'error');
        return;
    }

    try {
        const exportData = {
            metadata: {
                exportDate: new Date().toISOString(),
                selectedYear: selectedYear,
                totalFilms: processedData.allFilms?.length || 0,
                yearFilms: processedData.yearFilms?.length || 0
            },
            stats: processedData.stats,
            charts: {
                releaseYears: processedData.releaseYears,
                releaseDecades: processedData.releaseDecades,
                ratings: processedData.ratings,
                timeline: processedData.timeline
            },
            films: processedData.allFilms?.map(film => ({
                title: film.title,
                releaseYear: film.releaseYear,
                rating: film.rating,
                watchedDate: film.watchedDate,
                rewatch: film.rewatch,
                tags: film.tags,
                letterboxdUri: film.letterboxdUri
            })) || []
        };

        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `wrapboxd-analysis-${selectedYear}-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        showStatus('Analysis data exported successfully!', 'success');

    } catch (error) {
        console.error('Export failed:', error);
        showStatus('Failed to export analysis data.', 'error');
    }
}

async function exportTMDBCache() {
    try {
        if (!window.TMDB_API?.exportCacheAsFile) {
            showStatus('TMDB cache export not available.', 'error');
            return;
        }

        const success = window.TMDB_API.exportCacheAsFile();
        if (success) {
            showStatus('TMDB cache exported successfully! Check your downloads folder for tmdb-cache.json', 'success');
        } else {
            showStatus('Failed to export TMDB cache.', 'error');
        }
    } catch (error) {
        console.error('Export failed:', error);
        showStatus('Failed to export TMDB cache.', 'error');
    }
}

async function importTMDBCache() {
    try {
        // Create file input element
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.style.display = 'none';

        input.onchange = async (event) => {
            const file = event.target.files[0];
            if (!file) return;

            if (!file.name.endsWith('.json')) {
                showStatus('Please select a JSON file.', 'error');
                return;
            }

            try {
                showStatus('Importing TMDB cache...', 'info');
                await window.TMDB_API.importCacheFromFile(file);
                showStatus('TMDB cache imported successfully!', 'success');
            } catch (error) {
                console.error('Import failed:', error);
                showStatus('Failed to import TMDB cache: ' + error.message, 'error');
            }
        };

        document.body.appendChild(input);
        input.click();
        document.body.removeChild(input);
    } catch (error) {
        console.error('Import failed:', error);
        showStatus('Failed to import TMDB cache.', 'error');
    }
}

async function enableAutoSave() {
    try {
        if (!window.TMDB_API?.requestCacheFileAccess) {
            showStatus('Auto-save feature not available.', 'error');
            return;
        }

        const success = await window.TMDB_API.requestCacheFileAccess();
        if (success) {
            showStatus('Auto-save enabled! Cache will be saved automatically to selected folder.', 'success');
        } else {
            showStatus('Auto-save cancelled or not supported in this browser.', 'info');
        }
    } catch (error) {
        console.error('Auto-save setup failed:', error);
        showStatus('Failed to enable auto-save.', 'error');
    }
}

function exportAllData() {
    if (!processedData) {
        showStatus('No data to export. Please upload and analyze your data first.', 'error');
        return;
    }

    try {
        const exportData = {
            metadata: {
                exportDate: new Date().toISOString(),
                version: '1.0',
                description: 'Complete Wrapboxd data export including analysis, config, and cache info'
            },
            analysis: {
                selectedYear: selectedYear,
                totalFilms: processedData.allFilms?.length || 0,
                yearFilms: processedData.yearFilms?.length || 0,
                stats: processedData.stats,
                charts: {
                    releaseYears: processedData.releaseYears,
                    releaseDecades: processedData.releaseDecades,
                    ratings: processedData.ratings,
                    timeline: processedData.timeline
                }
            },
            films: processedData.allFilms?.map(film => ({
                title: film.title,
                releaseYear: film.releaseYear,
                rating: film.rating,
                watchedDate: film.watchedDate,
                rewatch: film.rewatch,
                tags: film.tags,
                letterboxdUri: film.letterboxdUri
            })) || [],
            configuration: {
                selectedYear: selectedYear,
                selectedCharts: Array.from(selectedCharts),
                tmdbConfigured: window.TMDB_API?.isTMDBConfigured() || false,
                availableCharts: availableCharts
            }
        };

        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `wrapboxd-complete-export-${selectedYear}-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        showStatus('Complete data export successful!', 'success');

    } catch (error) {
        console.error('Complete export failed:', error);
        showStatus('Failed to export complete data.', 'error');
    }
}

function exportConfiguration() {
    try {
        const configData = {
            metadata: {
                exportDate: new Date().toISOString(),
                description: 'Wrapboxd application configuration'
            },
            configuration: {
                selectedYear: selectedYear,
                selectedCharts: Array.from(selectedCharts),
                tmdbConfigured: window.TMDB_API?.isTMDBConfigured() || false,
                availableCharts: availableCharts.map(chart => ({
                    id: chart.id,
                    title: chart.title,
                    category: chart.category,
                    enabled: chart.enabled
                }))
            }
        };

        const dataStr = JSON.stringify(configData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `wrapboxd-config-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        showStatus('Configuration exported successfully!', 'success');

    } catch (error) {
        console.error('Configuration export failed:', error);
        showStatus('Failed to export configuration.', 'error');
    }
}

async function changeYear(year) {
    selectedYear = parseInt(year);
    document.getElementById('selectedYear').textContent = selectedYear;

    if (processedData && processedData.allFilms) {
        await processAndDisplayData(processedData.allFilms);
    }
}
