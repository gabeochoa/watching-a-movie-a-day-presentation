// Check for example query parameter
function checkExampleParameter() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('example') === 'true') {
        showStatus('Loading example data...', 'info');
        loadExampleData();
        return true;
    }
    return false;
}

// Load example data automatically
async function loadExampleData() {
    try {
        // Show example notice
        document.getElementById('exampleNotice').classList.remove('hidden');

        showStatus('Loading sample data...', 'info');

        // Process embedded sample CSV data
        const csvFiles = [
            { filename: 'diary.csv', content: sampleData.diary },
            { filename: 'reviews.csv', content: sampleData.reviews }
        ];

        // Parse CSV data directly
        const parsedData = await parseCSVFiles(csvFiles);

        // Process and display the data
        filmData = parsedData;
        await processAndDisplayData(parsedData);

        // Show chart selection interface
        showChartSelection();

    } catch (error) {
        console.error('Error loading example data:', error);
        document.getElementById('exampleNotice').classList.add('hidden');
        showStatus('Failed to load example data. Please upload your own ZIP file.', 'error');
    }
}

// Handle window resize to update chart sizes
window.addEventListener('resize', () => {
    if (processedData) {
        // Re-render charts with new dimensions
        createReleaseYearChart(processedData.releaseYears);
        createReleaseDecadeChart(processedData.releaseDecades);
        createRatingChart(processedData.ratings);
        createTimelineChart(processedData.timeline);
    }
});

// Keyboard shortcuts for development
document.addEventListener('keydown', (event) => {
    // Ctrl/Cmd + R or F5 for refresh
    if ((event.ctrlKey || event.metaKey) && event.key === 'r') {
        event.preventDefault();
        window.location.reload();
    }
    // F5 for refresh
    if (event.key === 'F5') {
        event.preventDefault();
        window.location.reload();
    }
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Check if we should load example data
    const loadingExample = checkExampleParameter();

    if (!loadingExample) {
        showStatus('Ready to analyze your Letterboxd data! (Dev mode: Ctrl+R to refresh)', 'info');
    }
});
