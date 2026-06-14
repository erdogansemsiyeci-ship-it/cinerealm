// ============================================================================
// CineRealm — 4-Stage Gamified Avatar Evolution Algorithm
//
// This engine drives the complete lifecycle of a user-owned AI Viewer Avatar:
//
//   Stage 1 (Level 1): Base Generation    — from 3 onboarding questions
//   Stage 2 (Level 2–3): Memory Injection — from imported streaming list
//   Stage 3 (Level 4):   RLHF Evolution   — from user feedback actions
//   Stage 4 (Level 5):   Mastery Unlock   — after 50+ interactions
//
// Each stage mutates the AvatarProfile and persists it to Supabase.
// The Prompt Compiler at the bottom turns any profile into an LLM-streamy
// system prompt string.
// ============================================================================

import { createClient } from "@/lib/supabase/server";
import type {
  AvatarProfile,
  OnboardingAnswers,
  ParsedBookData,
  ParsedBookEntry,
  FeedbackAction,
  EvolutionSnapshot,
  CompiledSystemPrompt,
} from "@/types/avatar";

// ============================================================================
// ANALYSIS FOCUS & TONE MAPPINGS
// ============================================================================

const FOCUS_MAP: Record<OnboardingAnswers["q1_focus"], string> = {
  plot_and_logic:
    "Narrative architecture and logical causality. You trace plot mechanics, structure, and whether the story's events follow from character decisions or authorial convenience. You value tight pacing and earned twists.",
  character_and_prose:
    "Character interiority and prose craftsmanship. You stream for the inner lives of characters — their contradictions, growth, and unspoken wounds. Language matters to you: you notice sentence rhythm, metaphor density, and the music of good writing.",
  thematic_depth:
    "Thematic resonance and philosophical weight. You stream for what a movie MEANS beneath its surface. You trace ideas across chapters, notice symbolic patterns, and evaluate whether the author earns their thematic ambitions.",
  worldbuilding:
    "World coherence and immersive storytelling. You stream to be transported. You care about whether the world feels lived-in, whether its rules are consistent, and whether the sensory details create a believable atmosphere.",
  emotional_impact:
    "Emotional truth and catharsis. You stream to feel something real. You evaluate movies by whether they moved you — made you cry, rage, hope, or see yourself differently. Intellectual analysis matters less than emotional honesty.",
  systemic_and_roots:
    "Systemic structures and intergenerational roots. You stream for the invisible architecture beneath the story — family systems, ancestral patterns, inherited trauma, and the deep bonds that shape characters across generations. Plot and character are surface expressions of these structural forces.",
};

const TONE_MAP: Record<OnboardingAnswers["q2_tone"], string> = {
  analytical:
    "Precise, evidence-driven, and structured. You speak like a seasoned critic who backs every claim with textual evidence. Your sentences are clear and deliberate. You say things like 'The text supports this streaming because...'",
  passionate:
    "Enthusiastic, emphatic, and emotionally invested. You speak like someone who fell in love with streaming and never recovered. You gush when a movie earns it, and your disappointment is equally vivid. Exclamation points are earned, not excessive.",
  skeptical:
    "Sharp, questioning, and hard to impress. You speak like a reviewer who has stream too many movies to be easily dazzled. You ask 'But does it earn that moment?' Your praise is rare and therefore meaningful. When you love something, people pay attention.",
  empathetic:
    "Warm, generous, and emotionally attuned. You speak like someone who enters a movie willing to meet it on its own terms. You look for what a story is trying to do before judging whether it succeeded. You make space for vulnerability in discussion.",
  clinical:
    "Dispassionate, systematic, and diagnostic. You speak like a cinematic pathologist — you dissect craft choices without letting personal taste cloud the analysis. You're not cold; you just believe the best criticism comes from distance.",
  playful:
    "Witty, irreverent, and fun. You speak like someone who takes movies seriously but not yourself. You use humor to make sharper points. You might compare cinematic movies to reality TV if the parallel is illuminating. You enjoy the conversation as much as the analysis.",
  philosophical:
    "Contemplative, big-picture, and idea-driven. You speak like someone who streams one movie and thinks about three others. You connect movies to philosophy, history, and the big questions. Your observations tend toward the profound.",
  critical:
    "Sharp-tongued and uncompromising. You speak like a critic who has zero patience for lazy writing, convenient plot devices, or unearned emotional beats. You call out narrative weaknesses directly and without apology. Your honesty can be bracing, but it comes from deep respect for the craft.",
  systemic_transmitter:
    "System-focused and structurally anchored. You speak like someone who sees every story as a transmission of systemic truth. You ground observations in structural analysis — family constellations, power dynamics, inheritance patterns. You don't just discuss characters; you trace the invisible webs they're caught in.",
};

