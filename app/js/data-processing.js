async function processAndDisplayData(films) {
    // Initialize year dropdown if not done yet
    if (!document.getElementById('yearSelect').children.length) {
        initializeYearDropdown(films);
    }

    // Filter for selected year watch history
    const yearFilms = films.filter(film =>
        film.watchedDate &&
        film.watchedDate.getFullYear() === selectedYear
    );

    processedData = {
        allFilms: films,
        yearFilms: yearFilms,
        stats: calculateStats(yearFilms),
        releaseYears: calculateReleaseYearDistribution(yearFilms),
        releaseDecades: calculateReleaseDecadeDistribution(yearFilms),
        ratings: calculateRatingDistribution(yearFilms),
        timeline: calculateTimelineData(yearFilms)
    };

    displayStats(processedData.stats);
    await displayCharts(processedData);

    statsSection.classList.remove('hidden');
    chartsSection.classList.remove('hidden');
}

function calculateStats(films) {
    const ratedFilms = films.filter(f => f.rating);
    const averageRating = ratedFilms.length > 0
        ? (ratedFilms.reduce((sum, f) => sum + f.rating, 0) / ratedFilms.length).toFixed(1)
        : 'N/A';

    return {
        totalFilms: films.length,
        ratedFilms: ratedFilms.length,
        averageRating: averageRating,
        rewatches: films.filter(f => f.rewatch).length
    };
}

function calculateReleaseYearDistribution(films) {
    const yearCounts = {};
    films.forEach(film => {
        const year = film.releaseYear;
        if (year && year >= RELEASE_YEAR_MIN && year <= RELEASE_YEAR_MAX) {
            yearCounts[year] = (yearCounts[year] || 0) + 1;
        }
    });
    return yearCounts;
}

function calculateReleaseDecadeDistribution(films) {
    const decadeCounts = {};
    films.forEach(film => {
        const year = film.releaseYear;
        if (year && year >= RELEASE_YEAR_MIN && year <= RELEASE_YEAR_MAX) {
            const decade = Math.floor(year / 10) * 10;
            const decadeLabel = `${decade}s`;
            decadeCounts[decadeLabel] = (decadeCounts[decadeLabel] || 0) + 1;
        }
    });
    return decadeCounts;
}

function calculateRatingDistribution(films) {
    // Generate rating keys dynamically based on step size (supports half-stars)
    const ratingCounts = {};
    for (let rating = RATING_MIN; rating <= RATING_MAX; rating += RATING_STEP) {
        ratingCounts[rating] = 0;
    }

    films.forEach(film => {
        if (film.rating && film.rating >= RATING_MIN && film.rating <= RATING_MAX) {
            // Validate that rating is a valid increment (whole or half stars)
            const roundedRating = Math.round(film.rating / RATING_STEP) * RATING_STEP;
            if (Math.abs(film.rating - roundedRating) < 0.01) { // Allow small floating point tolerance
                ratingCounts[roundedRating] = (ratingCounts[roundedRating] || 0) + 1;
            }
        }
    });
    return ratingCounts;
}

function calculateTimelineData(films) {
    // Group by month
    const monthlyData = {};
    films.forEach(film => {
        if (film.watchedDate) {
            const monthKey = `${film.watchedDate.getFullYear()}-${String(film.watchedDate.getMonth() + 1).padStart(2, '0')}`;
            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = { month: monthKey, count: 0, films: [] };
            }
            monthlyData[monthKey].count++;
            monthlyData[monthKey].films.push(film);
        }
    });
    return Object.values(monthlyData);
}

function calculateControversyData(films) {
    // TODO: Implement real community rating comparison
    // This would require integrating with external APIs like TMDB, OMDb, or Rotten Tomatoes
    // to fetch actual community/critic ratings and compare them with user's personal ratings

    // For now, return empty array - this feature is not yet implemented
    return [];
}

// TMDB API functions are now in tmdb-api.js


async function calculateDirectorData(films) {
    const directorStats = {};

    // Process films and collect director data
    const directorPromises = films.map(async (film) => {
        if (film.rating) {
            try {
                const directorName = await window.TMDB_API.fetchDirectorFromTMDB(film.title, film.releaseYear);

                if (directorName) {
                    if (!directorStats[directorName]) {
                        directorStats[directorName] = {
                            name: directorName,
                            films: [],
                            totalRating: 0,
                            count: 0
                        };
                    }
                    directorStats[directorName].films.push(film);
                    directorStats[directorName].totalRating += film.rating;
                    directorStats[directorName].count++;
                }
            } catch (error) {
                console.warn(`Failed to get director for "${film.title}":`, error);
            }
        }
    });

    // Wait for all API calls to complete
    await Promise.all(directorPromises);

    // Convert to array and calculate averages
    return Object.values(directorStats)
        .filter(director => director.count >= 1) // At least 1 film
        .map(director => ({
            name: director.name,
            averageRating: Math.round((director.totalRating / director.count) * 10) / 10,
            filmCount: director.count,
            films: director.films
        }))
        .sort((a, b) => b.filmCount - a.filmCount) // Sort by film count
        .slice(0, 10); // Top 10 directors
}


async function calculateGenresData(films) {
    const genreStats = {};

    // Process films and collect genre data
    const genrePromises = films.map(async (film) => {
        try {
            const genres = await window.TMDB_API.fetchGenresFromTMDB(film.title, film.releaseYear);

            genres.forEach(genre => {
                if (!genreStats[genre]) {
                    genreStats[genre] = { count: 0, totalRating: 0, ratedCount: 0 };
                }
                genreStats[genre].count++;
                if (film.rating) {
                    genreStats[genre].totalRating += film.rating;
                    genreStats[genre].ratedCount++;
                }
            });
        } catch (error) {
            console.warn(`Failed to get genres for "${film.title}":`, error);
        }
    });

    // Wait for all API calls to complete
    await Promise.all(genrePromises);

    return Object.entries(genreStats)
        .map(([genre, stats]) => ({
            genre,
            count: stats.count,
            averageRating: stats.ratedCount > 0 ? Math.round((stats.totalRating / stats.ratedCount) * 10) / 10 : null
        }))
        .sort((a, b) => b.count - a.count);
}

function calculateDayOfWeekData(films) {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayStats = dayNames.map(name => ({ day: name, count: 0, totalRating: 0, ratedCount: 0 }));

    films.forEach(film => {
        if (film.watchedDate) {
            const dayIndex = film.watchedDate.getDay();
            dayStats[dayIndex].count++;
            if (film.rating) {
                dayStats[dayIndex].totalRating += film.rating;
                dayStats[dayIndex].ratedCount++;
            }
        }
    });

    return dayStats.map(day => ({
        ...day,
        averageRating: day.ratedCount > 0 ? Math.round((day.totalRating / day.ratedCount) * 10) / 10 : null
    }));
}
