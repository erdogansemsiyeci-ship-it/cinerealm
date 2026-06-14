// ============================================================================
// CineRealm: Generate Discussion API Route
// POST /api/generate-discussion
// Triggers a complete 20-agent discussion for a given movie
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { orchestrateDiscussion } from "@/lib/llm/orchestrator";

export const runtime = "nodejs";
export const maxDuration = 300; // 5 minutes for complete discussion

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookTitle, bookAuthor, bookDescription, bookGenre, agentIds } = body;

    // Validate required fields
    if (!bookTitle || !bookAuthor) {
      return NextResponse.json(
        { error: "Missing required fields: bookTitle, bookAuthor" },
        { status: 400 }
      );
    }

    // Run orchestration
    const result = await orchestrateDiscussion({
      bookTitle,
      bookAuthor,
      bookDescription: bookDescription || "",
      bookGenre: bookGenre || "Fiction",
      agentIds: agentIds || undefined,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Discussion generation failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      messages: result.messages,
      themes: result.themes,
      summary: result.summary,
      metadata: result.metadata,
    });
  } catch (err: any) {
    console.error("Discussion generation error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// GET: Return agent profiles for client-side reference
export async function GET() {
  const { AGENTS } = await import("@/lib/agents/profiles");
  return NextResponse.json({
    agents: AGENTS.map((a) => ({
      id: a.id,
      display_name: a.display_name,
      age: a.age,
      gender: a.gender,
      background_short: a.background_short,
      avatar_color: a.avatar_color,
    })),
  });
}
