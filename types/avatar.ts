// ============================================================================
// CineRealm: Avatar Evolution Types
// TypeScript interfaces for the 4-Stage Gamified Avatar Evolution Algorithm.
//
// These types model the user-owned AI Viewer Avatar that evolves from
// Level 1 (base generation) through Level 5 (systemic analysis mastery).
// ============================================================================

// ─── Avatar Profile (stored in avatar_profiles table) ──────────────
export interface AvatarProfile {
  id: string;
  user_id: string;
  avatar_name: string;
  level: 1 | 2 | 3 | 4 | 5;
  core_personality: string;
  analysis_focus: string;
  agent_tone: string;
  cinematic_preferences: string[];
  beloved_tropes: string[];
  dislikes: string[];
  hot_buttons: string[];
  memory_context: string;
  recent_adjustments: string;
  systemic_analysis_unlocked: boolean;
  interaction_count: number;
  created_at?: string;
  updated_at?: string;
}

// ─── Stage 1 — Onboarding Answers ──────────────────────────────────
export interface OnboardingAnswers {
  /** Q1: What aspect of a movie matters most to you? */
  q1_focus: "plot_and_logic" | "character_and_prose" | "thematic_depth" | "worldbuilding" | "emotional_impact" | "systemic_and_roots";

  /** Q2: If you were a cinematic critic, how would you describe your voice? */
  q2_tone: "analytical" | "passionate" | "skeptical" | "empathetic" | "clinical" | "playful" | "philosophical" | "critical" | "systemic_transmitter";

  /** Q3: Name a movie that changed you. */
  q3_favorite_book: string;
}

// ─── Stage 2 — Parsed Movie Data (from streaming list import) ─────────
export interface ParsedBookEntry {
  title: string;
  author?: string;
  rating: number;           // 1–5 or 1–10 (normalized internally)
  genre?: string;
  tropes?: string[];
  tags?: string[];          // Author names, additional authors, raw shelf labels
  review_notes?: string;
}

export interface ParsedBookData {
  source: string;           // e.g. "goodstreams", "storygraph", "manual"
  movies: ParsedBookEntry[];
}

// ─── Stage 3 — User Feedback Action ────────────────────────────────
export type FeedbackAction =
  | "approve"                // User liked the avatar's stance — reinforce it
  | "harden_stance"          // Avatar was too soft — be more aggressive/skeptical
  | "soften_stance"          // Avatar was too harsh — show more empathy
  | "expand_horizon"         // Avatar was narrow — broaden analysis scope
  | "go_deeper"              // Avatar was surface-level — demand deeper analysis
  | "add_humor"              // Avatar was too dry — inject wit and personality
  | "custom";                // Free-form feedback in discussion_context

export interface FeedbackPayload {
  avatar_id: string;
  feedback_action: FeedbackAction;
  discussion_context: string;  // What happened, what the avatar said, what the user wants
}

// ─── Stage 4 — Evolution Snapshot ──────────────────────────────────
export interface EvolutionSnapshot {
  from_level: number;
  to_level: number;
  stage: string;              // "base_generation" | "memory_injection" | "rhlf_feedback" | "mastery_unlock"
  changes_applied: string[];  // Human-streamable list of what changed
  applied_at: string;         // ISO timestamp
}

// ─── API Types ─────────────────────────────────────────────────────

/** POST /api/avatars/generate — the shape the frontend component sends */
export interface AvatarGenerateRequest {
  focus: OnboardingAnswers["q1_focus"];
  tone: OnboardingAnswers["q2_tone"];
  favoriteBook: string;
  avatarName?: string;       // optional custom name, falls back to a generated one
}

/** POST /api/avatars/generate — success response */
export interface AvatarGenerateResponse {
  success: true;
  avatar: AvatarProfile;
}

/** POST /api/avatars/generate — error response */
export interface AvatarGenerateError {
  success: false;
  error: string;
}

export interface CompiledSystemPrompt {
  /** The full system prompt string sent to the LLM */
  prompt: string;
  /** Estimated token count (approximate, for cost tracking) */
  estimated_tokens: number;
  /** Which avatar profile was compiled */
  avatar_id: string;
  /** Whether systemic analysis rules are included (Level 5 only) */
  systemic_analysis_active: boolean;
}
