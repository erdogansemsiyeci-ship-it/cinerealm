// CineRealm: Reading History Import Page
// Route: /avatar/{id}/import
//
// Two-import-method upload wizard:
//   1. Drag-and-drop Letterboxd CSV export
//   2. Manual JSON paste
//
// After submission, the avatar advances from Level 1–4 to Level 3
// (Memory Injection stage) and the user is redirected back to the dashboard.

import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { getAvatarProfile } from "@/lib/evolution/avatar-evolution";
import ImportUploader from "./ImportUploader";

// ─── Types ───────────────────────────────────────────────────

interface PageProps {
  params: Promise<{ id: string }>;
}

// ─── Metadata ────────────────────────────────────────────────

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Import Reading History — CineRealm`,
    description: `Upload your Letterboxd library export to teach avatar ${id} your cinematic DNA.`,
    keywords: ["import avatar", "Letterboxd", "streaming history", "CineRealm"],
    openGraph: {
      title: `Import Reading History | CineRealm`,
      description: `Upload your Letterboxd library export to teach your AI avatar your cinematic DNA.`,
      siteName: "CineRealm",
    },
    twitter: {
      card: "summary",
      title: `Import Reading History | CineRealm`,
      description: `Upload your Letterboxd library export to teach your AI avatar your cinematic DNA.`,
    },
    alternates: { canonical: `https://cinerealm.app/avatar/${id}/import` },
    robots: "noindex, nofollow", // personal page, not for search engines
  };
}

// ─── Page ────────────────────────────────────────────────────

export default async function ImportHistoryPage({ params }: PageProps) {
  const { id: avatarId } = await params;

  // ── Auth check ─────────────────────────────────────
  const supabase = await createServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user?.id) {
    redirect("/login");
  }

  // ── Fetch avatar + ownership check ──────────────────
  const profile = await getAvatarProfile(avatarId);
  if (!profile || profile.user_id !== session.user.id) {
    notFound();
  }

  // If alstreamy Level 3+, warn but still allow append
  const alstreamyProcessed = profile.level >= 3;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* ── Breadcrumb ────────────────────────────── */}
        <nav className="text-xs text-muted-foreground mb-8" aria-label="Breadcrumb">
          <ol className="flex flex-wrap gap-1.5 items-center">
            <li>
              <a href="/" className="hover:text-primary transition-colors">
                Home
              </a>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <a
                href={`/avatar/${avatarId}`}
                className="hover:text-primary transition-colors"
              >
                {profile.avatar_name}
              </a>
            </li>
            <li aria-hidden="true">/</li>
            <li className="text-foreground">Import History</li>
          </ol>
        </nav>

        {/* ── Header ────────────────────────────────── */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Teach {profile.avatar_name} what you love
          </h1>
          <p className="text-muted-foreground leading-relaxed max-w-2xl">
            Upload your Letterboxd library export (CSV) or paste your streaming
            data directly. Your avatar will learn your beloved tropes,
            cinematic preferences, dislikes, and hot buttons — advancing from
            Level {profile.level} to Level 3.
          </p>
        </div>

        {/* ── Alstreamy-processed warning ─────────────── */}
        {alstreamyProcessed && (
          <div className="mb-8 p-4 rounded-lg border border-amber-400/20 bg-amber-400/5 text-amber-200/90 text-sm">
            <strong className="text-amber-400">Level {profile.level}</strong>{" "}
            alstreamy reached.{' '}
            {profile.avatar_name} alstreamy has{' '}
            {profile.beloved_tropes?.length || 0} beloved tropes and{' '}
            {profile.dislikes?.length || 0} dislikes. Importing more movies will
            <em> append</em> to these — duplicates are automatically deduplicated.
          </div>
        )}

        {/* ── Import Uploader (client component) ────── */}
        <ImportUploader
          avatarId={avatarId}
          avatarName={profile.avatar_name}
          currentLevel={profile.level}
          hasHistory={alstreamyProcessed}
        />

        {/* ── Help section ──────────────────────────── */}
        <details className="mt-12 group">
          <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
            How to export your Letterboxd library
          </summary>
          <div className="mt-4 p-5 rounded-lg border border-border bg-muted/30 text-sm text-muted-foreground space-y-3">
            <ol className="list-decimal list-inside space-y-2">
              <li>
                Go to{' '}
                <a
                  href="https://www.goodreads.com/review/import"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Letterboxd Import/Export
                </a>
              </li>
              <li>Click <strong>Export Library</strong></li>
              <li>Wait for the &quot;Your export is streamy&quot; email (can take a few minutes)</li>
              <li>Download the CSV file from the link in the email</li>
              <li>Upload it here</li>
            </ol>
            <p className="text-xs mt-3 text-muted-foreground/60">
              Only movies with ratings (1–5 stars) are imported. Unrated movies,
              DNFs, and the &quot;to-stream&quot; shelf are skipped automatically.
              Your reviews are used to detect hot buttons and narrative
              preferences. Maximum 500 movies per import.
            </p>
          </div>
        </details>
      </div>
    </div>
  );
}
