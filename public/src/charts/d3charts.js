function clearSvg(svg) {
  while (svg.firstChild) svg.removeChild(svg.firstChild);
}

function sizeFromSvg(svg) {
  const rect = svg.getBoundingClientRect();
  const width = Math.max(320, rect.width || 0);
  const height = Number(svg.getAttribute("height")) || 260;
  return { width, height };
}

export function renderBarChart(svgEl, data, { xKey, yKey, xLabelFormatter } = {}) {
  const d3 = window.d3;
  if (!d3) throw new Error("D3 not loaded.");

  clearSvg(svgEl);
  const { width, height } = sizeFromSvg(svgEl);
  const margin = { top: 10, right: 10, bottom: 28, left: 36 };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;

  const svg = d3.select(svgEl).attr("viewBox", `0 0 ${width} ${height}`);
  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3
    .scaleBand()
    .domain(data.map((d) => String(d[xKey])))
    .range([0, innerW])
    .padding(0.2);

  const y = d3
    .scaleLinear()
    .domain([0, d3.max(data, (d) => d[yKey]) || 0])
    .nice()
    .range([innerH, 0]);

  g.append("g")
    .attr("transform", `translate(0,${innerH})`)
    .call(
      d3
        .axisBottom(x)
        .tickFormat((v) => (xLabelFormatter ? xLabelFormatter(v) : v))
        .tickSizeOuter(0),
    )
    .selectAll("text")
    .attr("fill", "#a0a6b3")
    .attr("font-size", 10);

  g.append("g")
    .call(d3.axisLeft(y).ticks(5).tickSizeOuter(0))
    .selectAll("text")
    .attr("fill", "#a0a6b3")
    .attr("font-size", 10);

  g.selectAll(".domain,.tick line").attr("stroke", "#26304a");

  g.selectAll("rect")
    .data(data)
    .enter()
    .append("rect")
    .attr("x", (d) => x(String(d[xKey])))
    .attr("y", (d) => y(d[yKey]))
    .attr("width", x.bandwidth())
    .attr("height", (d) => innerH - y(d[yKey]))
    .attr("rx", 3)
    .attr("fill", "#2b56a5");
}

export function renderHorizontalBarChart(
  svgEl,
  data,
  { xKey, yKey, maxBars = 15, valueFormatter } = {},
) {
  const d3 = window.d3;
  if (!d3) throw new Error("D3 not loaded.");

  clearSvg(svgEl);
  const { width, height } = sizeFromSvg(svgEl);
  const margin = { top: 10, right: 10, bottom: 18, left: 140 };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;

  const trimmed = [...data].sort((a, b) => b[xKey] - a[xKey]).slice(0, maxBars);

  const svg = d3.select(svgEl).attr("viewBox", `0 0 ${width} ${height}`);
  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  const y = d3
    .scaleBand()
    .domain(trimmed.map((d) => String(d[yKey])))
    .range([0, innerH])
    .padding(0.2);

  const x = d3
    .scaleLinear()
    .domain([0, d3.max(trimmed, (d) => d[xKey]) || 0])
    .nice()
    .range([0, innerW]);

  g.append("g")
    .call(d3.axisLeft(y).tickSizeOuter(0))
    .selectAll("text")
    .attr("fill", "#a0a6b3")
    .attr("font-size", 10);

  g.append("g")
    .attr("transform", `translate(0,${innerH})`)
    .call(d3.axisBottom(x).ticks(5).tickSizeOuter(0))
    .selectAll("text")
    .attr("fill", "#a0a6b3")
    .attr("font-size", 10);

  g.selectAll(".domain,.tick line").attr("stroke", "#26304a");

  g.selectAll("rect")
    .data(trimmed)
    .enter()
    .append("rect")
    .attr("y", (d) => y(String(d[yKey])))
    .attr("x", 0)
    .attr("height", y.bandwidth())
    .attr("width", (d) => x(d[xKey]))
    .attr("rx", 3)
    .attr("fill", "#2b56a5");

  g.selectAll("text.value")
    .data(trimmed)
    .enter()
    .append("text")
    .attr("class", "value")
    .attr("x", (d) => x(d[xKey]) + 6)
    .attr("y", (d) => y(String(d[yKey])) + y.bandwidth() / 2 + 4)
    .attr("fill", "#a0a6b3")
    .attr("font-size", 10)
    .text((d) => (valueFormatter ? valueFormatter(d[xKey]) : String(d[xKey])));
}

export function renderLineChart(svgEl, data, { xKey, yKey } = {}) {
  const d3 = window.d3;
  if (!d3) throw new Error("D3 not loaded.");

  clearSvg(svgEl);
  const { width, height } = sizeFromSvg(svgEl);
  const margin = { top: 10, right: 10, bottom: 28, left: 36 };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;

  const svg = d3.select(svgEl).attr("viewBox", `0 0 ${width} ${height}`);
  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3
    .scalePoint()
    .domain(data.map((d) => String(d[xKey])))
    .range([0, innerW]);

  const y = d3
    .scaleLinear()
    .domain([0, d3.max(data, (d) => d[yKey]) || 0])
    .nice()
    .range([innerH, 0]);

  g.append("g")
    .attr("transform", `translate(0,${innerH})`)
    .call(d3.axisBottom(x).ticks(6).tickSizeOuter(0))
    .selectAll("text")
    .attr("fill", "#a0a6b3")
    .attr("font-size", 10);

  g.append("g")
    .call(d3.axisLeft(y).ticks(5).tickSizeOuter(0))
    .selectAll("text")
    .attr("fill", "#a0a6b3")
    .attr("font-size", 10);

  g.selectAll(".domain,.tick line").attr("stroke", "#26304a");

  const line = d3
    .line()
    .x((d) => x(String(d[xKey])))
    .y((d) => y(d[yKey]));

  g.append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", "#2b56a5")
    .attr("stroke-width", 2)
    .attr("d", line);

  g.selectAll("circle")
    .data(data)
    .enter()
    .append("circle")
    .attr("cx", (d) => x(String(d[xKey])))
    .attr("cy", (d) => y(d[yKey]))
    .attr("r", 2.5)
    .attr("fill", "#6ea8ff");
}

