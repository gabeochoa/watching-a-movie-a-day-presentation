async function displayCharts(data) {
    console.log('Displaying charts with data:', data);

    // Clear existing charts
    document.getElementById('chartsSection').innerHTML = '<h2>Your Movie Analytics</h2>';

    // Generate selected charts
    const chartsContainer = document.getElementById('chartsSection');

    if (selectedCharts.has('releaseYear')) {
        const container = document.createElement('div');
        container.className = 'chart-container';
        container.innerHTML = '<div class="chart-title">📅 Release Year Distribution</div><div id="releaseYearChart"></div>';
        chartsContainer.appendChild(container);
        createReleaseYearChart(data.releaseYears);
    }

    if (selectedCharts.has('releaseDecade')) {
        const container = document.createElement('div');
        container.className = 'chart-container';
        container.innerHTML = '<div class="chart-title">📅 Release Decade Distribution</div><div id="releaseDecadeChart"></div>';
        chartsContainer.appendChild(container);
        createReleaseDecadeChart(data.releaseDecades);
    }

    if (selectedCharts.has('rating')) {
        const container = document.createElement('div');
        container.className = 'chart-container';
        container.innerHTML = '<div class="chart-title">⭐ Rating Distribution</div><div id="ratingChart"></div>';
        chartsContainer.appendChild(container);
        createRatingChart(data.ratings);
    }

    if (selectedCharts.has('timeline')) {
        const container = document.createElement('div');
        container.className = 'chart-container';
        container.innerHTML = '<div class="chart-title">📊 Watch Timeline</div><div id="timelineChart"></div>';
        chartsContainer.appendChild(container);
        createTimelineChart(data.timeline);
    }

    // Generate controversy chart
    if (selectedCharts.has('controversy')) {
        const container = document.createElement('div');
        container.className = 'chart-container';
        container.innerHTML = '<div class="chart-title">🤝 Controversy Analysis</div><div id="controversyChart"></div>';
        chartsContainer.appendChild(container);
        createControversyChart(calculateControversyData(data.yearFilms));
    }

    // Generate director chart
    if (selectedCharts.has('director')) {
        const container = document.createElement('div');
        container.className = 'chart-container';
        container.innerHTML = '<div class="chart-title">🎬 Director Analysis</div><div id="directorChart"></div>';
        chartsContainer.appendChild(container);
        const directorData = await calculateDirectorData(data.yearFilms);
        createDirectorChart(directorData);
    }

    if (selectedCharts.has('calendar')) {
        const container = document.createElement('div');
        container.className = 'chart-container';
        container.innerHTML = '<div class="chart-title">📅 Calendar Heatmap</div><div style="text-align: center; color: #888; padding: 40px;">Coming soon: Interactive calendar showing viewing patterns</div>';
        chartsContainer.appendChild(container);
    }

    if (selectedCharts.has('genres')) {
        const container = document.createElement('div');
        container.className = 'chart-container';
        container.innerHTML = '<div class="chart-title">🎭 Genre Preferences</div><div id="genresChart"></div>';
        chartsContainer.appendChild(container);
        const genresData = await calculateGenresData(data.yearFilms);
        createGenresChart(genresData);
    }

    // Personality Insights Charts
    if (selectedCharts.has('genrePersonality')) {
        const container = document.createElement('div');
        container.className = 'chart-container';
        container.innerHTML = '<div class="chart-title">🎭 Genre Personality Profile</div><div id="genrePersonalityChart"></div>';
        chartsContainer.appendChild(container);
        await createGenrePersonalityChart(data.yearFilms);
    }

    if (selectedCharts.has('runtimeAnalysis')) {
        const container = document.createElement('div');
        container.className = 'chart-container';
        container.innerHTML = '<div class="chart-title">⏱️ Runtime vs Rating Analysis</div><div id="runtimeAnalysisChart"></div>';
        chartsContainer.appendChild(container);
        await createRuntimeAnalysisChart(data.yearFilms);
    }

    if (selectedCharts.has('workWeekSplit')) {
        const container = document.createElement('div');
        container.className = 'chart-container';
        container.innerHTML = '<div class="chart-title">💼 Work Week vs Weekend Cinema</div><div id="workWeekChart"></div>';
        chartsContainer.appendChild(container);
        createWorkWeekChart(data.yearFilms);
    }

    if (selectedCharts.has('directorLoyalty')) {
        const container = document.createElement('div');
        container.className = 'chart-container';
        container.innerHTML = '<div class="chart-title">👑 Director Loyalty Index</div><div id="directorLoyaltyChart"></div>';
        chartsContainer.appendChild(container);
        const directorData = await calculateDirectorData(data.yearFilms);
        createDirectorLoyaltyChart(directorData);
    }

    // Behavioral Quirks Charts
    if (selectedCharts.has('releaseDelay')) {
        const container = document.createElement('div');
        container.className = 'chart-container';
        container.innerHTML = '<div class="chart-title">⏰ Release Delay Timeline</div><div id="releaseDelayChart"></div>';
        chartsContainer.appendChild(container);
        createReleaseDelayChart(data.yearFilms);
    }

    if (selectedCharts.has('emotionalWhiplash')) {
        const container = document.createElement('div');
        container.className = 'chart-container';
        container.innerHTML = '<div class="chart-title">😵 Emotional Whiplash Index</div><div id="emotionalWhiplashChart"></div>';
        chartsContainer.appendChild(container);
        createEmotionalWhiplashChart(data.yearFilms);
    }

    // Time Pattern Charts
    if (selectedCharts.has('monthlyViewing')) {
        const container = document.createElement('div');
        container.className = 'chart-container';
        container.innerHTML = '<div class="chart-title">📈 Monthly Viewing Volume</div><div id="monthlyViewingChart"></div>';
        chartsContainer.appendChild(container);
        createMonthlyViewingChart(data.timeline);
    }

    if (selectedCharts.has('dayOfWeek')) {
        const container = document.createElement('div');
        container.className = 'chart-container';
        container.innerHTML = '<div class="chart-title">📅 Day-of-Week Preferences</div><div id="dayOfWeekChart"></div>';
        chartsContainer.appendChild(container);
        createDayOfWeekChart(data.yearFilms);
    }

    if (selectedCharts.has('calendarHeatmap')) {
        const container = document.createElement('div');
        container.className = 'chart-container';
        container.innerHTML = '<div class="chart-title">📅 Calendar Heatmap</div><div id="calendarHeatmapChart"></div>';
        chartsContainer.appendChild(container);
        createCalendarHeatmap(data.yearFilms);
    }
}
