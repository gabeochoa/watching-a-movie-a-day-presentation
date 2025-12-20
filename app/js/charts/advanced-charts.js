function createControversyChart(controversyData) {
    console.log('Creating controversy chart with data:', controversyData);
    const container = document.getElementById('controversyChart');
    container.innerHTML = '';

    if (controversyData.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #888;">No controversy data available for this year</p>';
        return;
    }

    const margin = { top: 20, right: 80, bottom: 60, left: 60 };
    const containerRect = container.getBoundingClientRect();
    const availableWidth = containerRect.width - margin.left - margin.right;
    const width = Math.max(600, availableWidth);
    const height = 500 - margin.top - margin.bottom;

    const svg = d3.select(container)
        .append('svg')
        .attr('viewBox', `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
        .attr('preserveAspectRatio', 'xMidYMid meet')
        .attr('width', '100%')
        .attr('height', '100%')
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    const x = d3.scaleLinear()
        .domain([0.5, 5.5])
        .range([0, width]);

    const y = d3.scaleLinear()
        .domain([0.5, 5.5])
        .range([height, 0]);

    // Add diagonal line (perfect agreement)
    svg.append('line')
        .attr('x1', x(1))
        .attr('y1', y(1))
        .attr('x2', x(5))
        .attr('y2', y(5))
        .attr('stroke', '#666')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '5,5');

    // Add grid lines
    svg.selectAll('.grid-line')
        .data([1, 2, 3, 4, 5])
        .enter()
        .append('line')
        .attr('class', 'grid-line')
        .attr('x1', d => x(d))
        .attr('y1', 0)
        .attr('x2', d => x(d))
        .attr('y2', height)
        .attr('stroke', '#333')
        .attr('stroke-width', 1);

    svg.selectAll('.grid-line-y')
        .data([1, 2, 3, 4, 5])
        .enter()
        .append('line')
        .attr('class', 'grid-line-y')
        .attr('x1', 0)
        .attr('y1', d => y(d))
        .attr('x2', width)
        .attr('y2', d => y(d))
        .attr('stroke', '#333')
        .attr('stroke-width', 1);

    // Add points
    const points = svg.selectAll('.controversy-point')
        .data(controversyData.slice(0, 50)) // Limit to top 50 most controversial
        .enter()
        .append('circle')
        .attr('class', 'controversy-point')
        .attr('cx', d => x(d.communityRating))
        .attr('cy', d => y(d.personalRating))
        .attr('r', 6)
        .attr('fill', d => d.difference > 0.5 ? '#28a745' : d.difference < -0.5 ? '#dc3545' : '#ffc107')
        .attr('stroke', '#fff')
        .attr('stroke-width', 2)
        .style('cursor', 'pointer')
        .on('mouseover', function (event, d) {
            // Show tooltip
            const tooltip = d3.select('body')
                .append('div')
                .attr('class', 'tooltip')
                .style('position', 'absolute')
                .style('background', '#2d2d2d')
                .style('color', '#e0e0e0')
                .style('padding', '8px 12px')
                .style('border-radius', '4px')
                .style('font-size', '12px')
                .style('pointer-events', 'none')
                .style('z-index', '1000')
                .style('border', '1px solid #555');

            tooltip.html(`
                <strong>${d.title}</strong><br>
                You: ${d.personalRating} ⭐<br>
                Community: ${d.communityRating} ⭐<br>
                Difference: ${d.difference > 0 ? '+' : ''}${d.difference}
            `)
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 10) + 'px');
        })
        .on('mouseout', function () {
            d3.selectAll('.tooltip').remove();
        });

    // Add axes
    svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x).ticks(5))
        .selectAll('text')
        .style('fill', '#e0e0e0');

    svg.append('g')
        .call(d3.axisLeft(y).ticks(5))
        .selectAll('text')
        .style('fill', '#e0e0e0');

    // Add labels
    svg.append('text')
        .attr('x', width / 2)
        .attr('y', height + 40)
        .attr('text-anchor', 'middle')
        .style('fill', '#e0e0e0')
        .style('font-size', '14px')
        .text('Community Rating');

    svg.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -height / 2)
        .attr('y', -40)
        .attr('text-anchor', 'middle')
        .style('fill', '#e0e0e0')
        .style('font-size', '14px')
        .text('Your Rating');

    // Add legend
    const legend = svg.append('g')
        .attr('transform', `translate(${width - 150}, 20)`);

    const legendData = [
        { color: '#28a745', text: 'You liked more' },
        { color: '#ffc107', text: 'Similar ratings' },
        { color: '#dc3545', text: 'You liked less' }
    ];

    legend.selectAll('.legend-item')
        .data(legendData)
        .enter()
        .append('g')
        .attr('class', 'legend-item')
        .attr('transform', (d, i) => `translate(0, ${i * 20})`)
        .each(function (d) {
            const g = d3.select(this);
            g.append('circle')
                .attr('r', 6)
                .attr('fill', d.color)
                .attr('stroke', '#fff')
                .attr('stroke-width', 2);
            g.append('text')
                .attr('x', 15)
                .attr('y', 4)
                .style('fill', '#e0e0e0')
                .style('font-size', '12px')
                .text(d.text);
        });
}

function createDirectorChart(directorData) {
    console.log('Creating director chart with data:', directorData);
    const container = document.getElementById('directorChart');
    container.innerHTML = '';

    if (directorData.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #888;">No director data available for this year</p>';
        return;
    }

    const margin = { top: 20, right: 120, bottom: 60, left: 120 };
    const containerRect = container.getBoundingClientRect();
    const availableWidth = containerRect.width - margin.left - margin.right;
    const width = Math.max(600, availableWidth);
    const height = Math.max(400, directorData.length * 40);

    const svg = d3.select(container)
        .append('svg')
        .attr('viewBox', `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
        .attr('preserveAspectRatio', 'xMidYMid meet')
        .attr('width', '100%')
        .attr('height', '100%')
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    const x = d3.scaleLinear()
        .domain([0, d3.max(directorData, d => d.filmCount) || 1])
        .range([0, width]);

    const y = d3.scaleBand()
        .domain(directorData.map(d => d.name))
        .range([0, height])
        .padding(0.1);

    // Add bars
    svg.selectAll('.director-bar')
        .data(directorData)
        .enter()
        .append('rect')
        .attr('class', 'director-bar')
        .attr('x', 0)
        .attr('y', d => y(d.name))
        .attr('width', d => x(d.filmCount))
        .attr('height', y.bandwidth())
        .attr('fill', '#17a2b8')
        .attr('rx', 4)
        .style('cursor', 'pointer')
        .on('mouseover', function (event, d) {
            d3.select(this).attr('fill', '#138496');

            // Show tooltip
            const tooltip = d3.select('body')
                .append('div')
                .attr('class', 'tooltip')
                .style('position', 'absolute')
                .style('background', '#2d2d2d')
                .style('color', '#e0e0e0')
                .style('padding', '8px 12px')
                .style('border-radius', '4px')
                .style('font-size', '12px')
                .style('pointer-events', 'none')
                .style('z-index', '1000')
                .style('border', '1px solid #555');

            tooltip.html(`
                <strong>${d.name}</strong><br>
                Films watched: ${d.filmCount}<br>
                Average rating: ${d.averageRating} ⭐<br>
                <small>Click to see films</small>
            `)
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 10) + 'px');
        })
        .on('mouseout', function () {
            d3.select(this).attr('fill', '#17a2b8');
            d3.selectAll('.tooltip').remove();
        })
        .on('click', function (event, d) {
            // Show films by this director
            const filmsList = d.films.map(f => f.title).join(', ');
            alert(`${d.name}'s films you watched:\n${filmsList}`);
        });

    // Add rating indicators (small circles)
    svg.selectAll('.rating-dot')
        .data(directorData)
        .enter()
        .append('circle')
        .attr('class', 'rating-dot')
        .attr('cx', d => x(d.filmCount) + 15)
        .attr('cy', d => y(d.name) + y.bandwidth() / 2)
        .attr('r', 8)
        .attr('fill', d => {
            if (d.averageRating >= 4) return '#28a745';
            if (d.averageRating >= 3) return '#ffc107';
            return '#dc3545';
        })
        .attr('stroke', '#fff')
        .attr('stroke-width', 2);

    // Add rating text
    svg.selectAll('.rating-text')
        .data(directorData)
        .enter()
        .append('text')
        .attr('class', 'rating-text')
        .attr('x', d => x(d.filmCount) + 15)
        .attr('y', d => y(d.name) + y.bandwidth() / 2 + 3)
        .attr('text-anchor', 'middle')
        .style('fill', '#fff')
        .style('font-size', '10px')
        .style('font-weight', 'bold')
        .text(d => d.averageRating);

    // Add axes
    svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x).ticks(5))
        .selectAll('text')
        .style('fill', '#e0e0e0');

    svg.append('g')
        .call(d3.axisLeft(y))
        .selectAll('text')
        .style('fill', '#e0e0e0')
        .style('font-size', '12px');

    // Add labels
    svg.append('text')
        .attr('x', width / 2)
        .attr('y', height + 40)
        .attr('text-anchor', 'middle')
        .style('fill', '#e0e0e0')
        .style('font-size', '14px')
        .text('Number of Films Watched');

    // Add legend
    const legend = svg.append('g')
        .attr('transform', `translate(${width - 100}, -10)`);

    const legendData = [
        { color: '#28a745', text: '4+ ⭐' },
        { color: '#ffc107', text: '3+ ⭐' },
        { color: '#dc3545', text: '< 3 ⭐' }
    ];

    legend.selectAll('.legend-item')
        .data(legendData)
        .enter()
        .append('g')
        .attr('class', 'legend-item')
        .attr('transform', (d, i) => `translate(0, ${i * 15})`)
        .each(function (d) {
            const g = d3.select(this);
            g.append('circle')
                .attr('r', 5)
                .attr('fill', d.color);
            g.append('text')
                .attr('x', 12)
                .attr('y', 4)
                .style('fill', '#e0e0e0')
                .style('font-size', '11px')
                .text(d.text);
        });
}