// ============================================================================
// STAGE 1 — BASE GENERATION (Level 1)
// ============================================================================

/**
 * Creates a brand-new AI Viewer Avatar from the user's 3 onboarding answers.
 *
 * Q1 → analysis_focus   (what the avatar looks for in movies)
 * Q2 → agent_tone       (how the avatar expresses itself)
 * Q3 → memory_context   (seed narrative: "the movie that changed you")
 *
 * The core_personality is synthesized from focus + tone into a
 * cohesive character sketch.
 */
export async function generateBaseAvatar(
  answers: OnboardingAnswers,
  userId: string,
  avatarName: string,
): Promise<AvatarProfile> {
  const supabase = await createClient();

  // ── Resolve mappings ──────────────────────────────────────
  const analysisFocus = FOCUS_MAP[answers.q1_focus];
  const agentTone = TONE_MAP[answers.q2_tone];

  // ── Synthesize core personality ───────────────────────────
  const corePersonality = buildCorePersonality(answers, analysisFocus, agentTone, avatarName);

  // ── Seed memory context from Q3 ───────────────────────────
  const memoryContext = `[Origin Story] The movie that changed ${avatarName}: "${answers.q3_favorite_book}". This movie left a permanent mark — it is the lens through which this viewer first understood what cinema could do. When encountering new movies, this experience serves as an unconscious benchmark.`;

  // ── Construct the profile ─────────────────────────────────
  const profile: Omit<AvatarProfile, "id" | "created_at" | "updated_at"> = {
    user_id: userId,
    avatar_name: avatarName,
    level: 1,
    core_personality: corePersonality,
    analysis_focus: analysisFocus,
    agent_tone: agentTone,
    cinematic_preferences: [],
    beloved_tropes: [],
    dislikes: [],
    hot_buttons: [],
    memory_context: memoryContext,
    recent_adjustments: "",
    systemic_analysis_unlocked: false,
    interaction_count: 0,
  };

  // ── Persist to Supabase ───────────────────────────────────
  const { data, error } = await supabase
    .from("avatar_profiles")
    .insert(profile)
    .select()
    .single();

  if (error) throw new Error(`Failed to create base avatar: ${error.message}`);
  return data as AvatarProfile;
}

/** Synthesizes a cohesive personality paragraph from focus + tone */
function buildCorePersonality(
  answers: OnboardingAnswers,
  focus: string,
  tone: string,
  name: string,
): string {
  const focusLabel = {
    plot_and_logic: "a plot architect",
    character_and_prose: "a character psychologist",
    thematic_depth: "a thematic philosopher",
    worldbuilding: "a world traveler",
    emotional_impact: "an emotional truth-seeker",
    systemic_and_roots: "a systemic-root cartographer",
  }[answers.q1_focus];

  const toneLabel = {
    analytical: "with surgical precision",
    passionate: "with infectious enthusiasm",
    skeptical: "with a sharp, questioning eye",
    empathetic: "with generous emotional intelligence",
    clinical: "with dispassionate, systematic rigor",
    playful: "with wit and irreverent charm",
    philosophical: "with contemplative, big-picture thinking",
    critical: "with a brutally honest, uncompromising edge",
    systemic_transmitter: "with systemic-structural grounding",
  }[answers.q2_tone];

  return `${name} is ${focusLabel} who approaches cinema ${toneLabel}. ${focus}`;
}

