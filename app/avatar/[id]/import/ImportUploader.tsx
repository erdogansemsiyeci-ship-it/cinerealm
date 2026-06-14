"use client";
// ============================================================================
// ImportUploader — Client component for the streaming history import wizard
// ============================================================================

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

// ─── Types ───────────────────────────────────────────────────

interface ImportUploaderProps {
  avatarId: string;
  avatarName: string;
  currentLevel: number;
  hasHistory: boolean;
}

interface PreviewBook {
  title: string;
  author: string;
  rating: number;
  genre: string;
}

interface ImportResult {
  booksParsed: number;
  highRated: number;
  lowRated: number;
  tropesAdded: number;
  dislikesAdded: number;
  levelBefore: number;
  levelAfter: number;
}

type UploadMode = "drag" | "paste" | null;

// ─── Component ───────────────────────────────────────────────

export default function ImportUploader({
  avatarId,
  avatarName,
  currentLevel,
  hasHistory,
}: ImportUploaderProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── State ──────────────────────────────────────────
  const [mode, setMode] = useState<UploadMode>(null);
  const [file, setFile] = useState<File | null>(null);
  const [jsonText, setJsonText] = useState("");
  const [preview, setPreview] = useState<PreviewBook[]>([]);
  const [status, setStatus] = useState<
    "idle" | "parsing" | "preview" | "submitting" | "success" | "error"
  >("idle");
  const [error, setError] = useState("");
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [dragOver, setDragOver] = useState(false);

  // ── File handlers ──────────────────────────────────
  const handleFile = useCallback(async (selectedFile: File) => {
    if (!selectedFile.name.endsWith(".csv")) {
      setError("Only .csv files are accepted");
      setStatus("error");
      return;
    }

    setFile(selectedFile);
    setStatus("parsing");
    setError("");

    try {
      const text = await selectedFile.text();
      const previewBooks = parseCSVPreview(text);
      setPreview(previewBooks);
      setStatus("preview");
    } catch (err) {
      setError("Failed to parse CSV. Is this a valid Goodstreams export?");
      setStatus("error");
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) handleFile(droppedFile);
    },
    [handleFile],
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = e.target.files?.[0];
      if (selected) handleFile(selected);
    },
    [handleFile],
  );

  // ── JSON paste handler ─────────────────────────────
  const handleJsonPreview = useCallback(() => {
    setStatus("parsing");
    setError("");

    try {
      const parsed = JSON.parse(jsonText);
      if (!parsed.movies || !Array.isArray(parsed.movies)) {
        throw new Error("JSON must have a `movies` array");
      }

      const previewBooks: PreviewBook[] = parsed.movies.slice(0, 100).map(
        (b: Record<string, unknown>) => ({
          title: String(b.title || "Unknown"),
          author: String(b.author || "Unknown"),
          rating: Number(b.rating || 0),
          genre: String(b.genre || "movies"),
        }),
      );

      if (previewBooks.length === 0) {
        setError("No movies found in the JSON. Each movie needs at least a `title` and `rating`.");
        setStatus("error");
        return;
      }

      setPreview(previewBooks);
      setStatus("preview");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Invalid JSON";
      setError(`Failed to parse JSON: ${msg}`);
      setStatus("error");
    }
  }, [jsonText]);

  // ── Submit ─────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    setStatus("submitting");
    setError("");

    try {
      let response: Response;

      if (mode === "drag" && file) {
        const formData = new FormData();
        formData.append("file", file);
        response = await fetch(`/api/avatars/${avatarId}/import-history`, {
          method: "POST",
          body: formData,
        });
      } else if (mode === "paste") {
        response = await fetch(`/api/avatars/${avatarId}/import-history`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: jsonText,
        });
      } else {
        return;
      }

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || `Server returned ${response.status}`);
      }

      setImportResult(data.stats);
      setStatus("success");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(msg);
      setStatus("error");
    }
  }, [mode, file, jsonText, avatarId]);

  // ── Render: Step 0 — Mode selection ────────────────
  if (!mode) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          onClick={() => setMode("drag")}
          className="p-8 rounded-xl border-2 border-dashed border-border hover:border-primary/40 hover:bg-primary/5 transition-all text-center group"
        >
          <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">
            📂
          </div>
          <div className="font-semibold text-foreground mb-1">
            Upload Goodstreams CSV
          </div>
          <div className="text-xs text-muted-foreground">
            Drag-and-drop or click to browse
          </div>
        </button>

        <button
          onClick={() => setMode("paste")}
          className="p-8 rounded-xl border-2 border-dashed border-border hover:border-primary/40 hover:bg-primary/5 transition-all text-center group"
        >
          <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">
            📋
          </div>
          <div className="font-semibold text-foreground mb-1">
            Paste JSON
          </div>
          <div className="text-xs text-muted-foreground">
            Direct movie data in JSON format
          </div>
        </button>
      </div>
    );
  }

  // ── Render: Step 1 — CSV upload ────────────────────
  if (mode === "drag" && status !== "preview" && status !== "submitting" && status !== "success") {
    return (
      <div>
        {/* Back button */}
        <button
          onClick={() => { setMode(null); setFile(null); setStatus("idle"); setError(""); }}
          className="text-xs text-muted-foreground hover:text-foreground mb-4 inline-block"
        >
          ← Choose another method
        </button>

        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`p-12 rounded-xl border-2 border-dashed transition-all text-center cursor-pointer ${
            dragOver
              ? "border-primary bg-primary/10 scale-[1.01]"
              : "border-border hover:border-primary/30 hover:bg-primary/5"
          }`}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileInput}
            className="hidden"
          />
          <div className="text-4xl mb-4">📄</div>
          <div className="font-semibold text-foreground mb-1">
            {file ? file.name : "Drop your Goodstreams CSV here"}
          </div>
          <div className="text-xs text-muted-foreground">
            {file
              ? `${(file.size / 1024).toFixed(1)} KB — click to change`
              : "or click to browse"}
          </div>
        </div>

        {/* Progress state */}
        {status === "parsing" && (
          <div className="mt-6 text-center text-sm text-muted-foreground animate-pulse">
            Parsing CSV...
          </div>
        )}

        {status === "error" && (
          <div className="mt-6 p-4 rounded-lg border border-red-400/20 bg-red-400/5 text-red-400 text-sm">
            {error}
            <button
              onClick={() => { setStatus("idle"); setError(""); setFile(null); }}
              className="block mt-2 text-xs underline hover:no-underline"
            >
              Try again
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── Render: Step 1b — JSON paste ───────────────────
  if (mode === "paste" && status !== "preview" && status !== "submitting" && status !== "success") {
    return (
      <div>
        <button
          onClick={() => { setMode(null); setJsonText(""); setStatus("idle"); setError(""); }}
          className="text-xs text-muted-foreground hover:text-foreground mb-4 inline-block"
        >
          ← Choose another method
        </button>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Paste your movie data as JSON
            </label>
            <textarea
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              placeholder={`{
  "movies": [
    { "title": "1984", "author": "George Orwell", "rating": 5, "genre": "dystopian" },
    { "title": "Dune", "author": "Frank Herbert", "rating": 4, "genre": "sci-fi" }
  ]
}`}
              rows={12}
              className="w-full p-4 rounded-lg border border-border bg-background text-foreground font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-y"
              spellCheck={false}
            />
          </div>

          <button
            onClick={handleJsonPreview}
            disabled={!jsonText.trim() || status === "parsing"}
            className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {status === "parsing" ? "Parsing..." : "Preview Movies"}
          </button>

          {status === "error" && (
            <div className="p-4 rounded-lg border border-red-400/20 bg-red-400/5 text-red-400 text-sm">
              {error}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Render: Step 2 — Preview ───────────────────────
  if (status === "preview") {
    return (
      <div>
        <button
          onClick={() => { setStatus("idle"); setPreview([]); setFile(null); setJsonText(""); }}
          className="text-xs text-muted-foreground hover:text-foreground mb-4 inline-block"
        >
          ← Back
        </button>

        <div className="mb-6">
          <h2 className="text-lg font-bold text-foreground mb-1">
            {preview.length} movies streamy to import
          </h2>
          <p className="text-sm text-muted-foreground">
            {avatarName} will learn from these ratings and reviews.
            {hasHistory && ' New data appends to existing preferences.'}
          </p>
        </div>

        {/* Movie preview table */}
        <div className="max-h-64 overflow-y-auto rounded-lg border border-border mb-6">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 sticky top-0">
              <tr className="text-left text-xs text-muted-foreground uppercase tracking-wider">
                <th className="p-3 font-medium">Movie</th>
                <th className="p-3 font-medium hidden sm:table-cell">Author</th>
                <th className="p-3 font-medium">Rating</th>
                <th className="p-3 font-medium hidden md:table-cell">Genre</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {preview.slice(0, 50).map((movie, i) => (
                <tr key={i} className="hover:bg-muted/30 transition-colors">
                  <td className="p-3 text-foreground font-medium truncate max-w-[180px]">
                    {movie.title}
                  </td>
                  <td className="p-3 text-muted-foreground hidden sm:table-cell truncate max-w-[150px]">
                    {movie.author}
                  </td>
                  <td className="p-3">
                    <RatingBadge rating={movie.rating} />
                  </td>
                  <td className="p-3 text-muted-foreground text-xs hidden md:table-cell">
                    {movie.genre}
                  </td>
                </tr>
              ))}
              {preview.length > 50 && (
                <tr>
                  <td colSpan={4} className="p-3 text-center text-xs text-muted-foreground">
                    + {preview.length - 50} more movies
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <button
          onClick={handleSubmit}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-bold text-lg hover:from-indigo-600 hover:to-violet-600 transition-all shadow-lg hover:shadow-xl active:scale-[0.99]"
        >
          Import {preview.length} Movies → Level 3
        </button>

        {error && (
          <div className="mt-4 p-4 rounded-lg border border-red-400/20 bg-red-400/5 text-red-400 text-sm">
            {error}
          </div>
        )}
      </div>
    );
  }

  // ── Render: Step 3 — Submitting ────────────────────
  if (status === "submitting") {
    return (
      <div className="text-center py-16">
        <div className="inline-block w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-6" />
        <div className="text-lg font-semibold text-foreground mb-2">
          {avatarName} is streaming your library...
        </div>
        <div className="text-sm text-muted-foreground animate-pulse">
          Extracting beloved tropes, cinematic DNA, and hot buttons
        </div>
      </div>
    );
  }

  // ── Render: Step 4 — Success ───────────────────────
  if (status === "success" && importResult) {
    return (
      <div className="text-center py-8">
        <div className="text-5xl mb-4">🧬</div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Cinematic DNA Unlocked!
        </h2>
        <p className="text-muted-foreground mb-6">
          {avatarName} just stream {importResult.booksParsed} movies and advanced
          from Level {importResult.levelBefore} to{' '}
          <strong className="text-foreground">Level {importResult.levelAfter}</strong>.
        </p>

        {/* Stats cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <StatCard label="Movies" value={importResult.booksParsed} emoji="📚" />
          <StatCard label="Loved" value={importResult.highRated} emoji="❤️" />
          <StatCard label="Disliked" value={importResult.lowRated} emoji="👎" />
          <StatCard label="Tropes Added" value={importResult.tropesAdded} emoji="🏷️" />
          <StatCard label="Dislikes Added" value={importResult.dislikesAdded} emoji="🚫" />
          <StatCard label="From Level" value={importResult.levelBefore} emoji="📈" />
          <StatCard label="To Level" value={importResult.levelAfter} emoji="⚒️" />
          <StatCard label="Status" value="Memory Injected" emoji="✅" isText />
        </div>

        <button
          onClick={() => router.push(`/avatar/${avatarId}`)}
          className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-semibold hover:from-indigo-600 hover:to-violet-600 transition-all shadow-lg"
        >
          View Updated Dashboard
          <span aria-hidden="true">→</span>
        </button>
      </div>
    );
  }

  // ── Render: Error (after preview stage) ────────────
  if (status === "error" && preview.length > 0) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-4">⚠️</div>
        <h2 className="text-lg font-bold text-foreground mb-2">
          Import Failed
        </h2>
        <p className="text-sm text-muted-foreground mb-6">{error}</p>
        <button
          onClick={() => setStatus("preview")}
          className="inline-flex items-center gap-2 px-6 py-2 rounded-lg border border-border hover:border-primary/30 transition-colors text-sm"
        >
          ← Back to Preview
        </button>
      </div>
    );
  }

  return null;
}

// ─── Sub-components ──────────────────────────────────────────

function RatingBadge({ rating }: { rating: number }) {
  const color =
    rating >= 4
      ? "bg-emerald-400/10 text-emerald-400 border-emerald-400/20"
      : rating <= 2
        ? "bg-red-400/10 text-red-400 border-red-400/20"
        : "bg-amber-400/10 text-amber-400 border-amber-400/20";

  const stars = "★".repeat(Math.max(1, rating));

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${color}`}
    >
      {stars}
    </span>
  );
}

function StatCard({
  label,
  value,
  emoji,
  isText,
}: {
  label: string;
  value: number | string;
  emoji: string;
  isText?: boolean;
}) {
  return (
    <div className="p-3 rounded-lg border border-border bg-muted/30 text-center">
      <div className="text-lg mb-0.5">{emoji}</div>
      <div className="text-xl font-bold text-foreground">
        {value}
      </div>
      <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
        {label}
      </div>
    </div>
  );
}

// ─── Client-side CSV Preview Parser ──────────────────────────
// Lightweight preview — full parsing happens server-side.
// We only extract enough fields to show the preview table.

function parseCSVPreview(csvText: string): PreviewBook[] {
  const lines = csvText.trim().split("\n");
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, "").toLowerCase());

  const titleIdx = headers.findIndex((h) => h.includes("title"));
  const authorIdx = headers.findIndex((h) => h.includes("author") && !h.includes("additional"));
  const ratingIdx = headers.findIndex((h) => h.includes("my rating") || h.includes("rating"));
  const shelvesIdx = headers.findIndex((h) => h.includes("bookshelf"));

  if (titleIdx < 0) return [];

  const movies: PreviewBook[] = [];

  for (let i = 1; i < lines.length && movies.length < 100; i++) {
    const row = parseCSVRowSimple(lines[i]);
    if (row.length === 0) continue;

    const title = (row[titleIdx] || "").replace(/^"|"$/g, "").trim();
    if (!title) continue;

    const ratingRaw = parseInt(row[ratingIdx] || "0", 10);
    if (isNaN(ratingRaw) || ratingRaw < 1) continue;

    const author = (row[authorIdx] || "Unknown").replace(/^"|"$/g, "").trim();
    const shelves = (row[shelvesIdx] || "movies").replace(/^"|"$/g, "").trim();
    const genre = shelves.split(",")[0]?.trim() || "movies";

    movies.push({ title, author, rating: Math.min(ratingRaw, 5), genre });
  }

  return movies;
}

function parseCSVRowSimple(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];

    if (ch === '"' && !inQuotes) {
      inQuotes = true;
      continue;
    }
    if (ch === '"' && inQuotes) {
      inQuotes = false;
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