function createGenresChart(genresData) {
    console.log('Creating genres chart with data:', genresData);
    const container = document.getElementById('genresChart');
    container.innerHTML = '';

    if (genresData.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #888;">No genre data available</p>';
        return;
    }

    const margin = { top: 20, right: 120, bottom: 60, left: 120 };
    const containerRect = container.getBoundingClientRect();
    const availableWidth = containerRect.width - margin.left - margin.right;
    const width = Math.max(600, availableWidth);
    const height = Math.max(400, genresData.length * 40);

    const svg = d3.select(container)
        .append('svg')
        .attr('viewBox', `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
        .attr('preserveAspectRatio', 'xMidYMid meet')
        .attr('width', '100%')
        .attr('height', '100%')
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear()
        .domain([0, d3.max(genresData, d => d.count) || 1])
        .range([0, width]);

    const y = d3.scaleBand()
        .domain(genresData.map(d => d.genre))
        .range([0, height])
        .padding(0.1);

    // Add bars
    svg.selectAll('.genre-bar')
        .data(genresData)
        .enter()
        .append('rect')
        .attr('class', 'genre-bar')
        .attr('x', 0)
        .attr('y', d => y(d.genre))
        .attr('width', d => x(d.count))
        .attr('height', y.bandwidth())
        .attr('fill', '#17a2b8')
        .attr('rx', 4);

    // Add rating indicators
    svg.selectAll('.genre-rating')
        .data(genresData.filter(d => d.averageRating))
        .enter()
        .append('circle')
        .attr('class', 'genre-rating')
        .attr('cx', d => x(d.count) + 15)
        .attr('cy', d => y(d.genre) + y.bandwidth() / 2)
        .attr('r', 8)
        .attr('fill', d => {
            if (d.averageRating >= 4) return '#28a745';
            if (d.averageRating >= 3) return '#ffc107';
            return '#dc3545';
        })
        .attr('stroke', '#fff')
        .attr('stroke-width', 2);

    // Add rating text
    svg.selectAll('.genre-rating-text')
        .data(genresData.filter(d => d.averageRating))
        .enter()
        .append('text')
        .attr('class', 'genre-rating-text')
        .attr('x', d => x(d.count) + 15)
        .attr('y', d => y(d.genre) + y.bandwidth() / 2 + 3)
        .attr('text-anchor', 'middle')
        .style('fill', '#fff')
        .style('font-size', '10px')
        .style('font-weight', 'bold')
        .text(d => d.averageRating);

    // Add axes
    svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x).ticks(5))
        .selectAll('text')
        .style('fill', '#e0e0e0');

    svg.append('g')
        .call(d3.axisLeft(y))
        .selectAll('text')
        .style('fill', '#e0e0e0')
        .style('font-size', '12px');

    // Add labels
    svg.append('text')
        .attr('x', width / 2)
        .attr('y', height + 40)
        .attr('text-anchor', 'middle')
        .style('fill', '#e0e0e0')
        .style('font-size', '14px')
        .text('Number of Films');
}

async function createGenrePersonalityChart(films) {
    const container = document.getElementById('genrePersonalityChart');
    container.innerHTML = '';

    const genresData = await calculateGenresData(films);
    if (genresData.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #888;">No genre data available</p>';
        return;
    }

    // Create a personality summary
    const totalFilms = films.length;
    const topGenres = genresData.slice(0, 3);
    const genreBreakdown = topGenres.map(g => `${g.genre} (${Math.round(g.count/totalFilms*100)}%)`).join(', ');

    const personalityText = `
        <div style="text-align: center; padding: 20px; background: #2d2d2d; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="color: #007bff; margin-bottom: 15px;">Your Movie Personality</h3>
            <p style="font-size: 16px; line-height: 1.6;">
                You're <strong>${Math.round(topGenres[0].count/totalFilms*100)}% ${topGenres[0].genre.toLowerCase()}</strong>,
                with strong interests in ${genreBreakdown}.
                ${topGenres[0].averageRating ? `You rate ${topGenres[0].genre.toLowerCase()} films an average of ${topGenres[0].averageRating} stars.` : ''}
            </p>
        </div>
    `;

    container.innerHTML = personalityText;
}

// TMDB API functions are now in tmdb-api.js

async function createRuntimeAnalysisChart(films) {
    const container = document.getElementById('runtimeAnalysisChart');
    container.innerHTML = '';

    // Fetch runtime data for all films
    const runtimePromises = films
        .filter(film => film.rating)
        .map(async (film) => {
            try {
                const runtime = await window.TMDB_API.fetchRuntimeFromTMDB(film.title, film.releaseYear);
                if (runtime) {
                    return {
                        title: film.title,
                        runtime: runtime,
                        rating: film.rating,
                        genre: 'Unknown' // Could be enhanced with genre data
                    };
                }
            } catch (error) {
                console.warn(`Failed to get runtime for "${film.title}":`, error);
            }
            return null;
        });

    const runtimeResults = await Promise.all(runtimePromises);
    const runtimeData = runtimeResults.filter(result => result !== null);

    if (runtimeData.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #888;">No runtime data available</p>';
        return;
    }

    const margin = { top: 20, right: 80, bottom: 60, left: 60 };
    const containerRect = container.getBoundingClientRect();
    const availableWidth = containerRect.width - margin.left - margin.right;
    const width = Math.max(600, availableWidth);
    const height = 500;

    const svg = d3.select(container)
        .append('svg')
        .attr('viewBox', `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
        .attr('preserveAspectRatio', 'xMidYMid meet')
        .attr('width', '100%')
        .attr('height', '100%')
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear()
        .domain([0, d3.max(runtimeData, d => d.runtime) + 20])
        .range([0, width]);

    const y = d3.scaleLinear()
        .domain([0.5, 5.5])
        .range([height, 0]);

    // Add points colored by genre
    const genreColors = {
        'Drama': '#dc3545', 'Comedy': '#ffc107', 'Action': '#28a745',
        'Sci-Fi': '#17a2b8', 'Animation': '#e83e8c', 'Unknown': '#6c757d'
    };

    svg.selectAll('.runtime-point')
        .data(runtimeData)
        .enter()
        .append('circle')
        .attr('class', 'runtime-point')
        .attr('cx', d => x(d.runtime))
        .attr('cy', d => y(d.rating))
        .attr('r', 8)
        .attr('fill', d => genreColors[d.genre] || '#6c757d')
        .attr('stroke', '#fff')
        .attr('stroke-width', 2)
        .style('cursor', 'pointer')
        .on('mouseover', function(event, d) {
            d3.select(this).attr('r', 12);
            const tooltip = d3.select('body')
                .append('div')
                .attr('class', 'tooltip')
                .style('position', 'absolute')
                .style('background', '#2d2d2d')
                .style('color', '#e0e0e0')
                .style('padding', '8px 12px')
                .style('border-radius', '4px')
                .style('font-size', '12px')
                .style('pointer-events', 'none')
                .style('z-index', '1000')
                .style('border', '1px solid #555')
                .html(`<strong>${d.title}</strong><br>${d.runtime} min, ${d.rating} ⭐<br>${d.genre}`)
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 10) + 'px');
        })
        .on('mouseout', function() {
            d3.select(this).attr('r', 8);
            d3.selectAll('.tooltip').remove();
        });

    // Add axes
    svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll('text')
        .style('fill', '#e0e0e0');

    svg.append('g')
        .call(d3.axisLeft(y).ticks(5))
        .selectAll('text')
        .style('fill', '#e0e0e0');

    // Add labels
    svg.append('text')
        .attr('x', width / 2)
        .attr('y', height + 40)
        .attr('text-anchor', 'middle')
        .style('fill', '#e0e0e0')
        .style('font-size', '14px')
        .text('Runtime (minutes)');

    svg.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -height / 2)
        .attr('y', -40)
        .attr('text-anchor', 'middle')
        .style('fill', '#e0e0e0')
        .style('font-size', '14px')
        .text('Your Rating');
}