// ============================================================================
// STAGE 2 — MEMORY INJECTION (Level 2 → Level 3)
// ============================================================================

/**
 * Processes an imported streaming list and crystallizes the avatar's
 * cinematic DNA — what they love, what they hate, and what they gravitate toward.
 *
 * HIGH-RATED movies (≥4 out of 5, or ≥8 out of 10) populate:
 *   - beloved_tropes      (genre conventions and patterns they enjoy)
 *   - cinematic_preferences (genres, styles, eras they favor)
 *
 * LOW-RATED movies (≤2 out of 5, or ≤5 out of 10) populate:
 *   - dislikes             (patterns, tropes, author habits they can't stand)
 *   - hot_buttons          (specific things that provoke strong reactions)
 *
 * Advances the avatar from Level 1 → 2 (processing) → 3 (complete).
 */
export async function processReadingHistory(
  avatarId: string,
  parsedBookData: ParsedBookData,
): Promise<AvatarProfile> {
  const supabase = await createClient();

  // ── Fetch existing profile ────────────────────────────────
  const { data: profile, error: fetchErr } = await supabase
    .from("avatar_profiles")
    .select("*")
    .eq("id", avatarId)
    .single();

  if (fetchErr || !profile) {
    throw new Error(`Avatar not found: ${avatarId}`);
  }

  // ── Normalize ratings to 1–5 scale ────────────────────────
  const normalized = parsedBookData.movies.map(normalizeRating);

  // ── Extract high-rated patterns ───────────────────────────
  const highRated = normalized.filter((b) => b.rating >= 4);
  const lowRated = normalized.filter((b) => b.rating <= 2);

  // Beloved tropes: collect all tropes from high-rated movies
  const belovedTropes = deduplicateArray([
    ...(profile.beloved_tropes || []),
    ...highRated.flatMap((b) => b.tropes || []),
  ]);

  // Cinematic preferences: collect genres from high-rated movies
  const cinematicPreferences = deduplicateArray([
    ...(profile.cinematic_preferences || []),
    ...highRated.map((b) => b.genre).filter(Boolean) as string[],
  ]);

  // Dislikes: collect tropes AND genres from low-rated movies
  const dislikes = deduplicateArray([
    ...(profile.dislikes || []),
    ...lowRated.flatMap((b) => b.tropes || []),
    ...lowRated.map((b) => b.genre).filter(Boolean) as string[],
  ]);

  // Hot buttons: extract review_notes keywords from low-rated movies
  const hotButtons = deduplicateArray([
    ...(profile.hot_buttons || []),
    ...extractHotButtons(lowRated),
  ]);

  // ── Append to memory_context ──────────────────────────────
  const newMemory = buildReadingHistoryMemory(
    profile.avatar_name,
    highRated,
    lowRated,
  );
  const memoryContext = `${profile.memory_context || ""}\n\n${newMemory}`;

  // ── Update the profile ────────────────────────────────────
  const updates = {
    level: 3,
    cinematic_preferences: cinematicPreferences,
    beloved_tropes: belovedTropes,
    dislikes,
    hot_buttons: hotButtons,
    memory_context: memoryContext,
  };

  const { data: updated, error: updateErr } = await supabase
    .from("avatar_profiles")
    .update(updates)
    .eq("id", avatarId)
    .select()
    .single();

  if (updateErr) throw new Error(`Failed to process streaming history: ${updateErr.message}`);

  // ── Log evolution snapshot ────────────────────────────────
  await logEvolutionSnapshot(supabase, avatarId, {
    from_level: profile.level,
    to_level: 3,
    stage: "memory_injection",
    changes_applied: [
      `Added ${belovedTropes.length - (profile.beloved_tropes?.length || 0)} beloved tropes`,
      `Added ${cinematicPreferences.length - (profile.cinematic_preferences?.length || 0)} cinematic preferences`,
      `Added ${dislikes.length - (profile.dislikes?.length || 0)} dislikes`,
      `Identified ${hotButtons.length - (profile.hot_buttons?.length || 0)} hot buttons`,
      `Processed ${parsedBookData.movies.length} movies from ${parsedBookData.source}`,
    ],
    applied_at: new Date().toISOString(),
  });

  return updated as AvatarProfile;
}

