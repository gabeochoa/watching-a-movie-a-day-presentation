function parseCsv(text) {
  const Papa = window.Papa;
  if (!Papa) throw new Error("PapaParse not loaded.");
  const result = Papa.parse(text, { header: true, skipEmptyLines: true });
  if (result.errors?.length) {
    // keep going, but surface first error for debugging
    // eslint-disable-next-line no-console
    console.warn("CSV parse errors:", result.errors);
  }
  return result.data;
}

async function readZipFile(zip, name) {
  const file = zip.file(name);
  if (!file) return null;
  return file.async("string");
}

export async function parseLetterboxdZip(file) {
  const JSZip = window.JSZip;
  if (!JSZip) throw new Error("JSZip not loaded.");

  // Basic safety checks (not perfect, but better than nothing).
  // Users can still load huge exports; keep these conservative and adjustable later.
  const MAX_ZIP_BYTES = 50 * 1024 * 1024; // 50MB
  if (typeof file.size === "number" && file.size > MAX_ZIP_BYTES) {
    throw new Error(`ZIP too large (${file.size} bytes). Limit is ${MAX_ZIP_BYTES} bytes.`);
  }

  const buf = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(buf);

  const zipFileNames = Object.keys(zip.files || {});
  if (zipFileNames.length > 200) throw new Error("ZIP contains too many files.");

  // Letterboxd exports often include these; we start with diary + films.
  // The exact filenames can vary; we’ll probe common names.
  const candidates = {
    diary: ["diary.csv", "diary-entries.csv"],
    films: ["films.csv"],
    ratings: ["ratings.csv"],
    watched: ["watched.csv"],
  };

  async function firstMatch(names) {
    for (const n of names) {
      const content = await readZipFile(zip, n);
      if (content != null) return { name: n, content };
    }
    return null;
  }

  const diaryFile = await firstMatch(candidates.diary);
  const filmsFile = await firstMatch(candidates.films);
  const ratingsFile = await firstMatch(candidates.ratings);
  const watchedFile = await firstMatch(candidates.watched);

  const diary = diaryFile ? parseCsv(diaryFile.content) : [];
  const films = filmsFile ? parseCsv(filmsFile.content) : [];
  const ratings = ratingsFile ? parseCsv(ratingsFile.content) : [];
  const watched = watchedFile ? parseCsv(watchedFile.content) : [];

  return {
    zipFileNames,
    filesFound: {
      diary: diaryFile?.name ?? null,
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

