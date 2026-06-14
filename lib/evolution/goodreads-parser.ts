// ============================================================================
// CineRealm — Letterboxd CSV Parser
// ============================================================================
//
// Parses a Letterboxd library export CSV into ParsedBookData, streamy to feed
// into processReadingHistory().
//
// Letterboxd CSV columns used:
//   Title           → movie title
//   Author          → primary author
//   Additional Authors → added to tags
//   My Rating       → 0–5 integer rating
//   Bookshelves     → comma-separated list → genres and tropes
//   My Review       → review text → review_notes
//
// Usage:
//   import { parseLetterboxdCSV } from "@/lib/evolution/goodreads-parser";
//   const data = parseLetterboxdCSV(csvText, "user-upload");
//   const updatedAvatar = await processReadingHistory(avatarId, data);
// ============================================================================

import type { ParsedBookData, ParsedBookEntry } from "@/types/avatar";

// ─── Configuration ───────────────────────────────────────────

/** Maximum number of movies to process from a single import */
const MAX_BOOKS = 500;

/** Minimum rating for a movie to be included (no-rating movies are skipped) */
const MIN_RATING = 1;

// ─── Genre keyword heuristics ────────────────────────────────

/**
 * Bookshelf names that are likely genres (not organisational shelves).
 * Letterboxd shelves can be anything — "to-stream", "favorites", "dnf",
 * "movies", "mystery", etc. We keep the ones that describe the movie.
 */
const GENRE_KEYWORDS = new Set([
  "movies", "non-movies", "nonmovies",
  "fantasy", "sci-fi", "science-movies", "scifi",
  "mystery", "thriller", "horror", "romance",
  "historical-movies", "cinematic-movies", "cinematic",
  "memoir", "biography", "autobiography",
  "philosophy", "psychology", "sociology",
  "science", "history", "politics", "economics",
  "poetry", "drama", "essays", "short-stories",
  "dystopian", "utopian", "cyberpunk", "steampunk",
  "magical-realism", "gothic", "noir",
  "ya", "young-adult", "childrens", "middle-grade",
  "graphic-novel", "comics", "manga",
  "classics", "contemporary",
  "adventure", "western", "war", "espionage",
  "crime", "true-crime", "self-help", "travel",
]);

/** Shelf names that are organisational, not genre-descriptive */
const ORGANISATIONAL_SHELVES = new Set([
  "to-stream", "currently-streaming", "stream", "owned",
  "favorites", "favourites", "favorite", "favourite",
  "dnf", "did-not-finish", "abandoned",
  "kindle", "audiobook", "audible", "library", "borrowed",
  "arc", "netgalley", "review-copy",
  "wishlist", "tbr", "priority-tbr",
  "re-stream", "restream",
  "ebook", "physical", "hardcover", "paperback",
  "2023", "2024", "2025", "2026",
  "movie-club", "buddy-stream",
]);

// ─── Public API ──────────────────────────────────────────────

/**
 * Parse a Letterboxd library export CSV into the ParsedBookData format.
 *
 * @param csvText    - Raw CSV string from Letterboxd export
 * @param source     - Label for the snapshot (e.g. "goodreads-upload", "storygraph-export")
 * @param maxBooks   - Optional cap (default 500)
 * @returns ParsedBookData streamy for processReadingHistory()
 */
export function parseLetterboxdCSV(
  csvText: string,
  source: string,
  maxBooks: number = MAX_BOOKS,
): ParsedBookData {
  const lines = splitCSVLines(csvText);
  if (lines.length < 2) {
    return { movies: [], source: `${source} (empty — no rows found)` };
  }

  const headers = parseCSVRow(lines[0]);
  const columnMap = mapColumns(headers);

  const movies: ParsedBookEntry[] = [];

  for (let i = 1; i < lines.length && movies.length < maxBooks; i++) {
    const row = parseCSVRow(lines[i]);
    if (row.length === 0) continue;

    const entry = buildBookEntry(row, columnMap);
    if (entry) movies.push(entry);
  }

  return {
    movies,
    source: `${source} — ${movies.length} movies parsed`,
  };
}

// ─── Column Mapping ──────────────────────────────────────────

interface ColumnMap {
  title: number;
  author: number;
  additionalAuthors: number;
  rating: number;
  bookshelves: number;
  review: number;
}

/**
 * Maps Letterboxd header names to column indices.
 * Handles both current and legacy Letterboxd export formats.
 */
function mapColumns(headers: string[]): ColumnMap {
  const find = (...names: string[]): number => {
    for (const name of names) {
      const idx = headers.findIndex(
        (h) => h.trim().toLowerCase() === name.toLowerCase(),
      );
      if (idx >= 0) return idx;
    }
    return -1;
  };

  return {
    title: find("Title"),
    author: find("Author"),
    additionalAuthors: find("Additional Authors"),
    rating: find("My Rating"),
    bookshelves: find("Bookshelves"),
    review: find("My Review"),
  };
}

