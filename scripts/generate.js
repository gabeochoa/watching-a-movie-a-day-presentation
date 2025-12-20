#!/usr/bin/env node

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import JSZip from 'jszip';
import Papa from 'papaparse';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const argv = yargs(hideBin(process.argv))
  .option('zip', {
    alias: 'z',
    describe: 'Path to Letterboxd export ZIP file',
    type: 'string',
    demandOption: true
  })
  .option('output', {
    alias: 'o',
    describe: 'Output directory for generated site',
    type: 'string',
    default: 'dist'
  })
  .help()
  .argv;

async function main() {
  const zipPath = argv.zip;
  const outputDir = argv.output;

  console.log(`🎬 Wrapboxd Static Site Generator`);
  console.log(`📁 Processing ZIP: ${zipPath}`);
  console.log(`📤 Output directory: ${outputDir}`);

  try {
    // Check if ZIP file exists
    if (!await fs.pathExists(zipPath)) {
      throw new Error(`ZIP file not found: ${zipPath}`);
    }

    // Create output directory
    await fs.ensureDir(outputDir);

    // Process ZIP file
    const data = await processZipFile(zipPath);

    // Generate static site
    await generateSite(data, outputDir);

    console.log(`✅ Site generated successfully!`);
    console.log(`🌐 Open ${path.join(outputDir, 'index.html')} in your browser`);

  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

async function processZipFile(zipPath) {
  console.log(`📦 Extracting ZIP file...`);

  const zipData = await fs.readFile(zipPath);
  const zip = await JSZip.loadAsync(zipData);

  const csvFiles = {};
  const allowedFiles = [
    'diary.csv',
    'reviews.csv',
    'watched.csv',
    'ratings.csv',
    'profile.csv',
    'watchlist.csv'
  ];

  // Extract allowed CSV files
  for (const filename of allowedFiles) {
    if (zip.files[filename]) {
      console.log(`  📄 Found: ${filename}`);
      const content = await zip.files[filename].async('text');
      csvFiles[filename] = Papa.parse(content, {
        header: true,
        skipEmptyLines: true
      }).data;
    }
  }

  if (!csvFiles['diary.csv']) {
    throw new Error('diary.csv not found in ZIP file. This is required for analysis.');
  }

  console.log(`📊 Processing data...`);

  // Process the data
  const processedData = processData(csvFiles);

  return processedData;
}

function processData(csvFiles) {
  const diary = csvFiles['diary.csv'] || [];
  const reviews = csvFiles['reviews.csv'] || [];
  const ratings = csvFiles['ratings.csv'] || [];
  const profile = csvFiles['profile.csv'] || [];

  console.log(`  📈 Diary entries: ${diary.length}`);
  console.log(`  📝 Reviews: ${reviews.length}`);
  console.log(`  ⭐ Ratings: ${ratings.length}`);

  // Basic data validation and processing
  const films = processFilms(diary, reviews);
  const stats = calculateStats(films);
  const charts = generateChartData(films);

  return {
    films,
    stats,
    charts,
    raw: csvFiles
  };
}

function processFilms(diary, reviews) {
  // Merge diary and reviews data
  const films = [];

  // Process diary entries
  diary.forEach(entry => {
    const film = {
      title: entry.Name,
      year: parseInt(entry.Year),
      letterboxdUri: entry['Letterboxd URI'],
      rating: entry.Rating ? parseInt(entry.Rating) : null,
      rewatch: entry.Rewatch === 'Yes',
      tags: entry.Tags ? entry.Tags.split(',').map(tag => tag.trim()) : [],
      watchedDate: entry['Watched Date'] ? new Date(entry['Watched Date']) : null,
      diaryDate: new Date(entry.Date)
    };

    films.push(film);
  });

  // Merge review text if available
  reviews.forEach(review => {
    const existingFilm = films.find(f =>
      f.title === review.Name &&
      f.year === parseInt(review.Year)
    );

    if (existingFilm && review.Review) {
      existingFilm.review = review.Review;
    }
  });

  return films;
}

function calculateStats(films) {
  const ratedFilms = films.filter(f => f.rating !== null);

  return {
    totalFilms: films.length,
    ratedFilms: ratedFilms.length,
    averageRating: ratedFilms.length > 0
      ? ratedFilms.reduce((sum, f) => sum + f.rating, 0) / ratedFilms.length
      : 0,
    rewatches: films.filter(f => f.rewatch).length,
    uniqueTags: [...new Set(films.flatMap(f => f.tags))].filter(tag => tag.length > 0)
  };
}

function generateChartData(films) {
  return {
    ratingDistribution: generateRatingDistribution(films),
    releaseYearDistribution: generateReleaseYearDistribution(films),
    decadeDistribution: generateDecadeDistribution(films),
    monthlyViewing: generateMonthlyViewing(films),
    topGenres: generateTopGenres(films),
    directorAnalysis: generateDirectorAnalysis(films),
    rewatchPatterns: generateRewatchPatterns(films)
  };
}

function generateRatingDistribution(films) {
  const ratedFilms = films.filter(f => f.rating !== null);
  const distribution = {};

  // Initialize all ratings 1-5
  for (let i = 1; i <= 5; i++) {
    distribution[i] = 0;
  }

  ratedFilms.forEach(film => {
    distribution[film.rating] = (distribution[film.rating] || 0) + 1;
  });

  return Object.entries(distribution).map(([rating, count]) => ({
    rating: parseInt(rating),
    count,
    percentage: (count / ratedFilms.length * 100).toFixed(1)
  }));
}

function generateReleaseYearDistribution(films) {
  const yearCounts = {};

  films.forEach(film => {
    if (film.year) {
      yearCounts[film.year] = (yearCounts[film.year] || 0) + 1;
    }
  });

  return Object.entries(yearCounts)
    .map(([year, count]) => ({ year: parseInt(year), count }))
    .sort((a, b) => a.year - b.year);
}

function generateDecadeDistribution(films) {
  const decadeCounts = {};

  films.forEach(film => {
    if (film.year) {
      const decade = Math.floor(film.year / 10) * 10;
      decadeCounts[decade] = (decadeCounts[decade] || 0) + 1;
    }
  });

  return Object.entries(decadeCounts)
    .map(([decade, count]) => ({
      decade: parseInt(decade),
      label: `${decade}s`,
      count
    }))
    .sort((a, b) => a.decade - b.decade);
}

function generateMonthlyViewing(films) {
  const monthly = {};

  // Initialize months
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                     'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  monthNames.forEach(month => {
    monthly[month] = 0;
  });

  films.forEach(film => {
    if (film.watchedDate) {
      const month = monthNames[film.watchedDate.getMonth()];
      monthly[month]++;
    }
  });

  return Object.entries(monthly).map(([month, count]) => ({ month, count }));
}