function createWorkWeekChart(films) {
    const container = document.getElementById('workWeekChart');
    container.innerHTML = '';

    const dayData = calculateDayOfWeekData(films);
    const weekdays = dayData.slice(1, 6); // Mon-Fri
    const weekends = [dayData[0], dayData[6]]; // Sun, Sat

    const weekdayAvg = weekdays.reduce((sum, day) => sum + day.count, 0) / weekdays.length;
    const weekendAvg = weekends.reduce((sum, day) => sum + day.count, 0) / weekends.length;

    const totalWeekday = weekdays.reduce((sum, day) => sum + day.count, 0);
    const totalWeekend = weekends.reduce((sum, day) => sum + day.count, 0);

    const chartHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
            <div style="text-align: center; padding: 20px; background: #2d2d2d; border-radius: 8px;">
                <h4 style="color: #007bff; margin-bottom: 10px;">Weekdays (Mon-Fri)</h4>
                <div style="font-size: 2em; font-weight: bold; color: #28a745;">${totalWeekday}</div>
                <div style="color: #888;">films total</div>
                <div style="margin-top: 10px; font-size: 0.9em;">${weekdayAvg.toFixed(1)} films/day average</div>
            </div>
            <div style="text-align: center; padding: 20px; background: #2d2d2d; border-radius: 8px;">
                <h4 style="color: #007bff; margin-bottom: 10px;">Weekends (Sat-Sun)</h4>
                <div style="font-size: 2em; font-weight: bold; color: #ffc107;">${totalWeekend}</div>
                <div style="color: #888;">films total</div>
                <div style="margin-top: 10px; font-size: 0.9em;">${weekendAvg.toFixed(1)} films/day average</div>
            </div>
        </div>
        <div style="text-align: center; padding: 15px; background: #1a4a2a; border-radius: 6px; color: #90d490;">
            <strong>Insight:</strong> ${weekendAvg > weekdayAvg ?
                "You're a weekend movie enthusiast!" :
                "You maintain consistent viewing habits throughout the week!"}
        </div>
    `;

    container.innerHTML = chartHTML;
}

function createDirectorLoyaltyChart(directorData) {
    console.log('Creating director loyalty chart');
    const container = document.getElementById('directorLoyaltyChart');
    container.innerHTML = '';

    if (directorData.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #888;">No director data available for this year</p>';
        return;
    }

    // Sort by film count to show most "loyal" directors
    const sortedDirectors = directorData.sort((a, b) => b.filmCount - a.filmCount).slice(0, 8);

    const margin = { top: 20, right: 120, bottom: 60, left: 120 };
    const containerRect = container.getBoundingClientRect();
    const availableWidth = containerRect.width - margin.left - margin.right;
    const width = Math.max(600, availableWidth);
    const height = sortedDirectors.length * 40;

    const svg = d3.select(container)
        .append('svg')
        .attr('viewBox', `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
        .attr('preserveAspectRatio', 'xMidYMid meet')
        .attr('width', '100%')
        .attr('height', '100%')
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear()
        .domain([0, d3.max(sortedDirectors, d => d.filmCount) || 1])
        .range([0, width]);

    const y = d3.scaleBand()
        .domain(sortedDirectors.map(d => d.name))
        .range([0, height])
        .padding(0.2);

    // Add bars
    svg.selectAll('.loyalty-bar')
        .data(sortedDirectors)
        .enter()
        .append('rect')
        .attr('class', 'loyalty-bar')
        .attr('x', 0)
        .attr('y', d => y(d.name))
        .attr('width', d => x(d.filmCount))
        .attr('height', y.bandwidth())
        .attr('fill', d => {
            if (d.filmCount >= 3) return '#28a745'; // High loyalty
            if (d.filmCount >= 2) return '#ffc107'; // Medium loyalty
            return '#17a2b8'; // Basic loyalty
        })
        .attr('rx', 4);

    // Add rating indicators
    svg.selectAll('.loyalty-rating')
        .data(sortedDirectors)
        .enter()
        .append('circle')
        .attr('class', 'loyalty-rating')
        .attr('cx', d => x(d.filmCount) + 15)
        .attr('cy', d => y(d.name) + y.bandwidth() / 2)
        .attr('r', 8)
        .attr('fill', d => {
            if (d.averageRating >= 4) return '#28a745';
            if (d.averageRating >= 3) return '#ffc107';
            return '#dc3545';
        })
        .attr('stroke', '#fff')
        .attr('stroke-width', 2);

    // Add rating text
    svg.selectAll('.loyalty-rating-text')
        .data(sortedDirectors)
        .enter()
        .append('text')
        .attr('class', 'loyalty-rating-text')
        .attr('x', d => x(d.filmCount) + 15)
        .attr('y', d => y(d.name) + y.bandwidth() / 2 + 3)
        .attr('text-anchor', 'middle')
        .style('fill', '#fff')
        .style('font-size', '10px')
        .style('font-weight', 'bold')
        .text(d => d.averageRating);

    // Add film count labels on bars
    svg.selectAll('.loyalty-count')
        .data(sortedDirectors)
        .enter()
        .append('text')
        .attr('class', 'loyalty-count')
        .attr('x', d => x(d.filmCount) / 2)
        .attr('y', d => y(d.name) + y.bandwidth() / 2 + 5)
        .attr('text-anchor', 'middle')
        .style('fill', '#fff')
        .style('font-size', '12px')
        .style('font-weight', 'bold')
        .text(d => d.filmCount);

    // Add axes
    svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x).ticks(5))
        .selectAll('text')
        .style('fill', '#e0e0e0');

    svg.append('g')
        .call(d3.axisLeft(y))
        .selectAll('text')
        .style('fill', '#e0e0e0')
        .style('font-size', '11px');

    // Add labels
    svg.append('text')
        .attr('x', width / 2)
        .attr('y', height + 40)
        .attr('text-anchor', 'middle')
        .style('fill', '#e0e0e0')
        .style('font-size', '14px')
        .text('Films Watched by Director');
}