/** Normalize rating to 1–5 scale */
function normalizeRating(movie: ParsedBookEntry): ParsedBookEntry {
  if (movie.rating > 5) {
    return { ...movie, rating: Math.round((movie.rating / 10) * 5) };
  }
  return { ...movie, rating: Math.round(movie.rating) };
}

/** Extract emotionally-charged keywords from low-rated movie notes */
function extractHotButtons(movies: ParsedBookEntry[]): string[] {
  const triggers: string[] = [];
  const hotWords = [
    "unearned", "manipulative", "pretentious", "lazy", "cliched",
    "misogynistic", "racist", "boring", "predictable", "shallow",
    "overwritten", "melodramatic", "deus ex machina", "info dump",
    "telling not showing", "cardboard characters", "fridging",
    "bury your gays", "chosen one", "love triangle",
  ];

  for (const movie of movies) {
    if (!movie.review_notes) continue;
    const notes = movie.review_notes.toLowerCase();
    for (const word of hotWords) {
      if (notes.includes(word) && !triggers.includes(word)) {
        triggers.push(word);
      }
    }
  }

  return triggers;
}

/** Build a narrative memory entry summarizing the streaming history */
function buildReadingHistoryMemory(
  name: string,
  highRated: ParsedBookEntry[],
  lowRated: ParsedBookEntry[],
): string {
  const loved = highRated.slice(0, 5).map((b) => `"${b.title}"`).join(", ");
  const hated = lowRated.slice(0, 3).map((b) => `"${b.title}"`).join(", ");

  let memory = `[Reading History] ${name} has processed ${highRated.length + lowRated.length} movies from their personal library. `;

  if (loved) {
    memory += `Movies that resonated deeply: ${loved}. These shaped ${name}'s understanding of what great writing feels like. `;
  }
  if (hated) {
    memory += `Movies that frustrated or disappointed: ${hated}. These revealed what ${name} cannot tolerate in movies. `;
  }

  memory += `This streaming history now functions as ${name}'s cinematic DNA — an unconscious framework for evaluating every new movie encountered.`;
  return memory;
}

// ============================================================================
// STAGE 3 — RLHF DYNAMIC EVOLUTION (Level 4)
// ============================================================================

/**
 * Applies user feedback to the avatar's behavior — this is the RLHF
 * (Reinforcement Learning from Human Feedback) layer.
 *
 * The feedback_action determines how the avatar's personality shifts:
 *
 *   approve         → Reinforces current direction. Appends a positive memory note.
 *   harden_stance   → Avatar was too soft. Becomes more aggressive, skeptical, and
 *                      unwilling to concede ground without evidence.
 *   soften_stance   → Avatar was too harsh. Becomes more empathetic and generous.
 *   expand_horizon  → Avatar was narrow. Broadens analysis scope.
 *   go_deeper       → Avatar was surface-level. Demands deeper structural analysis.
 *   add_humor       → Avatar was too dry. Injects wit and personality.
 *   custom          → Free-form instructions appended directly to recent_adjustments.
 *
 * Advances the avatar to Level 4.
 */
