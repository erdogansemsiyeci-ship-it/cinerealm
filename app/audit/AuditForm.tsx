"use client";

import { useRef, useState, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createAuditRecord, type AuditFormState } from "@/app/actions/audit";
import TerminalStream from "./TerminalStream";

// ── Genre options ────────────────────────────────────

const GENRES = [
  { value: "cinematic_movies", label: "Cinematic Fiction" },
  { value: "commercial_thriller", label: "Commercial Thriller / Mystery" },
  { value: "scifi_fantasy", label: "Science Fiction / Fantasy" },
  { value: "historical_movies", label: "Historical Fiction" },
  { value: "romance", label: "Romance" },
  { value: "horror", label: "Horror" },
  { value: "nonmovies", label: "Non-Fiction / Memoir" },
  { value: "young_adult", label: "Young Adult" },
  { value: "other", label: "Other" },
];

// ── Expectation options ──────────────────────────────

const EXPECTATIONS = [
  {
    value: "systemic_psychological",
    label: "Systemic / Psychological Depth",
    desc: "Structural analysis of character arcs, generational patterns, and psychological authenticity.",
  },
  {
    value: "pacing_hooks",
    label: "Pacing & Hook Analysis",
    desc: "Evaluate narrative momentum, chapter cliff-hangers, and opening hook strength.",
  },
  {
    value: "market_potential",
    label: "Market Trends & Commercial Potential",
    desc: "Predictive Oracle: market tier estimation, genre positioning, comparable titles.",
  },
  {
    value: "worldbuilding",
    label: "World-Building & Consistency",
    desc: "Universe logic, internal rule systems, and lore coherence (ideal for SFF).",
  },
  {
    value: "comprehensive",
    label: "Comprehensive Full Audit",
    desc: "All four dimensions — the complete editorial board experience.",
  },
];

// ── Drag & Drop Upload Zone ──────────────────────────

function DropZone({
  file,
  onFile,
}: {
  file: File | null;
  onFile: (f: File | null) => void;
}) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const f = e.dataTransfer.files?.[0];
      if (f) onFile(f);
    },
    [onFile]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) onFile(f);
  };

  const validExts = [".pdf", ".docx", ".txt"];

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
        dragOver
          ? "border-[#c9a96e] bg-[#c9a96e]/5"
          : "border-border hover:border-primary/30 hover:bg-muted/30"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={validExts.join(",")}
        onChange={handleChange}
        className="hidden"
      />

      {file ? (
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#c9a96e]/10 border border-[#c9a96e]/20">
            <svg className="w-5 h-5 text-[#c9a96e]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-sm font-medium text-[#c9a96e]">{file.name}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            {(file.size / 1024).toFixed(1)} KB — click or drop to replace
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-muted">
            <svg className="w-8 h-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              Drop your manuscript here
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              or click to browse — {validExts.join(", ")} up to 10 MB
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Audit Form ──────────────────────────────────

export default function AuditForm() {
  const [state, setState] = useState<AuditFormState>({ errors: {} });
  const [file, setFile] = useState<File | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    if (file) {
      formData.set("manuscript", file);
    }

    startTransition(async () => {
      const result = await createAuditRecord(formData);
      setState(result);
      if (result.success) {
        router.refresh();
      }
    });
  };

  if (state?.success && state.audit_id) {
    return (
      <div className="space-y-6">
        <TerminalStream
          auditId={state.audit_id}
          onComplete={() => {}}
        />
        <div className="text-center">
          <a
            href="/dashboard"
            className="inline-block px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition"
          >
            Back to Dashboard
          </a>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-card border border-border rounded-2xl overflow-hidden"
    >
      {/* Upload Section */}
      <div className="p-6 sm:p-8 border-b border-border">
        <h2 className="text-lg font-heading font-bold text-heading mb-1">
          📄 Manuscript Upload
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Accepted formats: PDF, DOCX, TXT — max 10 MB
        </p>
        <DropZone file={file} onFile={setFile} />
        {state?.errors?.file?.[0] && (
          <p className="mt-2 text-sm text-destructive">{state.errors.file[0]}</p>
        )}
      </div>

      {/* Editorial Vision Form */}
      <div className="p-6 sm:p-8 space-y-5">
        <h2 className="text-lg font-heading font-bold text-heading mb-1">
          🎯 Editorial Vision
        </h2>
        <p className="text-sm text-muted-foreground -mt-4 mb-2">
          Tell our AI editorial board what matters most for this manuscript.
        </p>

        {/* Movie Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-foreground mb-1.5">
            Manuscript Title <span className="text-destructive">*</span>
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            placeholder="e.g., The Glass Tower"
            className="w-full px-4 py-3 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-[#c9a96e]/50 focus:border-[#c9a96e]/30 transition"
          />
          {state?.errors?.title?.[0] && (
            <p className="mt-1.5 text-sm text-destructive">{state.errors.title[0]}</p>
          )}
        </div>

        {/* Target Genre */}
        <div>
          <label htmlFor="target_genre" className="block text-sm font-medium text-foreground mb-1.5">
            Target Genre
          </label>
          <select
            id="target_genre"
            name="target_genre"
            defaultValue=""
            className="w-full px-4 py-3 rounded-xl bg-input border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-[#c9a96e]/50 focus:border-[#c9a96e]/30 transition appearance-none"
          >
            <option value="" disabled>
              Select a genre...
            </option>
            {GENRES.map((g) => (
              <option key={g.value} value={g.value}>
                {g.label}
              </option>
            ))}
          </select>
        </div>

        {/* Expectation */}
        <div>
          <label htmlFor="expectation" className="block text-sm font-medium text-foreground mb-1.5">
            Primary Expectation
          </label>
          <select
            id="expectation"
            name="expectation"
            defaultValue=""
            className="w-full px-4 py-3 rounded-xl bg-input border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-[#c9a96e]/50 focus:border-[#c9a96e]/30 transition appearance-none"
          >
            <option value="" disabled>
              What should our agents focus on?
            </option>
            {EXPECTATIONS.map((e) => (
              <option key={e.value} value={e.value}>
                {e.label}
              </option>
            ))}
          </select>
          <p className="mt-1.5 text-xs text-muted-foreground">
            {EXPECTATIONS.find((e) => e.value === "")?.desc}
          </p>
        </div>

        {/* Author Notes */}
        <div>
          <label htmlFor="author_notes" className="block text-sm font-medium text-foreground mb-1.5">
            Author&apos;s Note
          </label>
          <textarea
            id="author_notes"
            name="author_notes"
            rows={4}
            placeholder="What specific dynamics or blind spots should our agents focus on? Any particular themes, characters, or chapters that need extra attention?"
            className="w-full px-4 py-3 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-[#c9a96e]/50 focus:border-[#c9a96e]/30 transition resize-none"
          />
        </div>

        {/* Server error */}
        {state?.errors?.server?.[0] && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
            {state.errors.server[0]}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={pending || !file}
          className="w-full py-4 rounded-xl bg-[#c9a96e] text-[#0f0f0f] font-bold text-lg hover:bg-[#b8944f] disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center justify-center gap-3"
        >
          {pending ? (
            <>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Uploading & Submitting...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              Submit to Editorial Board
            </>
          )}
        </button>

        <p className="text-center text-xs text-muted-foreground">
          Your manuscript is encrypted in transit and stored securely. Only you
          and the CineRealm editorial engine can access it.
        </p>
      </div>
    </form>
  );
}
