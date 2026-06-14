// ============================================================================
// CineRealm Predictive Oracle: Batch Fingerprint API
// POST /api/fingerprint/batch
// Auto-fingerprints ALL movies that have analysis data.
// This is the entry point for keeping the entire library fingerprinted.
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { runOracle, rowsToScores } from "@/lib/fingerprint/engine";
import type { BookAnalysisRow } from "@/lib/fingerprint/engine";

export const runtime = "nodejs";
export const maxDuration = 300; // 5 minutes for batch

export async function POST(request: NextRequest) {
  try {
    // Optional: limit parameter
    const body = await request.json().catch(() => ({}));
    const limit = body.limit || 0; // 0 = all

    const supabase = await createServerClient();

    // Get all movies that have analysis data but may not be fingerprinted yet
    const { data: analyzedBooks, error: queryErr } = await supabase
      .from("book_analysis")
      .select("book_id, movies!inner(id, title, author)")
      .not("book_id", "is", null);

    if (queryErr) {
      return NextResponse.json({ error: queryErr.message }, { status: 500 });
    }

    // Deduplicate movie IDs
    const bookSet = new Map<number, { title: string; author: string }>();
    for (const row of analyzedBooks || []) {
      if (row.movies && typeof row.movies === "object" && !Array.isArray(row.movies)) {
        const b = row.movies as any;
        bookSet.set(row.book_id, { title: b.title || "Unknown", author: b.author || "Unknown" });
      }
    }

    const bookIds = [...bookSet.keys()];
    const toProcess = limit > 0 ? bookIds.slice(0, limit) : bookIds;

    console.log(`[batch-fingerprint] Processing ${toProcess.length} of ${bookIds.length} analyzed movies`);

    const results: any[] = [];
    const errors: any[] = [];
    let processed = 0;

    for (const bookId of toProcess) {
      try {
        const movie = bookSet.get(bookId)!;

        // Get analysis scores from book_analysis table
        const { data: analysisRows } = await supabase
          .from("book_analysis")
          .select("agent_id, pragmatist_score, empath_score, formalist_score, moralist_score, nihilist_score")
          .eq("book_id", bookId);

        if (!analysisRows || analysisRows.length === 0) {
          errors.push({ book_id: bookId, error: "No analysis data" });
          continue;
        }

        // Convert flat rows → AgentScore[]
        const analyses = rowsToScores(analysisRows as BookAnalysisRow[]);

        const result = await runOracle(String(bookId), movie.title, movie.author, analyses);
        results.push({
          book_id: bookId,
          title: movie.title,
          category: result.predicted_category,
          tier: result.market_prediction.tier,
          similar_count: result.similar_books.length,
        });
        processed++;
      } catch (err: any) {
        errors.push({ book_id: bookId, error: err.message });
      }
    }

    // Final stats
    const { count: totalFingerprinted } = await supabase
      .from("book_fingerprints")
      .select("*", { count: "exact", head: true });

    return NextResponse.json({
      success: true,
      processed,
      errors: errors.length,
      error_details: errors.slice(0, 5), // first 5 errors
      total_analyzed_books: bookIds.length,
      total_fingerprinted: totalFingerprinted || 0,
      sample: results.slice(0, 5),
    });
  } catch (err: any) {
    console.error("Batch fingerprint error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// GET: Stats only (quick check)
export async function GET() {
  try {
    const supabase = await createServerClient();

    const { count: analyzed } = await supabase
      .from("book_analysis")
      .select("book_id", { count: "exact", head: true })
      .not("book_id", "is", null);

    const { data: distinct } = await supabase
      .from("book_analysis")
      .select("book_id");

    const uniqueBooks = new Set((distinct || []).map(r => r.book_id)).size;

    const { count: fingerprinted } = await supabase
      .from("book_fingerprints")
      .select("*", { count: "exact", head: true });

    return NextResponse.json({
      analyzed_rows: analyzed || 0,
      unique_analyzed_books: uniqueBooks,
      fingerprinted_books: fingerprinted || 0,
      remaining: Math.max(0, uniqueBooks - (fingerprinted || 0)),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
