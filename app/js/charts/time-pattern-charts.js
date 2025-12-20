function createMonthlyViewingChart(timelineData) {
    console.log('Creating monthly viewing chart');
    const container = document.getElementById('monthlyViewingChart');
    container.innerHTML = '';

    if (timelineData.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #888;">No monthly data available</p>';
        return;
    }

    const margin = { top: 20, right: 30, bottom: 60, left: 50 };
    const containerRect = container.getBoundingClientRect();
    const availableWidth = containerRect.width - margin.left - margin.right;
    const width = Math.max(600, availableWidth);
    const height = 400;

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
        .style('fill', '#e0e0e0')
        .style('font-size', '10px');

    svg.append('g')
        .call(d3.axisLeft(y))
        .selectAll('text')
        .style('fill', '#e0e0e0');

    // Add bars with color based on intensity
    svg.selectAll('.monthly-bar')
        .data(timelineData)
        .enter()
        .append('rect')
        .attr('class', 'monthly-bar')
        .attr('x', d => x(d.month))
        .attr('y', d => y(d.count))
        .attr('width', x.bandwidth())
        .attr('height', d => height - y(d.count))
        .attr('fill', d => {
            if (d.count >= 5) return '#28a745'; // High activity
            if (d.count >= 3) return '#ffc107'; // Medium activity
            return '#17a2b8'; // Low activity
        })
        .attr('rx', 2);

    // Add value labels on bars
    svg.selectAll('.monthly-label')
        .data(timelineData)
        .enter()
        .append('text')
        .attr('class', 'monthly-label')
        .attr('x', d => x(d.month) + x.bandwidth() / 2)
        .attr('y', d => y(d.count) - 5)
        .attr('text-anchor', 'middle')
        .style('fill', '#e0e0e0')
        .style('font-size', '11px')
        .style('font-weight', 'bold')
        .text(d => d.count);

    svg.append('text')
        .attr('x', width / 2)
        .attr('y', height + 40)
        .attr('text-anchor', 'middle')
        .style('fill', '#e0e0e0')
        .style('font-size', '14px')
        .text('Month');

    svg.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -height / 2)
        .attr('y', -35)
        .attr('text-anchor', 'middle')
        .style('fill', '#e0e0e0')
        .style('font-size', '14px')
        .text('Films Watched');
}