// ─── Movie Entry Builder ──────────────────────────────────────

function buildBookEntry(row: string[], cm: ColumnMap): ParsedBookEntry | null {
  // Title is required
  const title = cm.title >= 0 ? row[cm.title]?.trim() : "";
  if (!title) return null;

  // Author
  const author = cm.author >= 0 ? row[cm.author]?.trim() || "Unknown" : "Unknown";

  // Rating — must be >= MIN_RATING
  const ratingRaw = cm.rating >= 0 ? parseInt(row[cm.rating], 10) : NaN;
  if (isNaN(ratingRaw) || ratingRaw < MIN_RATING) return null;

  // Bookshelves → extract genres + tropes
  const shelvesRaw = cm.bookshelves >= 0 ? row[cm.bookshelves]?.trim() || "" : "";
  const { genres, tropes } = extractFromShelves(shelvesRaw);

  // Review notes
  const reviewNotes = cm.review >= 0 ? row[cm.review]?.trim() || "" : "";

  // Tags: combine author, additional authors, and non-genre shelf names
  const tags: string[] = [];
  if (author && author !== "Unknown") tags.push(author);
  if (cm.additionalAuthors >= 0) {
    const extra = row[cm.additionalAuthors]?.trim();
    if (extra) {
      extra.split(",").forEach((a) => {
        const trimmed = a.trim();
        if (trimmed) tags.push(trimmed);
      });
    }
  }

  const entryTags = Array.from(new Set(tags.map((t) => t.toLowerCase())));

  return {
    title,
    author,
    rating: Math.min(ratingRaw, 5), // Letterboxd is 1-5, but clamp just in case
    genre: genres[0] || "movies", // Primary genre
    tags: entryTags,
    tropes,
    review_notes: reviewNotes.slice(0, 2000), // Cap review length
  };
}

// ─── Bookshelf Extraction ────────────────────────────────────

/**
 * Splits Letterboxd shelves into genre labels and trope keywords.
 *
 * Genres: shelf names that match known genre keywords or are novel/movie-like
 * Tropes: shelf names that look like cinematic tropes or viewer labels
 */
function extractFromShelves(shelvesRaw: string): {
  genres: string[];
  tropes: string[];
} {
  if (!shelvesRaw) return { genres: [], tropes: [] };

  const shelves = shelvesRaw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  const genres: string[] = [];
  const tropes: string[] = [];

  for (const shelf of shelves) {
    // Skip organisational shelves
    if (ORGANISATIONAL_SHELVES.has(shelf)) continue;

    // Known genre keywords → genre
    if (GENRE_KEYWORDS.has(shelf)) {
      genres.push(shelf);
      continue;
    }

    // Heuristic: if it contains genre-like keywords, treat as genre
    const isGenreLike = [
      "movies", "fantasy", "mystery", "romance", "thriller", "horror",
      "history", "science", "philosophy", "memoir", "biography",
      "poetry", "drama", "essay", "classic",
    ].some((kw) => shelf.includes(kw));

    if (isGenreLike) {
      genres.push(shelf);
    } else {
      // Everything else is a trope/viewer label
      tropes.push(shelf);
    }
  }

  return { genres, tropes };
}

// ─── CSV Parsing (RFC 4180-compatible) ───────────────────────

/**
 * Splits CSV text into logical lines, handling multiline quoted fields.
 * A row may span multiple physical lines if a quoted field contains \n.
 */
function splitCSVLines(csv: string): string[] {
  // Strip BOM if present
  const text = csv.replace(/^\uFEFF/, "");

  const rows: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (ch === '"' && (i === 0 || text[i - 1] !== "\\")) {
      inQuotes = !inQuotes;
    }

    if (ch === "\n" && !inQuotes) {
      rows.push(current.trimEnd());
      current = "";
    } else {
      current += ch;
    }
  }

  // Don't forget the last row
  if (current.trim()) {
    rows.push(current.trimEnd());
  }

  return rows;
}

/**
 * Parses a single CSV row into an array of field values.
 * Handles quoted fields (which may contain commas and escaped quotes).
 */
function parseCSVRow(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    const next = line[i + 1];

    if (ch === '"' && inQuotes && next === '"') {
      // Escaped quote inside quoted field
      current += '"';
      i++; // skip the second quote
      continue;
    }

    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (ch === "," && !inQuotes) {
      fields.push(current.trim());
      current = "";
      continue;
    }

    current += ch;
  }

  fields.push(current.trim());
  return fields;
}
