#!/usr/bin/env node
/**
 * Unified slide sync: generates both grid-view.html and index.html from the slides/ directory.
 *
 * The slides/ directory is the single source of truth. This script:
 * - Scans build/presentation/slides/ for slide-*.html files
 * - Sorts them by filename to determine order
 * - Generates grid-view.html with iframe tiles for each slide
 * - Generates index.html with iframe-based Reveal.js slides (identical rendering)
 */

import path from "node:path";
import { readFile, writeFile, readdir } from "node:fs/promises";

const ROOT = process.cwd();
const SLIDES_DIR = path.join(ROOT, "build", "presentation", "slides");
const GRID_PATH = path.join(ROOT, "build", "presentation", "grid-view.html");
const DECK_PATH = path.join(ROOT, "build", "presentation", "index.html");

// ─────────────────────────────────────────────────────────────────────────────
// Slide file discovery
// ─────────────────────────────────────────────────────────────────────────────

async function getSlideFiles() {
  const files = await readdir(SLIDES_DIR);
  return files
    .filter((f) => /^slide-\d+\.html$/.test(f))
    .sort((a, b) => {
      const numA = parseInt(a.match(/\d+/)[0], 10);
      const numB = parseInt(b.match(/\d+/)[0], 10);
      return numA - numB;
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// Deck (index.html) generation - inlined sections with full CSS
// ─────────────────────────────────────────────────────────────────────────────

function extractFullStyleBlock(html) {
  // Extract the entire <style>...</style> content from a slide file
  const match = html.match(/<style>([\s\S]*?)<\/style>/);
  return match ? match[1] : "";
}

function extractSection(html, filename) {
  const match = html.match(/<section\b[\s\S]*?<\/section>/);
  if (!match) throw new Error(`No <section> found in ${filename}`);
  return match[0];
}

async function generateDeckHtml(slideFiles, slidesDir) {
  // Read the first slide to get the shared CSS
  const firstSlideHtml = await readFile(path.join(slidesDir, slideFiles[0]), "utf8");
  const sharedCss = extractFullStyleBlock(firstSlideHtml);

  // Extract sections from all slides
  const sections = [];
  for (const file of slideFiles) {
    const html = await readFile(path.join(slidesDir, file), "utf8");
    sections.push(extractSection(html, file));
  }

  const sectionsHtml = sections.map(s => `      ${s}`).join("\n\n");

  // Remove thumbnail-only tweaks from CSS (they break the deck layout)
  const deckCss = sharedCss.replace(
    /\/\* Thumbnail-only tweaks \*\/[\s\S]*?#section-indicator \{ display: none !important; \}/,
    "/* Thumbnail-only tweaks removed for deck */"
  );

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My 2025 in Film</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@4.6.0/dist/reveal.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@4.6.0/dist/theme/black.css">
  <style>
${deckCss}
  </style>
</head>
<body>
  <div class="reveal">
    <div class="slides">
${sectionsHtml}
    </div>
  </div>
  <div id="section-indicator"></div>
  <script src="https://cdn.jsdelivr.net/npm/reveal.js@4.6.0/dist/reveal.js"></script>
  <script>
    Reveal.initialize({
      hash: true,
      width: 1920,
      height: 1080,
      margin: 0,
      transition: 'none',
      backgroundTransition: 'none'
    });

    // Section indicator
    const indicator = document.getElementById('section-indicator');
    const sectionLabels = [
      { start: 0, end: 3, label: 'OPENING' },
      { start: 4, end: 9, label: 'THE NUMBERS' },
      { start: 10, end: 17, label: 'HOW I RATE' },
      { start: 18, end: 24, label: 'DISCOVERIES' },
      { start: 25, end: 29, label: 'HOT TAKES' },
      { start: 30, end: 999, label: 'CLOSING' }
    ];

    function updateIndicator(slideIndex) {
      const section = sectionLabels.find(s => slideIndex >= s.start && slideIndex <= s.end);
      indicator.textContent = section ? section.label : '';
    }

    Reveal.on('ready', (event) => updateIndicator(event.indexh));
    Reveal.on('slidechanged', (event) => updateIndicator(event.indexh));
  </script>
</body>
</html>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Grid view generation
// ─────────────────────────────────────────────────────────────────────────────

function generateGridTile(slideFile, deckIndex) {
  const slideNum = parseInt(slideFile.match(/\d+/)[0], 10);
  return `      <a class="tile" href="./index.html#/${deckIndex}" aria-label="Open slide ${slideNum}">
        <div class="tile__frame">
          <iframe loading="lazy" data-src="./slides/${slideFile}" title="Slide ${slideNum}" tabindex="-1"></iframe>
        </div>
        <div class="tile__meta">
          <span class="tile__num">${slideNum}</span>
        </div>
      </a>`;
}

function generateGridHtml(slideFiles) {
  const tiles = slideFiles.map((f, i) => generateGridTile(f, i)).join("\n\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My 2025 in Film - Grid</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #0a0a0a;
      --text: rgba(255,255,255,0.92);
      --muted: rgba(255,255,255,0.6);
      --border: rgba(255,255,255,0.10);
      --shadow: rgba(0,0,0,0.55);
      --blue: #0A84FF;
    }

    * { box-sizing: border-box; }
    html, body { height: 100%; }
    body {
      margin: 0;
      background: var(--bg);
      color: var(--text);
      font-family: 'Inter', system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
    }

    .header {
      position: sticky;
      top: 0;
      z-index: 20;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding: 14px 16px;
      background: rgba(0,0,0,0.78);
      backdrop-filter: blur(10px);
      border-bottom: 1px solid var(--border);
    }

    .title {
      font-family: 'Anton', sans-serif;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      font-size: 18px;
      line-height: 1;
    }
    .meta {
      margin-top: 6px;
      font-size: 12px;
      color: var(--muted);
    }

    .actions { display: flex; align-items: center; gap: 10px; }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 10px;
      font-size: 12px;
      color: var(--text);
      background: rgba(255,255,255,0.06);
      border: 1px solid var(--border);
      border-radius: 10px;
      text-decoration: none;
      white-space: nowrap;
    }
    .btn.primary {
      border-color: rgba(10,132,255,0.45);
      background: rgba(10,132,255,0.10);
      color: #dbeafe;
    }
    .btn:hover { background: rgba(255,255,255,0.10); }
    .btn.primary:hover { background: rgba(10,132,255,0.18); }

    .wrap {
      padding: 16px;
      max-width: 2200px;
      margin: 0 auto;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
      gap: 16px;
      align-items: start;
    }

    .tile {
      display: block;
      text-decoration: none;
      color: inherit;
    }

    .tile__frame {
      position: relative;
      width: 100%;
      aspect-ratio: 16 / 9;
      border-radius: 14px;
      overflow: hidden;
      border: 1px solid var(--border);
      box-shadow: 0 10px 30px var(--shadow);
      background: #000;
    }

    /* The iframe renders a full 1920x1080 deck; scale it down to fit the tile */
    .tile__frame iframe {
      width: 1920px;
      height: 1080px;
      border: 0;
      transform-origin: top left;
      transform: scale(calc(100% / 1920));
      /* Keep it non-interactive; clicking the tile opens the slide */
      pointer-events: none;
    }

    /* Because scale(calc(100%/1920)) is not valid in all browsers, set scale via JS too */
    .tile__frame[data-scale] iframe {
      transform: scale(var(--scale));
    }

    .tile__meta {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 2px 0;
      color: var(--muted);
      font-size: 12px;
    }
    .tile__num {
      font-family: 'JetBrains Mono', monospace;
      color: rgba(255,255,255,0.72);
    }

    .tile:hover .tile__frame {
      border-color: rgba(10,132,255,0.35);
      box-shadow: 0 14px 40px rgba(10,132,255,0.12), 0 10px 30px var(--shadow);
      transform: translateY(-2px);
      transition: transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease;
    }

    @media (max-width: 520px) {
      .grid { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="title">My 2025 in Film — Grid</div>
      <div class="meta">${slideFiles.length} slides • Click a thumbnail to open that slide</div>
    </div>
    <div class="actions">
      <a class="btn primary" href="./index.html">Open presentation →</a>
    </div>
  </div>

  <div class="wrap">
    <div class="grid">

${tiles}
    </div>
  </div>

  <script>
    // Compute a reliable scale factor per tile so the 1920x1080 iframe fits perfectly.
    // This avoids relying on CSS calc() support in transform: scale().
    // Also, keep tile links pointing at the right Reveal slide index even when slides are
    // deleted/reordered in the deck (so we don't have to hand-update dozens of hrefs).
    function syncTileLinks() {
      document.querySelectorAll('.grid .tile').forEach((tile, idx) => {
        tile.setAttribute('href', \`./index.html#/\${idx}\`);
      });
    }

    function updateScales() {
      document.querySelectorAll('.tile__frame').forEach(frame => {
        const w = frame.getBoundingClientRect().width;
        const scale = w / 1920;
        frame.style.setProperty('--scale', scale);
        frame.setAttribute('data-scale', 'true');
      });
    }

    // Lazy-load iframe src so the browser isn't forced to spin up 45 Reveal contexts at once.
    function lazyLoadIframes() {
      const frames = Array.from(document.querySelectorAll('.tile__frame'));

      if (!('IntersectionObserver' in window)) {
        frames.forEach((frame, idx) => {
          const iframe = frame.querySelector('iframe');
          if (!iframe) return;
          const src = iframe.getAttribute('data-src');
          if (!src) return;
          if (idx < 12) iframe.src = src;
          else setTimeout(() => { iframe.src = src; }, 800);
        });
        return;
      }

      const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          const iframe = entry.target.querySelector('iframe');
          if (!iframe) return;
          const src = iframe.getAttribute('data-src');
          if (src && !iframe.src) iframe.src = src;
          io.unobserve(entry.target);
        });
      }, { root: null, rootMargin: '1200px 0px', threshold: 0.01 });

      frames.forEach(frame => io.observe(frame));
    }

    window.addEventListener('resize', () => {
      window.requestAnimationFrame(updateScales);
    });
    syncTileLinks();
    updateScales();
    lazyLoadIframes();
  </script>
</body>
</html>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  // 1. Get sorted list of slide files
  const slideFiles = await getSlideFiles();
  if (!slideFiles.length) {
    throw new Error(`No slide files found in ${SLIDES_DIR}`);
  }

  // 2. Generate grid-view.html
  const gridHtml = generateGridHtml(slideFiles);
  await writeFile(GRID_PATH, gridHtml);
  console.log(`✅ Generated grid-view.html (${slideFiles.length} slides)`);

  // 3. Generate index.html with inlined sections and full CSS
  const deckHtml = await generateDeckHtml(slideFiles, SLIDES_DIR);
  await writeFile(DECK_PATH, deckHtml);
  console.log(`✅ Generated index.html (${slideFiles.length} slides)`);

  console.log(`\n🎬 Both views are now in sync!`);
}

main().catch((e) => {
  console.error(`❌ ${e.message}`);
  process.exit(1);
});

