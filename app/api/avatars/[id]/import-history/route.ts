// ============================================================================
// CineRealm — Reading History Import API
// POST /api/avatars/[id]/import-history
//
// Accepts:
//   1. multipart/form-data with a `file` field (Letterboxd CSV export)
//   2. application/json with ParsedBookData directly (manual entry / API integration)
//
// Authentication: Supabase Auth session cookie.
// Ownership: Avatar must belong to the authenticated user.
//
// Response (200): { success: true, avatar: AvatarProfile, stats: ImportStats }
// Response (400): { success: false, error: "..." }
// Response (401): { success: false, error: "..." }
// Response (404): { success: false, error: "..." }
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { getAvatarProfile, processReadingHistory } from "@/lib/evolution/avatar-evolution";
import { parseLetterboxdCSV } from "@/lib/evolution/goodreads-parser";
import type { AvatarProfile, ParsedBookData } from "@/types/avatar";

export const runtime = "nodejs";
export const maxDuration = 60; // CSV parsing + DB write may take a moment

// ─── Types ───────────────────────────────────────────────────

interface ImportStats {
  booksParsed: number;
  highRated: number;
  lowRated: number;
  tropesAdded: number;
  dislikesAdded: number;
  levelBefore: number;
  levelAfter: number;
}

interface ImportSuccessResponse {
  success: true;
  avatar: AvatarProfile;
  stats: ImportStats;
}

interface ImportErrorResponse {
  success: false;
  error: string;
}

// ─── Route Handler ──────────────────────────────────────────

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse<ImportSuccessResponse | ImportErrorResponse>> {
  const { id: avatarId } = await context.params;

  try {
    // ── Authenticate ────────────────────────────────────
    const supabase = await createServerClient();
    const {
      data: { session },
      error: sessionErr,
    } = await supabase.auth.getSession();

    if (sessionErr || !session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Not authenticated — log in first" },
        { status: 401 },
      );
    }

    const userId = session.user.id;

    // ── Ownership check ──────────────────────────────────
    const profile = await getAvatarProfile(avatarId);
    if (!profile) {
      return NextResponse.json(
        { success: false, error: "Avatar not found" },
        { status: 404 },
      );
    }
    if (profile.user_id !== userId) {
      return NextResponse.json(
        { success: false, error: "Avatar not found" },
        { status: 404 },
      );
    }

    const levelBefore = profile.level;

    // ── Parse the request ────────────────────────────────
    let parsedBookData: ParsedBookData;

    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      // CSV file upload
      const formData = await request.formData();
      const file = formData.get("file");

      if (!file || !(file instanceof File)) {
        return NextResponse.json(
          { success: false, error: "No CSV file provided — attach a `file` field" },
          { status: 400 },
        );
      }

      if (!file.name.endsWith(".csv")) {
        return NextResponse.json(
          { success: false, error: "Only .csv files are accepted" },
          { status: 400 },
        );
      }

      const csvText = await file.text();
      parsedBookData = parseLetterboxdCSV(csvText, file.name.replace(/\.csv$/i, ""));

      if (parsedBookData.movies.length === 0) {
        return NextResponse.json(
          { success: false, error: "No valid movies found in the CSV. Make sure movies have ratings." },
          { status: 400 },
        );
      }
    } else if (contentType.includes("application/json")) {
      // Direct JSON body
      const body = await request.json();
      parsedBookData = body as ParsedBookData;

      if (!parsedBookData.movies || !Array.isArray(parsedBookData.movies) || parsedBookData.movies.length === 0) {
        return NextResponse.json(
          { success: false, error: "Body must contain a `movies` array with at least one entry" },
          { status: 400 },
        );
      }
    } else {
      return NextResponse.json(
        { success: false, error: "Send a CSV file (multipart/form-data) or JSON body (application/json)" },
        { status: 400 },
      );
    }

    // ── Process the streaming history ──────────────────────
    const updatedProfile = await processReadingHistory(avatarId, parsedBookData);

    // ── Compute stats for the UI ─────────────────────────
    const highRated = parsedBookData.movies.filter((b) => (b.rating || 0) >= 4);
    const lowRated = parsedBookData.movies.filter((b) => (b.rating || 0) <= 2);

    const stats: ImportStats = {
      booksParsed: parsedBookData.movies.length,
      highRated: highRated.length,
      lowRated: lowRated.length,
      tropesAdded: (updatedProfile.beloved_tropes?.length || 0) - (profile.beloved_tropes?.length || 0),
      dislikesAdded: (updatedProfile.dislikes?.length || 0) - (profile.dislikes?.length || 0),
      levelBefore,
      levelAfter: updatedProfile.level,
    };

    return NextResponse.json({
      success: true,
      avatar: updatedProfile,
      stats,
    });
  } catch (err) {
    console.error("[Import History]", err);
    const message = err instanceof Error ? err.message : "Unknown error importing streaming history";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
