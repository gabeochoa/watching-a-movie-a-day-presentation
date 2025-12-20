/**
 * Wrapboxd Chart Rendering for Reveal.js
 * 
 * D3-based chart rendering optimized for presentation slides.
 * Charts are styled according to the Gen Z aesthetic.
 */

(function() {
  'use strict';
  
  const COLORS = {
    primary: '#FF3B30',
    secondary: '#FFD60A',
    tertiary: '#30D158',
    muted: '#333333',
    text: '#FFFFFF',
    textMuted: '#888888',
    textSubtle: '#555555',
    grid: 'rgba(255, 255, 255, 0.05)',
    axis: 'rgba(255, 255, 255, 0.1)',
  };
  
  const FONT = {
    display: "'Anton', Impact, sans-serif",
    body: "'Inter', sans-serif",
    mono: "'JetBrains Mono', monospace",
  };

  /**
   * Main render function - dispatches to specific chart types
   */
  window.renderChart = function(el) {
    const chartType = el.dataset.chart;
    const dataKey = el.dataset.key;
    const data = window.WRAPBOXD_DATA;
    
    if (!data || !chartType) {
      console.warn('Missing data or chart type', { chartType, dataKey });
      return;
    }
    
    // Get the specific data for this chart
    let chartData;
    if (dataKey) {
      chartData = getNestedValue(data, dataKey);
    }
    
    // Clear any existing content
    el.innerHTML = '';
    
    switch (chartType) {
      case 'ratings-histogram':
        renderRatingsHistogram(el, chartData || data.computedAll?.series?.ratingsHistogram);
        break;
      case 'watches-by-month':
        renderWatchesByMonth(el, chartData || data.computedAll?.series?.watchesByMonth);
        break;
      case 'release-years':
        renderReleaseYears(el, chartData || data.computedAll?.series?.releaseYears);
        break;
      case 'top-directors':
        renderHorizontalBar(el, chartData || data.enrichedAll?.topDirectors, { maxBars: 10 });
        break;
      case 'top-genres':
        renderHorizontalBar(el, chartData || data.enrichedAll?.topGenres, { maxBars: 8 });
        break;
      case 'weekdays':
        renderWeekdays(el, chartData || data.computedAll?.series?.watchesByWeekday);
        break;
      case 'rating-by-year':
        renderLineChart(el, chartData || data.computedAll?.series?.avgRatingByMonth);
        break;
      case 'cumulative':
        renderAreaChart(el, chartData || data.computedAll?.series?.cumulativeWatches);
        break;
      case 'runtime-dist':
        renderRuntimeDist(el, chartData || data.enrichedAll?.runtimeBins);
        break;
      default:
        console.warn('Unknown chart type:', chartType);
    }
  };
  
  function getNestedValue(obj, path) {
    return path.split('.').reduce((o, k) => (o || {})[k], obj);
  }

  /**
   * Ratings Histogram - The "You're a ★★★★ person" chart
   */
  function renderRatingsHistogram(container, data) {
    if (!data || !data.length) return renderEmptyState(container, 'No rating data');
    
    const rect = container.getBoundingClientRect();
    const width = rect.width || 1600;
    const height = rect.height || 600;
    const margin = { top: 40, right: 40, bottom: 80, left: 60 };
    
    const svg = d3.select(container)
      .append('svg')
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');
    
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Find the highest count for highlighting
    const maxCount = d3.max(data, d => d.count);
    const highlightRating = data.find(d => d.count === maxCount)?.rating;
    
    const x = d3.scaleBand()
      .domain(data.map(d => d.rating))
      .range([0, innerWidth])
      .padding(0.3);
    
    const y = d3.scaleLinear()
      .domain([0, maxCount * 1.1])
      .range([innerHeight, 0]);
    
    // Bars
    g.selectAll('.bar')
      .data(data)
      .join('rect')
      .attr('class', d => `chart-bar ${d.rating === highlightRating ? 'highlight' : ''}`)
      .attr('x', d => x(d.rating))
      .attr('y', d => y(d.count))
      .attr('width', x.bandwidth())
      .attr('height', d => innerHeight - y(d.count))
      .attr('rx', 4);
    
    // Value labels on bars
    g.selectAll('.label')
      .data(data)
      .join('text')
      .attr('class', 'chart-label')
      .attr('x', d => x(d.rating) + x.bandwidth() / 2)
      .attr('y', d => y(d.count) - 12)
      .attr('text-anchor', 'middle')
      .text(d => d.count > 0 ? d.count : '');
    
    // X axis - rating labels with stars
    g.append('g')
      .attr('class', 'chart-axis')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x).tickSize(0))
      .call(g => g.select('.domain').remove())
      .selectAll('text')
      .attr('dy', '1.5em')
      .style('font-size', '28px')
      .text(d => '★'.repeat(d));
  }

  /**
   * Watches by Month - Timeline bar chart
   */
  function renderWatchesByMonth(container, data) {
    if (!data || !data.length) return renderEmptyState(container, 'No watch data');
    
    const rect = container.getBoundingClientRect();
    const width = rect.width || 1600;
    const height = rect.height || 600;
    const margin = { top: 40, right: 40, bottom: 80, left: 80 };
    
    const svg = d3.select(container)
      .append('svg')
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');
    
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Use last 12 months if more data
    const displayData = data.slice(-12);
    const maxCount = d3.max(displayData, d => d.count);
    const highlightMonth = displayData.find(d => d.count === maxCount)?.yearMonth;
    
    const x = d3.scaleBand()
      .domain(displayData.map(d => d.yearMonth))
      .range([0, innerWidth])
      .padding(0.2);
    
    const y = d3.scaleLinear()
      .domain([0, maxCount * 1.15])
      .range([innerHeight, 0]);
    
    // Bars
    g.selectAll('.bar')
      .data(displayData)
      .join('rect')
      .attr('class', d => `chart-bar ${d.yearMonth === highlightMonth ? 'highlight' : ''}`)
      .attr('x', d => x(d.yearMonth))
      .attr('y', d => y(d.count))
      .attr('width', x.bandwidth())
      .attr('height', d => innerHeight - y(d.count))
      .attr('rx', 4);
    
    // Value labels
    g.selectAll('.label')
      .data(displayData)
      .join('text')
      .attr('class', 'chart-label')
      .attr('x', d => x(d.yearMonth) + x.bandwidth() / 2)
      .attr('y', d => y(d.count) - 12)
      .attr('text-anchor', 'middle')
      .text(d => d.count > 0 ? d.count : '');
    
    // X axis
    g.append('g')
      .attr('class', 'chart-axis')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x).tickSize(0))
      .call(g => g.select('.domain').remove())
      .selectAll('text')
      .attr('dy', '1.5em')
      .attr('transform', 'rotate(-45)')
      .style('text-anchor', 'end')
      .text(d => d.slice(2)); // YY-MM format
  }

  /**
   * Release Years - Decade distribution
   */
  function renderReleaseYears(container, data) {
    if (!data || !data.length) return renderEmptyState(container, 'No release year data');
    
    const rect = container.getBoundingClientRect();
    const width = rect.width || 1600;
    const height = rect.height || 600;
    const margin = { top: 40, right: 40, bottom: 80, left: 80 };
    
    const svg = d3.select(container)
      .append('svg')
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');
    
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Group by decade
    const decadeData = new Map();
    data.forEach(d => {
      const decade = Math.floor(d.year / 10) * 10;
      const label = `${decade}s`;
      decadeData.set(label, (decadeData.get(label) || 0) + d.count);
    });
    
    const decades = Array.from(decadeData.entries())
      .map(([decade, count]) => ({ decade, count }))
      .sort((a, b) => parseInt(a.decade) - parseInt(b.decade));
    
    const maxCount = d3.max(decades, d => d.count);
    const highlightDecade = decades.find(d => d.count === maxCount)?.decade;
    
    const x = d3.scaleBand()
      .domain(decades.map(d => d.decade))
      .range([0, innerWidth])
      .padding(0.3);
    
    const y = d3.scaleLinear()
      .domain([0, maxCount * 1.15])
      .range([innerHeight, 0]);
    
    // Bars
    g.selectAll('.bar')
      .data(decades)
      .join('rect')
      .attr('class', d => `chart-bar ${d.decade === highlightDecade ? 'highlight' : ''}`)
      .attr('x', d => x(d.decade))
      .attr('y', d => y(d.count))
      .attr('width', x.bandwidth())
      .attr('height', d => innerHeight - y(d.count))
      .attr('rx', 4);
    
    // Labels
    g.selectAll('.label')
      .data(decades)
      .join('text')
      .attr('class', 'chart-label')
      .attr('x', d => x(d.decade) + x.bandwidth() / 2)
      .attr('y', d => y(d.count) - 12)
      .attr('text-anchor', 'middle')
      .text(d => d.count);
    
    // X axis
    g.append('g')
      .attr('class', 'chart-axis')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x).tickSize(0))
      .call(g => g.select('.domain').remove())
      .selectAll('text')
      .attr('dy', '1.5em')
      .style('font-size', '28px');
  }

  /**
   * Horizontal Bar Chart - For top directors, genres, etc.
   */
  function renderHorizontalBar(container, data, { maxBars = 10 } = {}) {
    if (!data || !data.length) return renderEmptyState(container, 'No data available');
    
    const displayData = data.slice(0, maxBars);
    
    const rect = container.getBoundingClientRect();
    const width = rect.width || 1600;
    const height = rect.height || 600;
    const margin = { top: 20, right: 100, bottom: 20, left: 300 };
    
    const svg = d3.select(container)
      .append('svg')
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');
    
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);
    
    const maxCount = d3.max(displayData, d => d.count);
    
    const y = d3.scaleBand()
      .domain(displayData.map(d => d.name))
      .range([0, innerHeight])
      .padding(0.3);
    
    const x = d3.scaleLinear()
      .domain([0, maxCount * 1.1])
      .range([0, innerWidth]);
    
    // Bars
    g.selectAll('.bar')
      .data(displayData)
      .join('rect')
      .attr('class', (d, i) => `chart-bar ${i === 0 ? 'highlight' : ''}`)
      .attr('x', 0)
      .attr('y', d => y(d.name))
      .attr('width', d => x(d.count))
      .attr('height', y.bandwidth())
      .attr('rx', 4);
    
    // Labels (names)
    g.selectAll('.name-label')
      .data(displayData)
      .join('text')
      .attr('class', 'chart-label')
      .attr('x', -16)
      .attr('y', d => y(d.name) + y.bandwidth() / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', 'end')
      .style('fill', COLORS.text)
      .text(d => d.name.length > 25 ? d.name.slice(0, 22) + '...' : d.name);
    
    // Count labels
    g.selectAll('.count-label')
      .data(displayData)
      .join('text')
      .attr('class', 'chart-label')
      .attr('x', d => x(d.count) + 16)
      .attr('y', d => y(d.name) + y.bandwidth() / 2)
      .attr('dy', '0.35em')
      .style('fill', COLORS.textMuted)
      .text(d => d.count);
  }

  /**
   * Weekday Distribution
   */
  function renderWeekdays(container, data) {
    if (!data || !data.length) return renderEmptyState(container, 'No weekday data');
    
    const rect = container.getBoundingClientRect();
    const width = rect.width || 1600;
    const height = rect.height || 600;
    const margin = { top: 40, right: 40, bottom: 80, left: 60 };
    
    const svg = d3.select(container)
      .append('svg')
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');
    
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);
    
    const maxCount = d3.max(data, d => d.count);
    const highlightDay = data.find(d => d.count === maxCount)?.weekday;
    
    const x = d3.scaleBand()
      .domain(data.map(d => d.weekday))
      .range([0, innerWidth])
      .padding(0.3);
    
    const y = d3.scaleLinear()
      .domain([0, maxCount * 1.15])
      .range([innerHeight, 0]);
    
    // Bars
    g.selectAll('.bar')
      .data(data)
      .join('rect')
      .attr('class', d => `chart-bar ${d.weekday === highlightDay ? 'highlight' : ''}`)
      .attr('x', d => x(d.weekday))
      .attr('y', d => y(d.count))
      .attr('width', x.bandwidth())
      .attr('height', d => innerHeight - y(d.count))
      .attr('rx', 4);
    
    // Labels
    g.selectAll('.label')
      .data(data)
      .join('text')
      .attr('class', 'chart-label')
      .attr('x', d => x(d.weekday) + x.bandwidth() / 2)
      .attr('y', d => y(d.count) - 12)
      .attr('text-anchor', 'middle')
      .text(d => d.count);
    
    // X axis
    g.append('g')
      .attr('class', 'chart-axis')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x).tickSize(0))
      .call(g => g.select('.domain').remove())
      .selectAll('text')
      .attr('dy', '1.5em')
      .style('font-size', '28px');
  }

  /**
   * Line Chart - For trends over time
   */
  function renderLineChart(container, data) {
    if (!data || !data.length) return renderEmptyState(container, 'No trend data');
    
    const rect = container.getBoundingClientRect();
    const width = rect.width || 1600;
    const height = rect.height || 600;
    const margin = { top: 40, right: 40, bottom: 80, left: 80 };
    
    const svg = d3.select(container)
      .append('svg')
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');
    
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Use last 12 data points
    const displayData = data.slice(-12);
    
    const x = d3.scalePoint()
      .domain(displayData.map(d => d.yearMonth))
      .range([0, innerWidth]);
    
    const yKey = displayData[0].avgRating !== undefined ? 'avgRating' : 'value';
    const yExtent = d3.extent(displayData, d => d[yKey]);
    const yPadding = (yExtent[1] - yExtent[0]) * 0.1 || 0.5;
    
    const y = d3.scaleLinear()
      .domain([yExtent[0] - yPadding, yExtent[1] + yPadding])
      .range([innerHeight, 0]);
    
    // Line
    const line = d3.line()
      .x(d => x(d.yearMonth))
      .y(d => y(d[yKey]))
      .curve(d3.curveMonotoneX);
    
    g.append('path')
      .datum(displayData)
      .attr('class', 'chart-line')
      .attr('d', line);
    
    // Dots
    g.selectAll('.dot')
      .data(displayData)
      .join('circle')
      .attr('class', 'chart-dot')
      .attr('cx', d => x(d.yearMonth))
      .attr('cy', d => y(d[yKey]))
      .attr('r', 8);
    
    // X axis
    g.append('g')
      .attr('class', 'chart-axis')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x).tickSize(0))
      .call(g => g.select('.domain').attr('stroke', COLORS.axis))
      .selectAll('text')
      .attr('dy', '1.5em')
      .attr('transform', 'rotate(-45)')
      .style('text-anchor', 'end')
      .text(d => d.slice(2));
    
    // Y axis
    g.append('g')
      .attr('class', 'chart-axis')
      .call(d3.axisLeft(y).ticks(5).tickSize(-innerWidth))
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('.tick line').attr('stroke', COLORS.grid));
  }

  /**
   * Area Chart - For cumulative data
   */
  function renderAreaChart(container, data) {
    if (!data || !data.length) return renderEmptyState(container, 'No cumulative data');
    
    const rect = container.getBoundingClientRect();
    const width = rect.width || 1600;
    const height = rect.height || 600;
    const margin = { top: 40, right: 40, bottom: 80, left: 100 };
    
    const svg = d3.select(container)
      .append('svg')
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');
    
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);
    
    const x = d3.scalePoint()
      .domain(data.map(d => d.yearMonth))
      .range([0, innerWidth]);
    
    const yMax = d3.max(data, d => d.cumulative);
    const y = d3.scaleLinear()
      .domain([0, yMax * 1.05])
      .range([innerHeight, 0]);
    
    // Area
    const area = d3.area()
      .x(d => x(d.yearMonth))
      .y0(innerHeight)
      .y1(d => y(d.cumulative))
      .curve(d3.curveMonotoneX);
    
    g.append('path')
      .datum(data)
      .attr('class', 'chart-area')
      .attr('d', area);
    
    // Line on top
    const line = d3.line()
      .x(d => x(d.yearMonth))
      .y(d => y(d.cumulative))
      .curve(d3.curveMonotoneX);
    
    g.append('path')
      .datum(data)
      .attr('class', 'chart-line')
      .attr('d', line);
    
    // Final value annotation
    const lastPoint = data[data.length - 1];
    g.append('text')
      .attr('class', 'chart-label')
      .attr('x', x(lastPoint.yearMonth) + 16)
      .attr('y', y(lastPoint.cumulative))
      .attr('dy', '0.35em')
      .style('fill', COLORS.primary)
      .style('font-size', '32px')
      .text(lastPoint.cumulative);
  }

  /**
   * Runtime Distribution
   */
  function renderRuntimeDist(container, data) {
    if (!data || !data.length) return renderEmptyState(container, 'No runtime data');
    
    const rect = container.getBoundingClientRect();
    const width = rect.width || 1600;
    const height = rect.height || 600;
    const margin = { top: 40, right: 40, bottom: 80, left: 60 };
    
    const svg = d3.select(container)
      .append('svg')
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');
    
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);
    
    const maxCount = d3.max(data, d => d.count);
    const highlightBin = data.find(d => d.count === maxCount)?.bin;
    
    const x = d3.scaleBand()
      .domain(data.map(d => d.bin))
      .range([0, innerWidth])
      .padding(0.3);
    
    const y = d3.scaleLinear()
      .domain([0, maxCount * 1.15])
      .range([innerHeight, 0]);
    
    // Bars
    g.selectAll('.bar')
      .data(data)
      .join('rect')
      .attr('class', d => `chart-bar ${d.bin === highlightBin ? 'highlight' : ''}`)
      .attr('x', d => x(d.bin))
      .attr('y', d => y(d.count))
      .attr('width', x.bandwidth())
      .attr('height', d => innerHeight - y(d.count))
      .attr('rx', 4);
    
    // Labels
    g.selectAll('.label')
      .data(data)
      .join('text')
      .attr('class', 'chart-label')
      .attr('x', d => x(d.bin) + x.bandwidth() / 2)
      .attr('y', d => y(d.count) - 12)
      .attr('text-anchor', 'middle')
      .text(d => d.count > 0 ? d.count : '');
    
    // X axis
    g.append('g')
      .attr('class', 'chart-axis')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x).tickSize(0))
      .call(g => g.select('.domain').remove())
      .selectAll('text')
      .attr('dy', '1.5em')
      .style('font-size', '24px')
      .text(d => d + ' min');
  }

  /**
   * Empty state placeholder
   */
  function renderEmptyState(container, message) {
    const svg = d3.select(container)
      .append('svg')
      .attr('viewBox', '0 0 800 400')
      .attr('preserveAspectRatio', 'xMidYMid meet');
    
    svg.append('text')
      .attr('x', 400)
      .attr('y', 200)
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .style('fill', COLORS.textMuted)
      .style('font-family', FONT.body)
      .style('font-size', '32px')
      .text(message);
  }

})();