function generateTopGenres(films) {
  // For now, extract genres from tags (this could be enhanced with TMDB data later)
  const genreCounts = {};

  // Common genre keywords to look for
  const genreKeywords = [
    'drama', 'comedy', 'action', 'thriller', 'horror', 'romance',
    'sci-fi', 'science fiction', 'fantasy', 'documentary', 'animation',
    'adventure', 'crime', 'mystery', 'western', 'musical', 'biography',
    'war', 'history', 'family', 'sport'
  ];

  films.forEach(film => {
    film.tags.forEach(tag => {
      const lowerTag = tag.toLowerCase();
      // Check if tag contains genre keywords or is a known genre
      const matchedGenre = genreKeywords.find(genre =>
        lowerTag.includes(genre) || genre.includes(lowerTag)
      );
      if (matchedGenre) {
        // Normalize genre names
        const normalizedGenre = matchedGenre.charAt(0).toUpperCase() + matchedGenre.slice(1);
        genreCounts[normalizedGenre] = (genreCounts[normalizedGenre] || 0) + 1;
      }
    });
  });

  // If no genres found from tags, create a fallback with basic categorization
  if (Object.keys(genreCounts).length === 0) {
    genreCounts['Uncategorized'] = films.length;
  }

  return Object.entries(genreCounts)
    .map(([genre, count]) => ({ genre, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

function generateDirectorAnalysis(films) {
  // This would need TMDB data for actual directors
  // For now, return a placeholder
  return [];
}

function generateRewatchPatterns(films) {
  const rewatches = films.filter(f => f.rewatch);
  const byRating = {};

  rewatches.forEach(film => {
    if (film.rating) {
      byRating[film.rating] = (byRating[film.rating] || 0) + 1;
    }
  });

  return Object.entries(byRating)
    .map(([rating, count]) => ({ rating: parseInt(rating), count }))
    .sort((a, b) => a.rating - b.rating);
}

async function generateSite(data, outputDir) {
  console.log(`🎨 Generating static site...`);

  // Copy template files
  const templateDir = path.join(__dirname, '..', 'public');
  if (await fs.pathExists(templateDir)) {
    await fs.copy(templateDir, outputDir);
  }

  // Generate main HTML file
  const htmlContent = generateHTML(data);
  await fs.writeFile(path.join(outputDir, 'index.html'), htmlContent);

  // Generate data file for charts
  const dataContent = `window.wrapboxdData = ${JSON.stringify(data, null, 2)};`;
  await fs.writeFile(path.join(outputDir, 'data.js'), dataContent);
}

function generateHTML(data) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Wrapboxd - Your Movie Year in Review</title>
  <script src="https://d3js.org/d3.v7.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      margin: 0;
      padding: 20px;
      background: #f5f5f5;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 8px;
      padding: 30px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    h1 {
      text-align: center;
      color: #2c3e50;
      margin-bottom: 30px;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 40px;
    }
    .stat-card {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
    }
    .stat-number {
      font-size: 2em;
      font-weight: bold;
      color: #3498db;
    }
    .stat-label {
      color: #7f8c8d;
      margin-top: 5px;
    }
    .chart-container {
      margin: 40px 0;
      padding: 20px;
      background: #f8f9fa;
      border-radius: 8px;
    }
    .chart-title {
      font-size: 1.5em;
      margin-bottom: 20px;
      color: #2c3e50;
    }
    .chart-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
      gap: 30px;
    }
    .chart-wrapper {
      background: white;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🎬 Your Movie Year in Review</h1>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-number">${data.stats.totalFilms}</div>
        <div class="stat-label">Total Films</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">${data.stats.ratedFilms}</div>
        <div class="stat-label">Rated Films</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">${data.stats.averageRating.toFixed(1)}</div>
        <div class="stat-label">Average Rating</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">${data.stats.rewatches}</div>
        <div class="stat-label">Rewatches</div>
      </div>
    </div>

    <div class="chart-grid" id="charts">
      ${generateChartHTML(data.charts)}
    </div>
  </div>

  <script src="data.js"></script>
  <script>
    ${generateChartScripts(data.charts)}
  </script>
</body>
</html>`;
}

function generateChartHTML(charts) {
  return `
    <div class="chart-wrapper">
      <h3>Rating Distribution</h3>
      <canvas id="ratingChart" width="400" height="300"></canvas>
    </div>

    <div class="chart-wrapper">
      <h3>Decade Distribution</h3>
      <canvas id="decadeChart" width="400" height="300"></canvas>
    </div>

    <div class="chart-wrapper">
      <h3>Monthly Viewing Activity</h3>
      <canvas id="monthlyChart" width="400" height="300"></canvas>
    </div>

    <div class="chart-wrapper">
      <h3>Top Genres</h3>
      <canvas id="genreChart" width="400" height="300"></canvas>
    </div>

    <div class="chart-wrapper">
      <h3>Release Year Timeline</h3>
      <canvas id="yearChart" width="400" height="300"></canvas>
    </div>

    <div class="chart-wrapper">
      <h3>Rewatch Patterns</h3>
      <canvas id="rewatchChart" width="400" height="300"></canvas>
    </div>
  `;
}

function generateChartScripts(charts) {
  const recentYears = charts.releaseYearDistribution.slice(-15); // Last 15 years

  return `
    document.addEventListener('DOMContentLoaded', function() {
      // Rating Distribution Chart
      const ratingCtx = document.getElementById('ratingChart').getContext('2d');
      new Chart(ratingCtx, {
        type: 'bar',
        data: {
          labels: ${JSON.stringify(charts.ratingDistribution.map(d => d.rating + ' ⭐'))},
          datasets: [{
            label: 'Films',
            data: ${JSON.stringify(charts.ratingDistribution.map(d => d.count))},
            backgroundColor: 'rgba(54, 162, 235, 0.6)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          scales: {
            y: { beginAtZero: true }
          }
        }
      });

      // Decade Distribution Chart
      const decadeCtx = document.getElementById('decadeChart').getContext('2d');
      new Chart(decadeCtx, {
        type: 'pie',
        data: {
          labels: ${JSON.stringify(charts.decadeDistribution.map(d => d.label))},
          datasets: [{
            data: ${JSON.stringify(charts.decadeDistribution.map(d => d.count))},
            backgroundColor: [
              'rgba(255, 99, 132, 0.6)',
              'rgba(54, 162, 235, 0.6)',
              'rgba(255, 205, 86, 0.6)',
              'rgba(75, 192, 192, 0.6)',
              'rgba(153, 102, 255, 0.6)',
              'rgba(255, 159, 64, 0.6)',
              'rgba(199, 199, 199, 0.6)',
              'rgba(83, 102, 255, 0.6)',
              'rgba(255, 99, 255, 0.6)',
              'rgba(99, 255, 132, 0.6)'
            ]
          }]
        },
        options: {
          responsive: true
        }
      });

      // Monthly Viewing Chart
      const monthlyCtx = document.getElementById('monthlyChart').getContext('2d');
      new Chart(monthlyCtx, {
        type: 'line',
        data: {
          labels: ${JSON.stringify(charts.monthlyViewing.map(d => d.month))},
          datasets: [{
            label: 'Films Watched',
            data: ${JSON.stringify(charts.monthlyViewing.map(d => d.count))},
            backgroundColor: 'rgba(75, 192, 192, 0.6)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 2,
            fill: true
          }]
        },
        options: {
          responsive: true,
          scales: {
            y: { beginAtZero: true }
          }
        }
      });

      // Top Genres Chart
      const genreCtx = document.getElementById('genreChart').getContext('2d');
      new Chart(genreCtx, {
        type: 'bar',
        data: {
          labels: ${JSON.stringify(charts.topGenres.map(d => d.genre))},
          datasets: [{
            label: 'Films',
            data: ${JSON.stringify(charts.topGenres.map(d => d.count))},
            backgroundColor: 'rgba(255, 159, 64, 0.6)',
            borderColor: 'rgba(255, 159, 64, 1)',
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          scales: {
            y: { beginAtZero: true }
          }
        }
      });

      // Release Year Timeline Chart
      const yearCtx = document.getElementById('yearChart').getContext('2d');
      new Chart(yearCtx, {
        type: 'bar',
        data: {
          labels: ${JSON.stringify(recentYears.map(d => d.year))},
          datasets: [{
            label: 'Films',
            data: ${JSON.stringify(recentYears.map(d => d.count))},
            backgroundColor: 'rgba(255, 99, 132, 0.6)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          scales: {
            y: { beginAtZero: true }
          }
        }
      });

      // Rewatch Patterns Chart
      const rewatchCtx = document.getElementById('rewatchChart').getContext('2d');
      new Chart(rewatchCtx, {
        type: 'doughnut',
        data: {
          labels: ${JSON.stringify(charts.rewatchPatterns.map(d => d.rating + ' ⭐'))},
          datasets: [{
            data: ${JSON.stringify(charts.rewatchPatterns.map(d => d.count))},
            backgroundColor: [
              'rgba(255, 99, 132, 0.6)',
              'rgba(54, 162, 235, 0.6)',
              'rgba(255, 205, 86, 0.6)',
              'rgba(75, 192, 192, 0.6)',
              'rgba(153, 102, 255, 0.6)'
            ]
          }]
        },
        options: {
          responsive: true
        }
      });
    });
  `;
}

// Run the generator
main();
