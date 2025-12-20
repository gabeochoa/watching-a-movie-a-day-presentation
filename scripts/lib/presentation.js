import fs from "fs-extra";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { generateSlides, generateAIPrompts } from "./slides.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function countSlides(html) {
  return (html.match(/<section/g) || []).length;
}

export async function generateRevealSite(payload, outputDir, { title = "Wrapboxd" } = {}) {
  const templateDir = path.join(__dirname, "..", "..", "templates", "reveal");

  if (!await fs.pathExists(templateDir)) {
    throw new Error(`Missing template directory: ${templateDir}`);
  }

  await fs.ensureDir(path.join(outputDir, "css"));
  await fs.ensureDir(path.join(outputDir, "js"));

  await fs.copy(
    path.join(templateDir, "css", "genz-theme.css"),
    path.join(outputDir, "css", "genz-theme.css"),
  );

  await fs.copy(
    path.join(templateDir, "js", "charts.js"),
    path.join(outputDir, "js", "charts.js"),
  );

  const slidesHtml = generateSlides(payload);
  const template = await fs.readFile(path.join(templateDir, "index.html"), "utf8");

  const html = template
    .replace("{{TITLE}}", escapeHtml(title))
    .replace("{{SLIDES}}", slidesHtml)
    .replace("{{DATA}}", JSON.stringify(payload));

  await fs.writeFile(path.join(outputDir, "index.html"), html);

  return { slideCount: countSlides(slidesHtml) };
}

export async function generatePromptsFile(payload, outputDir) {
  const prompts = generateAIPrompts(payload);
  await fs.writeFile(path.join(outputDir, "prompts.md"), prompts);
}

