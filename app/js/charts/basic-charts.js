function createReleaseYearChart(yearData) {
    console.log('Creating release year chart with data:', yearData);
    const container = document.getElementById('releaseYearChart');
    container.innerHTML = '';

    const years = Object.keys(yearData);
    if (years.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #888;">No release year data available for this year</p>';
        return;
    }

    const containerRect = container.getBoundingClientRect();
    const margin = { top: 20, right: 30, bottom: 80, left: 50 };
    const availableWidth = containerRect.width - margin.left - margin.right;
    const width = Math.max(600, availableWidth);
    const height = 600 - margin.top - margin.bottom;

    const svg = d3.select(container)
        .append('svg')
        .attr('viewBox', `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
        .attr('preserveAspectRatio', 'xMidYMid meet')
        .attr('width', '100%')
        .attr('height', '100%')
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    const sortedYears = years.sort((a, b) => parseInt(a) - parseInt(b));
    const values = sortedYears.map(year => yearData[year]);

    const x = d3.scaleBand()
        .domain(sortedYears)
        .range([0, width])
        .padding(0.1);

    const y = d3.scaleLinear()
        .domain([0, d3.max(values) || 1])
        .nice()
        .range([height, 0]);

    svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll('text')
        .style('text-anchor', 'end')
        .attr('dx', '-.8em')
        .attr('dy', '.15em')
        .attr('transform', 'rotate(-45)')
        .style('fill', '#e0e0e0');

    svg.append('g')
        .call(d3.axisLeft(y))
        .selectAll('text')
        .style('fill', '#e0e0e0');

    svg.selectAll('.bar')
        .data(sortedYears)
        .enter()
        .append('rect')
        .attr('class', 'bar')
        .attr('x', d => x(d))
        .attr('y', d => y(yearData[d] || 0))
        .attr('width', x.bandwidth())
        .attr('height', d => height - y(yearData[d] || 0))
        .attr('fill', '#007bff');
}

function createRatingChart(ratingData) {
    console.log('Creating rating chart with data:', ratingData);
    const container = document.getElementById('ratingChart');
    container.innerHTML = '';

    // Generate ratings array dynamically based on step size (supports half-stars)
    const ratings = [];
    for (let rating = RATING_MIN; rating <= RATING_MAX; rating += RATING_STEP) {
        ratings.push(rating);
    }

    const hasData = ratings.some(r => (ratingData[r] || 0) > 0);

    if (!hasData) {
        container.innerHTML = '<p style="text-align: center; color: #888;">No rating data available for this year</p>';
        return;
    }

    const margin = { top: 20, right: 30, bottom: 40, left: 50 };
    const containerRect = container.getBoundingClientRect();
    const availableWidth = containerRect.width - margin.left - margin.right;
    const width = Math.max(600, availableWidth);
    const height = 600 - margin.top - margin.bottom;

    const svg = d3.select(container)
        .append('svg')
        .attr('viewBox', `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
        .attr('preserveAspectRatio', 'xMidYMid meet')
        .attr('width', '100%')
        .attr('height', '100%')
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    // Format rating labels (show "½" for half stars)
    const formatRating = (rating) => {
        if (rating % 1 === 0.5) {
            return `${Math.floor(rating)}½`;
        }
        return rating.toString();
    };

    const x = d3.scaleBand()
        .domain(ratings.map(r => formatRating(r)))
        .range([0, width])
        .padding(0.1);

    const y = d3.scaleLinear()
        .domain([0, d3.max(Object.values(ratingData)) || 1])
        .nice()
        .range([height, 0]);

    svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll('text')
        .style('fill', '#e0e0e0');

    svg.append('g')
        .call(d3.axisLeft(y))
        .selectAll('text')
        .style('fill', '#e0e0e0');

    svg.selectAll('.bar')
        .data(ratings)
        .enter()
        .append('rect')
        .attr('class', 'bar')
        .attr('x', d => x(formatRating(d)))
        .attr('y', d => y(ratingData[d] || 0))
        .attr('width', x.bandwidth())
        .attr('height', d => height - y(ratingData[d] || 0))
        .attr('fill', '#28a745');
}

function createReleaseDecadeChart(decadeData) {
    console.log('Creating release decade chart with data:', decadeData);
    const container = document.getElementById('releaseDecadeChart');
    container.innerHTML = '';

    const decades = Object.keys(decadeData);
    if (decades.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #888;">No release decade data available for this year</p>';
        return;
    }

    const containerRect = container.getBoundingClientRect();
    const margin = { top: 20, right: 30, bottom: 60, left: 50 };
    const availableWidth = containerRect.width - margin.left - margin.right;
    const width = Math.max(600, availableWidth);
    const height = 600 - margin.top - margin.bottom;

    const svg = d3.select(container)
        .append('svg')
        .attr('viewBox', `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
        .attr('preserveAspectRatio', 'xMidYMid meet')
        .attr('width', '100%')
        .attr('height', '100%')
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    const sortedDecades = decades.sort((a, b) => {
        const aNum = parseInt(a.replace('s', ''));
        const bNum = parseInt(b.replace('s', ''));
        return aNum - bNum; // Oldest first
    });
    const values = sortedDecades.map(decade => decadeData[decade]);

    const x = d3.scaleBand()
        .domain(sortedDecades)
        .range([0, width])
        .padding(0.1);

    const y = d3.scaleLinear()
        .domain([0, d3.max(values) || 1])
        .nice()
        .range([height, 0]);

    svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll('text')
        .style('text-anchor', 'middle')
        .style('fill', '#e0e0e0');

    svg.append('g')
        .call(d3.axisLeft(y))
        .selectAll('text')
        .style('fill', '#e0e0e0');

    svg.selectAll('.bar')
        .data(sortedDecades)
        .enter()
        .append('rect')
        .attr('class', 'bar')
        .attr('x', d => x(d))
        .attr('y', d => y(decadeData[d] || 0))
        .attr('width', x.bandwidth())
        .attr('height', d => height - y(decadeData[d] || 0))
        .attr('fill', '#dc3545');
}

function createTimelineChart(timelineData) {
    console.log('Creating timeline chart with data:', timelineData);
    const container = document.getElementById('timelineChart');
    container.innerHTML = '';

    if (timelineData.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #888;">No timeline data available for this year</p>';
        return;
    }

    const containerRect = container.getBoundingClientRect();
    const margin = { top: 20, right: 30, bottom: 40, left: 50 };
    const availableWidth = containerRect.width - margin.left - margin.right;
    const width = Math.max(600, availableWidth);
    const height = 600 - margin.top - margin.bottom;

    const svg = d3.select(container)
        .append('svg')
        .attr('viewBox', `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
        .attr('preserveAspectRatio', 'xMidYMid meet')
        .attr('width', '100%')
        .attr('height', '100%')
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand()
        .domain(timelineData.map(d => d.month))
        .range([0, width])
        .padding(0.1);

    const y = d3.scaleLinear()
        .domain([0, d3.max(timelineData.map(d => d.count)) || 1])
        .nice()
        .range([height, 0]);

    svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll('text')
        .style('text-anchor', 'middle')
        .style('fill', '#e0e0e0');

    svg.append('g')
        .call(d3.axisLeft(y))
        .selectAll('text')
        .style('fill', '#e0e0e0');

    svg.selectAll('.bar')
        .data(timelineData)
        .enter()
        .append('rect')
        .attr('class', 'bar')
        .attr('x', d => x(d.month))
        .attr('y', d => y(d.count))
        .attr('width', x.bandwidth())
        .attr('height', d => height - y(d.count))
        .attr('fill', '#ffc107');
}
