// ============================================================================
// CineRealm Predictive Oracle: Fingerprint API
// POST /api/fingerprint - Fingerprint a single movie
// GET  /api/fingerprint - List all fingerprints
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { extractVector, classifyBook, runOracle, rowsToScores } from "@/lib/fingerprint/engine";
import type { BookAnalysisRow } from "@/lib/fingerprint/engine";

export const runtime = "nodejs";

// POST: Fingerprint a single movie by ID
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { book_id } = body;

    if (!book_id) {
      return NextResponse.json({ error: "book_id is required" }, { status: 400 });
    }

    const supabase = await createServerClient();

    // Get movie
    const { data: movie, error: bookErr } = await supabase
      .from("movies")
      .select("id, title, author")
      .eq("id", book_id)
      .single();

    if (bookErr || !movie) {
      return NextResponse.json({ error: "Movie not found" }, { status: 404 });
    }

    // Get analysis scores from the real book_analysis columns
    const { data: analysisRows, error: analysisErr } = await supabase
      .from("book_analysis")
      .select("agent_id, pragmatist_score, empath_score, formalist_score, moralist_score, nihilist_score")
      .eq("book_id", book_id);

    if (analysisErr) {
      return NextResponse.json({ error: analysisErr.message }, { status: 500 });
    }

    if (!analysisRows || analysisRows.length === 0) {
      return NextResponse.json(
        { error: "No analysis data for this movie. Run analysis first." },
        { status: 400 }
      );
    }

    // Convert flat rows → AgentScore[]
    const analyses = rowsToScores(analysisRows as BookAnalysisRow[]);

    // Run full oracle
    const result = await runOracle(book_id, movie.title, movie.author, analyses);

    return NextResponse.json({ success: true, ...result });
  } catch (err: any) {
    console.error("Fingerprint error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// GET: List all fingerprints with stats
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();

    const { data: fps, error } = await supabase
      .from("book_fingerprints")
      .select("*")
      .order("computed_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Aggregate stats
    const byCategory: Record<string, number> = {};
    for (const fp of fps || []) {
      const cat = fp.category || "uncategorized";
      byCategory[cat] = (byCategory[cat] || 0) + 1;
    }

    return NextResponse.json({
      total: (fps || []).length,
      by_category: byCategory,
      fingerprints: fps,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