function createDayOfWeekChart(films) {
    console.log('Creating day of week chart');
    const container = document.getElementById('dayOfWeekChart');
    container.innerHTML = '';

    const dayData = calculateDayOfWeekData(films);

    const margin = { top: 20, right: 30, bottom: 60, left: 60 };
    const containerRect = container.getBoundingClientRect();
    const availableWidth = containerRect.width - margin.left - margin.right;
    const width = Math.max(600, availableWidth);
    const height = 400;

    const svg = d3.select(container)
        .append('svg')
        .attr('viewBox', `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
        .attr('preserveAspectRatio', 'xMidYMid meet')
        .attr('width', '100%')
        .attr('height', '100%')
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand()
        .domain(dayData.map(d => d.day))
        .range([0, width])
        .padding(0.1);

    const y = d3.scaleLinear()
        .domain([0, d3.max(dayData, d => d.count) || 1])
        .nice()
        .range([height, 0]);

    svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll('text')
        .style('text-anchor', 'middle')
        .style('fill', '#e0e0e0')
        .style('font-size', '11px');

    svg.append('g')
        .call(d3.axisLeft(y))
        .selectAll('text')
        .style('fill', '#e0e0e0');

    // Color code weekdays vs weekends
    svg.selectAll('.day-bar')
        .data(dayData)
        .enter()
        .append('rect')
        .attr('class', 'day-bar')
        .attr('x', d => x(d.day))
        .attr('y', d => y(d.count))
        .attr('width', x.bandwidth())
        .attr('height', d => height - y(d.count))
        .attr('fill', d => ['Saturday', 'Sunday'].includes(d.day) ? '#ffc107' : '#17a2b8')
        .attr('rx', 2);

    // Add average rating dots
    svg.selectAll('.day-rating')
        .data(dayData.filter(d => d.averageRating))
        .enter()
        .append('circle')
        .attr('class', 'day-rating')
        .attr('cx', d => x(d.day) + x.bandwidth() / 2)
        .attr('cy', d => y(d.count) - 15)
        .attr('r', 6)
        .attr('fill', d => {
            if (d.averageRating >= 4) return '#28a745';
            if (d.averageRating >= 3) return '#ffc107';
            return '#dc3545';
        })
        .attr('stroke', '#fff')
        .attr('stroke-width', 2);

    svg.selectAll('.day-rating-text')
        .data(dayData.filter(d => d.averageRating))
        .enter()
        .append('text')
        .attr('class', 'day-rating-text')
        .attr('x', d => x(d.day) + x.bandwidth() / 2)
        .attr('y', d => y(d.count) - 12)
        .attr('text-anchor', 'middle')
        .style('fill', '#fff')
        .style('font-size', '9px')
        .style('font-weight', 'bold')
        .text(d => d.averageRating);

    svg.append('text')
        .attr('x', width / 2)
        .attr('y', height + 40)
        .attr('text-anchor', 'middle')
        .style('fill', '#e0e0e0')
        .style('font-size', '14px')
        .text('Day of Week');

    svg.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -height / 2)
        .attr('y', -40)
        .attr('text-anchor', 'middle')
        .style('fill', '#e0e0e0')
        .style('font-size', '14px')
        .text('Films Watched');

    // Add legend
    const legend = svg.append('g')
        .attr('transform', `translate(${width - 120}, -10)`);

    const legendData = [
        { color: '#17a2b8', text: 'Weekday' },
        { color: '#ffc107', text: 'Weekend' }
    ];

    legend.selectAll('.legend-item')
        .data(legendData)
        .enter()
        .append('g')
        .attr('class', 'legend-item')
        .attr('transform', (d, i) => `translate(0, ${i * 15})`)
        .each(function (d) {
            const g = d3.select(this);
            g.append('rect')
                .attr('width', 10)
                .attr('height', 10)
                .attr('fill', d.color);
            g.append('text')
                .attr('x', 15)
                .attr('y', 8)
                .style('fill', '#e0e0e0')
                .style('font-size', '10px')
                .text(d.text);
        });
}

function createCalendarHeatmap(films) {
    const container = document.getElementById('calendarHeatmapChart');
    container.innerHTML = '';

    // Create a simple calendar heatmap for the year
    const currentYear = selectedYear;
    const daysInYear = [];
    const startDate = new Date(currentYear, 0, 1);
    const endDate = new Date(currentYear, 11, 31);

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const filmCount = films.filter(film =>
            film.watchedDate &&
            film.watchedDate.toDateString() === d.toDateString()
        ).length;

        daysInYear.push({
            date: new Date(d),
            count: filmCount,
            month: d.getMonth(),
            day: d.getDate()
        });
    }

    const chartHTML = `
        <div style="text-align: center; padding: 20px; background: #2d2d2d; border-radius: 8px;">
            <h4 style="color: #007bff; margin-bottom: 15px;">${currentYear} Viewing Calendar</h4>
            <div style="font-size: 0.9em; color: #888; margin-bottom: 15px;">
                Each square represents a day. Darker = more films watched.
            </div>
            <div style="display: grid; grid-template-columns: repeat(53, 1fr); gap: 1px; max-width: 800px; margin: 0 auto;">
                ${daysInYear.map(day => `
                    <div style="
                        width: 10px;
                        height: 10px;
                        background: ${day.count === 0 ? '#333' :
                                   day.count === 1 ? '#1a4a2a' :
                                   day.count === 2 ? '#2a6a3a' :
                                   '#28a745'};
                        border-radius: 1px;
                    " title="${day.date.toLocaleDateString()}: ${day.count} film${day.count !== 1 ? 's' : ''}"></div>
                `).join('')}
            </div>
            <div style="display: flex; justify-content: center; gap: 20px; margin-top: 15px; font-size: 0.8em; color: #888;">
                <div>Less</div>
                <div style="width: 15px; height: 15px; background: #333; border-radius: 2px;"></div>
                <div style="width: 15px; height: 15px; background: #1a4a2a; border-radius: 2px;"></div>
                <div style="width: 15px; height: 15px; background: #2a6a3a; border-radius: 2px;"></div>
                <div style="width: 15px; height: 15px; background: #28a745; border-radius: 2px;"></div>
                <div>More</div>
            </div>
        </div>
    `;

    container.innerHTML = chartHTML;
}