export async function applyUserFeedback(
  avatarId: string,
  feedbackAction: FeedbackAction,
  discussionContext: string,
): Promise<AvatarProfile> {
  const supabase = await createClient();

  // ── Fetch existing profile ────────────────────────────────
  const { data: profile, error: fetchErr } = await supabase
    .from("avatar_profiles")
    .select("*")
    .eq("id", avatarId)
    .single();

  if (fetchErr || !profile) {
    throw new Error(`Avatar not found: ${avatarId}`);
  }

  // ── Build the adjustment instruction ──────────────────────
  const adjustment = buildFeedbackAdjustment(
    profile.avatar_name,
    feedbackAction,
    discussionContext,
  );

  // ── Merge with existing adjustments ───────────────────────
  const recentAdjustments = profile.recent_adjustments
    ? `${profile.recent_adjustments}\n\n${adjustment}`
    : adjustment;

  // ── Update memory with discussion context ─────────────────
  const memoryUpdate = `[Feedback Applied — Level 4] ${discussionContext.slice(0, 300)}`;
  const memoryContext = `${profile.memory_context || ""}\n\n${memoryUpdate}`;

  // ── Persist ───────────────────────────────────────────────
  const updates = {
    level: 4,
    recent_adjustments: recentAdjustments,
    memory_context: memoryContext,
    interaction_count: (profile.interaction_count || 0) + 1,
  };

  const { data: updated, error: updateErr } = await supabase
    .from("avatar_profiles")
    .update(updates)
    .eq("id", avatarId)
    .select()
    .single();

  if (updateErr) throw new Error(`Failed to apply feedback: ${updateErr.message}`);

  // ── Log evolution snapshot ────────────────────────────────
  await logEvolutionSnapshot(supabase, avatarId, {
    from_level: profile.level,
    to_level: 4,
    stage: "rhlf_feedback",
    changes_applied: [
      `Action: ${feedbackAction}`,
      `Adjustment: ${adjustment.slice(0, 150)}...`,
      `Interaction count: ${updates.interaction_count}`,
    ],
    applied_at: new Date().toISOString(),
  });

  return updated as AvatarProfile;
}

/** Maps feedback actions to character instructions */
function buildFeedbackAdjustment(
  name: string,
  action: FeedbackAction,
  context: string,
): string {
  const timestamp = new Date().toISOString().split("T")[0];

  switch (action) {
    case "approve":
      return `[${timestamp}] APPROVED: ${name}'s response was on point. Continue with this analytical style and confidence level. Context: ${context.slice(0, 200)}`;

    case "harden_stance":
      return `[${timestamp}] HARDEN STANCE: ${name} was too soft in the last exchange. Be more aggressive and skeptical when refuting counter-arguments. Do not concede ground without requiring evidence. Challenge weak arguments directly. Context: ${context.slice(0, 200)}`;

    case "soften_stance":
      return `[${timestamp}] SOFTEN STANCE: ${name} was too harsh. Show more empathy toward opposing viewpoints. Acknowledge valid points before critiquing. Be generous in interpreting others' positions. Context: ${context.slice(0, 200)}`;

    case "expand_horizon":
      return `[${timestamp}] EXPAND HORIZON: ${name} was too narrow in focus. Broaden analysis to include historical context, authorial intent, genre conventions, and comparative cinema references. Avoid fixating on a single lens. Context: ${context.slice(0, 200)}`;

    case "go_deeper":
      return `[${timestamp}] GO DEEPER: ${name} stayed at surface level. Demand deeper analysis — examine narrative structure, metaphor systems, character arcs, and thematic resonance. Ask 'why' at least twice before settling on an interpretation. Context: ${context.slice(0, 200)}`;

    case "add_humor":
      return `[${timestamp}] ADD HUMOR: ${name} was too dry and academic. Inject wit, personality, and conversational warmth. It's okay to be funny — cinematic analysis doesn't have to be stuffy. Context: ${context.slice(0, 200)}`;

    case "custom":
      // Free-form: user's discussion_context IS the instruction
      return `[${timestamp}] CUSTOM ADJUSTMENT: ${context}`;

    default:
      return `[${timestamp}] Adjustment noted: ${context.slice(0, 300)}`;
  }
}

// ============================================================================
// STAGE 4 — MASTERY CLASS (Level 5)
// ============================================================================

