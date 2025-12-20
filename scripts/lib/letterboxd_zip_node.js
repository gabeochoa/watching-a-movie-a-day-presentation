import fs from "fs-extra";
import JSZip from "jszip";
import Papa from "papaparse";

function parseCsv(content) {
  const parsed = Papa.parse(content, { header: true, skipEmptyLines: true });
  return parsed.data ?? [];
}

async function readZipText(zip, name) {
  const file = zip.files?.[name];
  if (!file) return null;
  return file.async("text");
}

async function firstMatch(zip, names) {
  for (const n of names) {
    // eslint-disable-next-line no-await-in-loop
    const content = await readZipText(zip, n);
    if (content != null) return { name: n, content };
  }
  return null;
}

export async function parseLetterboxdZipFromPath(zipPath) {
  const zipData = await fs.readFile(zipPath);
  const zip = await JSZip.loadAsync(zipData);

  const zipFileNames = Object.keys(zip.files || {});
  const candidates = {
    diary: ["diary.csv", "diary-entries.csv"],
    films: ["films.csv"],
    ratings: ["ratings.csv"],
    watched: ["watched.csv"],
  };

  const diaryFile = await firstMatch(zip, candidates.diary);
  if (!diaryFile) throw new Error("diary.csv not found in ZIP file (required).");

  const filmsFile = await firstMatch(zip, candidates.films);
  const ratingsFile = await firstMatch(zip, candidates.ratings);
  const watchedFile = await firstMatch(zip, candidates.watched);

  const diary = parseCsv(diaryFile.content);
  const films = filmsFile ? parseCsv(filmsFile.content) : [];
  const ratings = ratingsFile ? parseCsv(ratingsFile.content) : [];
  const watched = watchedFile ? parseCsv(watchedFile.content) : [];

  return {
    zipFileNames,
    filesFound: {
      diary: diaryFile.name,
      films: filmsFile?.name ?? null,
      ratings: ratingsFile?.name ?? null,
      watched: watchedFile?.name ?? null,
    },
    diary,
    films,
    ratings,
    watched,
  };
}

