// DOM elements
const uploadArea = document.getElementById('uploadArea');
// Note: statusMessage, progressBar, progressFill are declared in ui-utils.js

// Drag and drop functionality
uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragover');
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFile(files[0]);
    }
});

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        handleFile(file);
    }
}

function handleFile(file) {
    // Validate file
    if (!file.name.toLowerCase().endsWith('.zip')) {
        showStatus('Please select a ZIP file', 'error');
        return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
        showStatus(`File too large. Maximum size is ${MAX_FILE_SIZE_MB}MB`, 'error');
        return;
    }

    showStatus('Processing ZIP file...', 'info');
    showProgress(true);

    // Process the ZIP file
    processZipFile(file);
}

function processZipFile(file) {
    JSZip.loadAsync(file)
        .then(zip => {
            updateProgress(20);

            // Extract only allowed CSV files for security
            const allowedFiles = ['diary.csv', 'reviews.csv'];
            const csvPromises = [];

            allowedFiles.forEach(filename => {
                if (zip.files[filename]) {
                    csvPromises.push(
                        zip.files[filename].async('text').then(content => ({
                            filename,
                            content
                        }))
                    );
                }
            });

            if (csvPromises.length === 0) {
                throw new Error('No valid CSV files found in ZIP. Expected diary.csv or reviews.csv');
            }

            return Promise.all(csvPromises);
        })
        .then(csvFiles => {
            updateProgress(50);
            showStatus('Parsing CSV data...', 'info');
            return parseCSVFiles(csvFiles);
        })
        .then(async (data) => {
            updateProgress(80);
            filmData = data;
            showStatus('Generating visualizations...', 'info');
            await processAndDisplayData(data);
        })
        .then(() => {
            updateProgress(100);
            showStatus('Analysis complete!', 'success');
            showProgress(false);
        })
        .catch(error => {
            console.error('Error:', error);
            showStatus('Error: ' + error.message, 'error');
            showProgress(false);
        });
}

function parseCSVFiles(csvFiles) {
    return new Promise((resolve, reject) => {
        const allFilms = [];
        let completedFiles = 0;

        csvFiles.forEach(({ filename, content }) => {
            // Handle both direct content and promises from ZIP files
            const contentPromise = typeof content === 'string' ? Promise.resolve(content) : content;

            contentPromise.then(csvContent => {
                Papa.parse(csvContent, {
                    header: true,
                    skipEmptyLines: true,
                    complete: (results) => {
                        if (results.errors.length > 0) {
                            console.warn(`Errors in ${filename}:`, results.errors);
                        }

                        // Process each row
                        results.data.forEach(row => {
                            const film = processFilmRow(row, filename);
                            if (film) {
                                allFilms.push(film);
                            }
                        });

                        completedFiles++;
                        if (completedFiles === csvFiles.length) {
                            // Merge films with same title (diary + reviews)
                            const mergedFilms = mergeDuplicateFilms(allFilms);
                            resolve(mergedFilms);
                        }
                    },
                    error: (error) => {
                        reject(new Error(`CSV parsing error in ${filename}: ${error.message}`));
                    }
                });
            }).catch(error => {
                reject(new Error(`Failed to get content for ${filename}: ${error.message}`));
            });
        });
    });
}

function processFilmRow(row, source) {
    // Basic validation
    if (!row.Name || !row.Year) {
        return null;
    }

    const film = {
        title: row.Name,
        releaseYear: parseInt(row.Year),
        letterboxdUri: row['Letterboxd URI'] || '',
        source: source,
        // Additional fields based on source
        ...(source === 'diary.csv' && {
            diaryDate: parseDate(row.Date),
            rating: row.Rating ? parseInt(row.Rating) : null,
            rewatch: row.Rewatch === 'Yes',
            tags: row.Tags || '',
            watchedDate: row['Watched Date'] ? parseDate(row['Watched Date']) : null
        }),
        ...(source === 'reviews.csv' && {
            review: row.Review || '',
            // reviews.csv also has rating/date info
            diaryDate: parseDate(row.Date),
            rating: row.Rating ? parseInt(row.Rating) : null,
            rewatch: row.Rewatch === 'Yes',
            tags: row.Tags || '',
            watchedDate: row['Watched Date'] ? parseDate(row['Watched Date']) : null
        })
    };

    return film;
}

function parseDate(dateString) {
    if (!dateString) return null;
    return new Date(dateString);
}

function mergeDuplicateFilms(films) {
    const filmMap = new Map();

    films.forEach(film => {
        const key = film.title.toLowerCase().trim();
        if (filmMap.has(key)) {
            // Merge: prefer reviews.csv data over diary.csv
            const existing = filmMap.get(key);
            if (film.source === 'reviews.csv') {
                filmMap.set(key, { ...existing, ...film });
            }
        } else {
            filmMap.set(key, film);
        }
    });

    return Array.from(filmMap.values());
}