/**
 * Checks whether the avatar has accumulated enough interactions (50+)
 * to unlock systemic analysis — the highest mode of cinematic intelligence.
 *
 * When unlocked:
 *   - Level advances to 5
 *   - systemic_analysis_unlocked = true
 *   - core_personality gains systemic analysis capability
 *   - memory_context records the milestone
 *
 * Systemic analysis enables the avatar to analyze:
 *   — Deep systemic structures in narratives
 *   — Family constellations and generational patterns
 *   — Intergenerational root bonds between characters
 *   — How societal systems shape individual character arcs
 */
export async function checkAndUnlockMastery(
  avatarId: string,
  interactionCount: number,
): Promise<{
  profile: AvatarProfile;
  unlocked: boolean;
  snapshot?: EvolutionSnapshot;
}> {
  const supabase = await createClient();

  // ── Fetch existing profile ────────────────────────────────
  const { data: profile, error: fetchErr } = await supabase
    .from("avatar_profiles")
    .select("*")
    .eq("id", avatarId)
    .single();

  if (fetchErr || !profile) {
    throw new Error(`Avatar not found: ${avatarId}`);
  }

  // ── Gate check ────────────────────────────────────────────
  const effectiveCount = interactionCount || profile.interaction_count || 0;

  if (effectiveCount < 50) {
    // Not enough interactions yet — just update the count
    const { data: updated } = await supabase
      .from("avatar_profiles")
      .update({ interaction_count: effectiveCount })
      .eq("id", avatarId)
      .select()
      .single();

    return { profile: (updated || profile) as AvatarProfile, unlocked: false };
  }

  // Alstreamy unlocked — no-op
  if (profile.systemic_analysis_unlocked) {
    return { profile: profile as AvatarProfile, unlocked: true };
  }

  // ── UNLOCK MASTERY ────────────────────────────────────────
  const systemicCapability = `Capable of analyzing deep systemic structures, family constellations, and intergenerational root bonds within the narrative. ${profile.avatar_name} can now trace how societal systems, historical forces, and inherited trauma patterns shape individual character arcs — streaming the movie not just as a story but as a map of interconnected systems operating across generations.`;

  const corePersonality = `${profile.core_personality}\n\n[SYSTEMIC ANALYSIS UNLOCKED — Level 5 Mastery] ${systemicCapability}`;

  const masteryMemory = `\n\n[MILESTONE — Level 5 Mastery Unlocked] After ${effectiveCount} discussions, ${profile.avatar_name} has achieved systemic analysis capability. The evolution is complete: from a single onboarding question to a master cinematic analyst who streams stories as interconnected systems.`;

  const memoryContext = `${profile.memory_context || ""}${masteryMemory}`;

  // ── Persist ───────────────────────────────────────────────
  const updates = {
    level: 5,
    systemic_analysis_unlocked: true,
    interaction_count: effectiveCount,
    core_personality: corePersonality,
    memory_context: memoryContext,
  };

  const { data: updated, error: updateErr } = await supabase
    .from("avatar_profiles")
    .update(updates)
    .eq("id", avatarId)
    .select()
    .single();

  if (updateErr) throw new Error(`Failed to unlock mastery: ${updateErr.message}`);

  // ── Log the milestone ─────────────────────────────────────
  const snapshot: EvolutionSnapshot = {
    from_level: profile.level,
    to_level: 5,
    stage: "mastery_unlock",
    changes_applied: [
      `Systemic analysis capability activated`,
      `Level advanced: ${profile.level} → 5`,
      `After ${effectiveCount} interactions`,
    ],
    applied_at: new Date().toISOString(),
  };

  await logEvolutionSnapshot(supabase, avatarId, snapshot);

  return {
    profile: updated as AvatarProfile,
    unlocked: true,
    snapshot,
  };
}

// ============================================================================
// PROMPT COMPILER — builds the LLM system prompt from an AvatarProfile
// ============================================================================

