#!/usr/bin/env node
/**
 * Rebuild build/presentation/index.html to match the slide set/order shown in build/presentation/grid-view.html
 *
 * - Reads grid-view.html for iframe data-src slide paths
 * - For each slide HTML, extracts the single <section>...</section>
 * - Extracts :root CSS variables from the slide file and injects them as scoped CSS vars
 *   on the <section> style attribute (so the deck matches the per-slide rendering).
 * - Replaces the deck's <div class="slides">...</div> content with the extracted sections.
 */

import path from "node:path";
import { readFile, writeFile } from "node:fs/promises";

const ROOT = process.cwd();
const GRID_PATH = path.join(ROOT, "build", "presentation", "grid-view.html");
const DECK_PATH = path.join(ROOT, "build", "presentation", "index.html");
const SLIDES_DIR = path.join(ROOT, "build", "presentation", "slides");

function extractSlideFileListFromGrid(gridHtml) {
  const out = [];
  const re = /data-src="\.\/slides\/(slide-[\da-zA-Z]+\.html)"/g;
  for (const m of gridHtml.matchAll(re)) out.push(m[1]);
  // Preserve order, de-dupe just in case.
  return out.filter((x, i) => out.indexOf(x) === i);
}

function extractRootVars(fullHtml) {
  const root = {};
  const m = fullHtml.match(/:root\s*\{([\s\S]*?)\}/);
  if (!m) return root;
  const body = m[1];
  const re = /--([A-Za-z0-9_-]+)\s*:\s*([^;]+);/g;
  for (const mm of body.matchAll(re)) {
    const key = mm[1].trim();
    const val = mm[2].trim();
    if (!key || !val) continue;
    root[key] = val;
  }
  return root;
}

function extractSingleSection(fullHtml, sourceName) {
  const m = fullHtml.match(/<section\b[\s\S]*?<\/section>/);
  if (!m) throw new Error(`No <section> found in ${sourceName}`);
  return m[0];
}

function injectScopedVarsIntoSection(sectionHtml, vars) {
  const entries = Object.entries(vars);
  if (!entries.length) return sectionHtml;

  const varsDecl = entries.map(([k, v]) => `--${k}: ${v};`).join(" ");

  const openTagMatch = sectionHtml.match(/^<section\b[^>]*>/);
  if (!openTagMatch) return sectionHtml;
  const openTag = openTagMatch[0];

  let newOpenTag = openTag;
  if (/\sstyle="/.test(openTag)) {
    newOpenTag = openTag.replace(/style="([^"]*)"/, (_all, s) => {
      const base = String(s || "").trim();
      const needsSemi = base.length > 0 && !base.endsWith(";");
      const merged = `${base}${needsSemi ? ";" : ""} ${varsDecl}`.trim();
      return `style="${merged}"`;
    });
  } else {
    newOpenTag = openTag.replace(/>$/, ` style="${varsDecl}">`);
  }

  return sectionHtml.replace(openTag, newOpenTag);
}

function indentHtml(html, spaces = 4) {
  const pad = " ".repeat(spaces);
  return html
    .split("\n")
    .map((line) => (line.length ? pad + line : line))
    .join("\n");
}

function replaceDeckSlides(deckHtml, newSlidesHtmlIndented) {
  const re = /(<div class="slides">\s*)([\s\S]*?)(\s*<\/div>\s*<\/div>\s*<div id="section-indicator">)/;
  const m = deckHtml.match(re);
  if (!m) {
    throw new Error(`Couldn't find slides container in ${DECK_PATH}`);
  }
  return deckHtml.replace(re, `$1\n${newSlidesHtmlIndented}\n$3`);
}

async function main() {
  const gridHtml = await readFile(GRID_PATH, "utf8");
  const slideFiles = extractSlideFileListFromGrid(gridHtml);
  if (!slideFiles.length) throw new Error(`No slide iframes found in ${GRID_PATH}`);

  const sections = [];
  for (const file of slideFiles) {
    const fullPath = path.join(SLIDES_DIR, file);
    const fullHtml = await readFile(fullPath, "utf8");
    const vars = extractRootVars(fullHtml);
    let section = extractSingleSection(fullHtml, file);
    section = injectScopedVarsIntoSection(section, vars);
    sections.push(section);
  }

  const slidesHtml = sections.join("\n\n");
  const slidesIndented = indentHtml(slidesHtml, 4);

  const deckHtml = await readFile(DECK_PATH, "utf8");
  const updated = replaceDeckSlides(deckHtml, slidesIndented);
  await writeFile(DECK_PATH, updated);

  // eslint-disable-next-line no-console
  console.log(`✅ Synced deck slides from grid (${slideFiles.length} slides): ${DECK_PATH}`);
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(`❌ ${e.message}`);
  process.exit(1);
});


