// ============================================================================
// CineRealm — Avatar Generation API
// POST /api/avatars/generate
//
// Receives the onboarding quiz answers from the AvatarBuilder component,
// maps them to the engine's OnboardingAnswers shape, runs the 4-stage
// evolution pipeline's Stage 1, and returns the Level 1 AvatarProfile.
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { generateBaseAvatar } from "@/lib/evolution/avatar-evolution";
import type {
  AvatarGenerateRequest,
  AvatarGenerateResponse,
  AvatarGenerateError,
} from "@/types/avatar";

export const runtime = "nodejs";
export const maxDuration = 60; // 60 seconds for Level 1 generation + DB persistence

/**
 * POST /api/avatars/generate
 *
 * Authentication: Supabase Auth session cookie (auto-detected by server client).
 * Redirects unauthenticated users to /login from the component side, but
 * this route returns 401 if no valid session exists.
 *
 * Body (AvatarGenerateRequest):
 *   focus         — Q1 answer: analysis focus key
 *   tone          — Q2 answer: agent tone key
 *   favoriteBook  — Q3 answer: the movie that changed them
 *   avatarName    — (optional) custom avatar name
 *
 * Response (200): { success: true, avatar: AvatarProfile }
 * Response (400): { success: false, error: "..." }
 * Response (401): { success: false, error: "..." }
 * Response (500): { success: false, error: "..." }
 */
export async function POST(
  request: NextRequest,
): Promise<NextResponse<AvatarGenerateResponse | AvatarGenerateError>> {
  try {
    // ── Authenticate via Supabase Auth session ───────────────
    const supabase = await createServerClient();
    const {
      data: { session },
      error: sessionErr,
    } = await supabase.auth.getSession();

    if (sessionErr) {
      console.error("[Avatar Generate] Session error:", sessionErr.message);
      return NextResponse.json(
        { success: false, error: "Authentication error — please log in again" },
        { status: 401 },
      );
    }

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Not authenticated — log in first" },
        { status: 401 },
      );
    }

    const userId = session.user.id;

    // ── Parse and validate body ──────────────────────────────
    const body: AvatarGenerateRequest = await request.json();

    const { focus, tone, favoriteBook, avatarName } = body;

    // Validate required fields
    if (!focus) {
      return NextResponse.json(
        { success: false, error: "focus is required" },
        { status: 400 },
      );
    }
    if (!tone) {
      return NextResponse.json(
        { success: false, error: "tone is required" },
        { status: 400 },
      );
    }
    if (!favoriteBook || favoriteBook.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "favoriteBook is required" },
        { status: 400 },
      );
    }

    // ── Map component fields → engine OnboardingAnswers ──────
    // The component sends `focus`, `tone`, `favoriteBook`.
    // The engine expects `q1_focus`, `q2_tone`, `q3_favorite_book`.
    const answers = {
      q1_focus: focus,
      q2_tone: tone,
      q3_favorite_book: favoriteBook.trim(),
    };

    // Generate a default avatar name from the focus + tone + random suffix
    const effectiveName =
      avatarName?.trim() ||
      generateAvatarName(focus, tone);

    // ── Run Stage 1 — Base Generation (Level 1) ──────────────
    const profile = await generateBaseAvatar(answers, userId, effectiveName);

    // ── Return success ──────────────────────────────────────
    return NextResponse.json({
      success: true,
      avatar: profile,
    });
  } catch (err: any) {
    console.error("[Avatar Generate] Error:", err);

    // Distinguish validation errors from engine errors
    const message = err?.message || "Internal server error";
    const status =
      message.includes("required") || message.includes("Invalid") ? 400 : 500;

    return NextResponse.json(
      { success: false, error: message },
      { status },
    );
  }
}

// ─── Helpers ──────────────────────────────────────────────────────

const AVATAR_ADJECTIVES = [
  "Incisive", "Empathetic", "Skeptical", "Passionate", "Clinical",
  "Philosophical", "Playful", "Analytical", "Systemic", "Deep",
];

const AVATAR_NOUNS = [
  "Viewer", "Critic", "Oracle", "Sage", "Scholar",
  "Witness", "Cartographer", "Architect", "Nomad", "Flaneur",
];

/**
 * Deterministic-ish name generator from focus + tone.
 * Same inputs produce the same name (idempotent for retry safety).
 */
function generateAvatarName(focus: string, tone: string): string {
  const focusHash = simpleHash(focus);
  const toneHash = simpleHash(tone);

  const adj = AVATAR_ADJECTIVES[focusHash % AVATAR_ADJECTIVES.length];
  const noun = AVATAR_NOUNS[(focusHash + toneHash) % AVATAR_NOUNS.length];

  return `${adj} ${noun}`;
}

/** Fast non-crypto string hash for deterministic name selection */
function simpleHash(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}