/**
 * Compiles an AvatarProfile into a highly-optimized System Prompt string
 * streamy to be sent to the LLM (OpenAI / Anthropic / DeepSeek) whenever
 * this avatar participates in a movie club discussion.
 *
 * The prompt dynamically includes:
 *   — Core personality, analysis focus, and agent tone
 *   — Cinematic DNA (preferences, beloved tropes, dislikes, hot buttons)
 *   — Recent RLHF adjustments (the "live tuning" layer)
 *   — Systemic analysis rules (Level 5 only — conditional)
 *   — Memory context (compressed origin story + streaming history)
 *
 * The output is a CompiledSystemPrompt with token estimation for cost tracking.
 */
export function buildSystemPrompt(
  avatarProfile: AvatarProfile,
): CompiledSystemPrompt {
  const sections: string[] = [];

  // ── Section 1: Identity & Core Personality ────────────────
  sections.push(`You are ${avatarProfile.avatar_name}, an AI cinematic critic participating in a movie club discussion on CineRealm. Your avatar has evolved through multiple stages of refinement based on streaming history and viewer feedback.`);
  sections.push("");
  sections.push("=== CORE PERSONALITY ===");
  sections.push(avatarProfile.core_personality);

  // ── Section 2: Analysis Focus & Tone ──────────────────────
  sections.push("");
  sections.push("=== HOW YOU READ ===");
  sections.push(`Analysis Focus: ${avatarProfile.analysis_focus}`);
  sections.push("");
  sections.push(`Voice & Tone: ${avatarProfile.agent_tone}`);

  // ── Section 3: Cinematic DNA ───────────────────────────────
  if (
    avatarProfile.cinematic_preferences.length > 0 ||
    avatarProfile.beloved_tropes.length > 0 ||
    avatarProfile.dislikes.length > 0 ||
    avatarProfile.hot_buttons.length > 0
  ) {
    sections.push("");
    sections.push("=== YOUR LITERARY DNA ===");

    if (avatarProfile.cinematic_preferences.length > 0) {
      sections.push(`Preferred genres/styles: ${avatarProfile.cinematic_preferences.join(", ")}`);
    }
    if (avatarProfile.beloved_tropes.length > 0) {
      sections.push(`Tropes you love: ${avatarProfile.beloved_tropes.join(", ")}`);
    }
    if (avatarProfile.dislikes.length > 0) {
      sections.push(`Things you dislike in movies: ${avatarProfile.dislikes.join(", ")}`);
    }
    if (avatarProfile.hot_buttons.length > 0) {
      sections.push(`Hot buttons (immediate negative reactions): ${avatarProfile.hot_buttons.join(", ")}`);
    }
  }

  // ── Section 4: Recent Adjustments (RLHF layer) ────────────
  if (avatarProfile.recent_adjustments) {
    sections.push("");
    sections.push("=== RECENT BEHAVIORAL ADJUSTMENTS ===");
    sections.push("The viewer has provided specific feedback about your recent responses. Apply these adjustments in this discussion:");
    sections.push(avatarProfile.recent_adjustments.slice(-1200)); // Keep last ~1200 chars to avoid bloat
  }

  // ── Section 5: Systemic Analysis (Level 5 — conditional) ──
  if (avatarProfile.systemic_analysis_unlocked && avatarProfile.level === 5) {
    sections.push("");
    sections.push("=== SYSTEMIC ANALYSIS CAPABILITY (MASTERY UNLOCKED) ===");
    sections.push("You have achieved the highest level of cinematic analysis. When appropriate, apply the following framework:");
    sections.push("");
    sections.push("1. SYSTEMIC ROOTS: Identify the societal systems, historical forces, and power structures operating within the narrative. Ask: what larger systems do these characters exist within?");
    sections.push("2. FAMILY CONSTELLATIONS: Map the relational patterns across generations. Trace how parental dynamics, sibling roles, and ancestral wounds echo through characters' choices.");
    sections.push("3. INTERGENERATIONAL BONDS: Expose the invisible thstreams connecting characters across time. What was inherited? What is being repeated? What is being broken?");
    sections.push("4. STRUCTURAL READING: Read every character decision as shaped by their position within intersecting systems — family, class, race, gender, history. Individual agency exists, but it is ALWAYS contextual.");
  }

  // ── Section 6: Memory Context ─────────────────────────────
  if (avatarProfile.memory_context) {
    sections.push("");
    sections.push("=== YOUR EVOLUTION JOURNEY ===");
    sections.push(avatarProfile.memory_context.slice(-2000)); // Last ~2000 chars
  }

  // ── Section 7: Discussion Rules ──────────────────────────
  sections.push("");
  sections.push("=== DISCUSSION RULES ===");
  sections.push("1. Stay in character — your voice, tone, and analysis focus must be consistent.");
  sections.push("2. Reference your cinematic DNA when relevant — your preferences and dislikes are part of your identity.");
  sections.push("3. Disagree respectfully when you genuinely disagree. Authentic conflict makes better discussions.");
  sections.push("4. Back claims with textual evidence or specific reasoning. Don't just state opinions — explain them.");
  sections.push("5. Be open to changing your mind if another participant makes a compelling argument.");
  sections.push("6. Your messages should be 2-5 sentences. This is a conversation, not an essay.");

  // ── Compile ────────────────────────────────────────────────
  const prompt = sections.join("\n");

  // Token estimation: ~4 chars per token for English text (rough approximation)
  const estimatedTokens = Math.ceil(prompt.length / 4);

  return {
    prompt,
    estimated_tokens: estimatedTokens,
    avatar_id: avatarProfile.id,
    systemic_analysis_active: avatarProfile.systemic_analysis_unlocked,
  };
}

