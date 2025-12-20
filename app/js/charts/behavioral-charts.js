
// Behavioral Charts Module
// Contains charts related to user behavioral patterns and movie watching habits

function createReleaseDelayChart(films) {
    const container = document.getElementById('releaseDelayChart');
    container.innerHTML = '';

    const delayData = films
        .filter(film => film.watchedDate && film.releaseYear)
        .map(film => {
            const releaseDate = new Date(film.releaseYear, 0, 1); // Approximate release as Jan 1
            const watchDate = film.watchedDate;
            const delayMonths = Math.round((watchDate - releaseDate) / (1000 * 60 * 60 * 24 * 30));

            return {
                title: film.title,
                releaseYear: film.releaseYear,
                watchYear: watchDate.getFullYear(),
                delayMonths: delayMonths,
                delayYears: Math.round(delayMonths / 12 * 10) / 10
            };
        })
        .filter(d => d.delayMonths > 0)
        .sort((a, b) => b.delayMonths - a.delayMonths)
        .slice(0, 10); // Top 10 delays

    if (delayData.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #888;">No delay data available</p>';
        return;
    }

    const margin = { top: 20, right: 120, bottom: 80, left: 120 };
    const containerRect = container.getBoundingClientRect();
    const availableWidth = containerRect.width - margin.left - margin.right;
    const width = Math.max(600, availableWidth);
    const height = delayData.length * 40;

    const svg = d3.select(container)
        .append('svg')
        .attr('viewBox', `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
        .attr('preserveAspectRatio', 'xMidYMid meet')
        .attr('width', '100%')
        .attr('height', '100%')
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear()
        .domain([0, d3.max(delayData, d => d.delayYears) + 1])
        .range([0, width]);

    const y = d3.scaleBand()
        .domain(delayData.map(d => d.title.length > 25 ? d.title.substring(0, 25) + '...' : d.title))
        .range([0, height])
        .padding(0.2);

    // Add bars
    svg.selectAll('.delay-bar')
        .data(delayData)
        .enter()
        .append('rect')
        .attr('class', 'delay-bar')
        .attr('x', 0)
        .attr('y', d => y(d.title.length > 25 ? d.title.substring(0, 25) + '...' : d.title))
        .attr('width', d => x(d.delayYears))
        .attr('height', y.bandwidth())
        .attr('fill', '#dc3545')
        .attr('rx', 4);

    // Add delay labels
    svg.selectAll('.delay-label')
        .data(delayData)
        .enter()
        .append('text')
        .attr('class', 'delay-label')
        .attr('x', d => x(d.delayYears) + 10)
        .attr('y', d => y(d.title.length > 25 ? d.title.substring(0, 25) + '...' : d.title) + y.bandwidth() / 2 + 5)
        .style('fill', '#e0e0e0')
        .style('font-size', '12px')
        .text(d => `${d.delayYears}y`);

    // Add axes
    svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll('text')
        .style('fill', '#e0e0e0');

    svg.append('g')
        .call(d3.axisLeft(y))
        .selectAll('text')
        .style('fill', '#e0e0e0')
        .style('font-size', '10px');

    // Add labels
    svg.append('text')
        .attr('x', width / 2)
        .attr('y', height + 40)
        .attr('text-anchor', 'middle')
        .style('fill', '#e0e0e0')
        .style('font-size', '14px')
        .text('Years Between Release and Watch Date');
}

function createEmotionalWhiplashChart(films) {
    const container = document.getElementById('emotionalWhiplashChart');
    container.innerHTML = '';

    // Sort films by watch date and analyze rating changes
    const sortedFilms = films
        .filter(film => film.watchedDate && film.rating)
        .sort((a, b) => a.watchedDate - b.watchedDate);

    let whiplashCount = 0;
    const transitions = [];

    for (let i = 1; i < sortedFilms.length; i++) {
        const prevRating = sortedFilms[i-1].rating;
        const currRating = sortedFilms[i].rating;
        const difference = Math.abs(currRating - prevRating);

        if (difference >= 2) { // Significant change (2+ stars)
            whiplashCount++;
            transitions.push({
                from: sortedFilms[i-1].title,
                to: sortedFilms[i].title,
                change: currRating - prevRating,
                date: sortedFilms[i].watchedDate
            });
        }
    }

    const chartHTML = `
        <div style="text-align: center; padding: 20px; background: #2d2d2d; border-radius: 8px;">
            <h4 style="color: #007bff; margin-bottom: 15px;">Emotional Whiplash Detector</h4>
            <div style="font-size: 2.5em; font-weight: bold; color: #ffc107; margin-bottom: 10px;">${whiplashCount}</div>
            <div style="color: #888; margin-bottom: 20px;">Major mood swings detected</div>
            ${transitions.length > 0 ? `
                <div style="text-align: left; background: #3d3d3d; padding: 15px; border-radius: 6px; margin-top: 15px;">
                    <h5 style="color: #e0e0e0; margin-bottom: 10px;">Recent Examples:</h5>
                    <ul style="color: #ccc; font-size: 0.9em; margin: 0; padding-left: 20px;">
                        ${transitions.slice(0, 3).map(t =>
                            `<li>${t.from} (${(t.change > 0 ? '+' : '') + t.change} stars) → ${t.to}</li>`
                        ).join('')}
                    </ul>
                </div>
            ` : ''}
        </div>
    `;

    container.innerHTML = chartHTML;
}