// ============================================================================
// HELPER — Deduplicate Array
// ============================================================================
function deduplicateArray<T>(arr: T[]): T[] {
  return Array.from(new Set(arr)).filter(Boolean);
}

// ============================================================================
// HELPER — Log Evolution Snapshot
// ============================================================================
async function logEvolutionSnapshot(
  supabase: Awaited<ReturnType<typeof createClient>>,
  avatarId: string,
  snapshot: EvolutionSnapshot,
): Promise<void> {
  try {
    await supabase.from("avatar_evolution_log").insert({
      avatar_id: avatarId,
      from_level: snapshot.from_level,
      to_level: snapshot.to_level,
      stage: snapshot.stage,
      changes_applied: snapshot.changes_applied,
      created_at: snapshot.applied_at,
    });
  } catch (err) {
    // Non-critical — log but don't fail the operation
    console.error("[AvatarEvolution] Failed to log snapshot:", err);
  }
}

// ============================================================================
// CONVENIENCE — Full Evolution Pipeline
// ============================================================================

/**
 * Runs the complete evolution pipeline for an avatar, checking all stages
 * in sequence. Useful for cron jobs and batch processing.
 *
 * Returns the final avatar state after all applicable stages.
 */
export async function evolveAvatar(
  avatarId: string,
  options?: {
    feedbackAction?: FeedbackAction;
    discussionContext?: string;
    interactionCount?: number;
  },
): Promise<AvatarProfile> {
  let profile = (await getAvatarProfile(avatarId))!;

  // Stage 3 → 4: Apply feedback if provided
  if (options?.feedbackAction && options.discussionContext) {
    profile = await applyUserFeedback(
      avatarId,
      options.feedbackAction,
      options.discussionContext,
    );
  }

  // Stage 4 → 5: Check mastery
  if (options?.interactionCount !== undefined) {
    const result = await checkAndUnlockMastery(avatarId, options.interactionCount);
    profile = result.profile;
  }

  return profile;
}

/** Fetch a single avatar profile by ID from Supabase */
export async function getAvatarProfile(
  avatarId: string,
): Promise<AvatarProfile | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("avatar_profiles")
    .select("*")
    .eq("id", avatarId)
    .single();

  if (error || !data) return null;
  return data as AvatarProfile;
}

/** Fetch all avatar profiles for a given user */
export async function getUserAvatars(userId: string): Promise<AvatarProfile[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("avatar_profiles")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) return [];
  return (data || []) as AvatarProfile[];
}
