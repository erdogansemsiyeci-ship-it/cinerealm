// ============================================================================
// CineRealm — Avatar Evolution: End-to-End Pipeline Tests
//
// Covers every stage of the 4-Stage Gamified Avatar Evolution Algorithm:
//   Stage 1 → Base Generation (Level 1)
//   Stage 2 → Memory Injection (Level 2 → 3)
//   Stage 3 → RLHF Feedback (Level 4)
//   Stage 4 → Mastery Unlock (Level 5)
//
// Run: npx vitest run lib/evolution/__tests__/avatar-evolution.test.ts
// ============================================================================

import { describe, it, expect, beforeEach, beforeAll, vi } from "vitest";
import { mockCreateClient, resetMockStore } from "./mocks/supabase";

// ─── Mock @/lib/supabase/server ─────────────────────────────────
// Every call to createClient() in the engine returns a client facade
// backed by the shared store. resetMockStore() cleans between tests.

vi.mock("@/lib/supabase/server", () => ({
  createClient: mockCreateClient,
}));

// Dynamic import so the mock is live before the engine loads
let engine: typeof import("@/lib/evolution/avatar-evolution");

beforeAll(async () => {
  engine = await import("@/lib/evolution/avatar-evolution");
});

// Reset the shared store before every test for perfect isolation
beforeEach(() => {
  resetMockStore();
  mockCreateClient.mockClear();
});

// ─── Test Data ────────────────────────────────────────────────────

const ONBOARDING = {
  q1_focus: "character_and_prose" as const,
  q2_tone: "skeptical" as const,
  q3_favorite_book: "The Remains of the Day by Kazuo Ishiguro",
};

const USER_ID = "test-user-001";
const AVATAR_NAME = "Cassandra";

const READING_HISTORY = {
  source: "goodreads",
  movies: [
    {
      title: "Never Let Me Go",
      author: "Kazuo Ishiguro",
      rating: 5,
      genre: "cinematic movies",
      tropes: ["unreliable narrator", "quiet devastation", "dystopian"],
      review_notes: "Perfect novel. The restraint broke me.",
    },
    {
      title: "The Secret History",
      author: "Donna Tartt",
      rating: 4,
      genre: "dark academia",
      tropes: ["academic setting", "moral decay", "unreliable narrator"],
      review_notes: "Flawless atmosphere.",
    },
    {
      title: "Where the Crawdads Sing",
      author: "Delia Owens",
      rating: 1,
      genre: "contemporary movies",
      tropes: ["nature writing", "coming of age"],
      review_notes:
        "Predictable, manipulative, telling not showing. The prose was overwritten.",
    },
    {
      title: "The Alchemist",
      author: "Paulo Coelho",
      rating: 2,
      genre: "philosophical movies",
      tropes: ["quest narrative", "spiritual journey"],
      review_notes:
        "Shallow, pretentious pseudo-wisdom. Cardboard characters and a boring fable.",
    },
  ],
};

// ─── Helper: create a base avatar for tests that need a pre-existing profile ──

async function seedBaseAvatar(): Promise<string> {
  const profile = await engine.generateBaseAvatar(ONBOARDING, USER_ID, AVATAR_NAME);
  return profile.id;
}

// ============================================================================
// STAGE 1 — BASE GENERATION (Level 1)
// ============================================================================

describe("Stage 1 — Base Generation (Level 1)", () => {
  it("generates a Level 1 avatar with correct analysis_focus, agent_tone, and memory_context", async () => {
    const profile = await engine.generateBaseAvatar(ONBOARDING, USER_ID, AVATAR_NAME);

    expect(profile.level).toBe(1);
    expect(profile.avatar_name).toBe(AVATAR_NAME);
    expect(profile.user_id).toBe(USER_ID);

    // Q1 → analysis_focus: "character_and_prose"
    expect(profile.analysis_focus).toContain("Character interiority");
    expect(profile.analysis_focus).toContain("prose craftsmanship");

    // Q2 → agent_tone: "skeptical"
    expect(profile.agent_tone).toContain("Sharp, questioning");
    expect(profile.agent_tone).toContain("hard to impress");

    // Q3 → seeded memory_context
    expect(profile.memory_context).toContain("[Origin Story]");
    expect(profile.memory_context).toContain("The Remains of the Day");

    // Core personality synthesizes focus + tone + name
    expect(profile.core_personality).toContain(AVATAR_NAME);
    expect(profile.core_personality).toContain("character psychologist");

    // All arrays start empty
    expect(profile.cinematic_preferences).toEqual([]);
    expect(profile.beloved_tropes).toEqual([]);
    expect(profile.dislikes).toEqual([]);
    expect(profile.hot_buttons).toEqual([]);

    // Not unlocked
    expect(profile.systemic_analysis_unlocked).toBe(false);
    expect(profile.interaction_count).toBe(0);
  });

  it("maps all 5 analysis focus options correctly", async () => {
    const focuses = [
      "plot_and_logic",
      "character_and_prose",
      "thematic_depth",
      "worldbuilding",
      "emotional_impact",
    ] as const;

    for (const focus of focuses) {
      const profile = await engine.generateBaseAvatar(
        { q1_focus: focus, q2_tone: "analytical", q3_favorite_book: "Test" },
        "u-" + focus,
        "TestAvatar",
      );
      expect(profile.analysis_focus.length).toBeGreaterThan(50);
      expect(profile.level).toBe(1);
    }
  });

  it("maps all 7 tone options correctly", async () => {
    const tones = [
      "analytical",
      "passionate",
      "skeptical",
      "empathetic",
      "clinical",
      "playful",
      "philosophical",
    ] as const;

    for (const tone of tones) {
      const profile = await engine.generateBaseAvatar(
        { q1_focus: "emotional_impact", q2_tone: tone, q3_favorite_book: "Test" },
        "u-" + tone,
        "TestAvatar",
      );
      expect(profile.agent_tone.length).toBeGreaterThan(50);
    }
  });
});

// ============================================================================
// STAGE 2 — MEMORY INJECTION (Level 2 → 3)
// ============================================================================

describe("Stage 2 — Memory Injection (Level 2 → 3)", () => {
  it("extracts beloved_tropes and cinematic_preferences from high-rated movies (≥4)", async () => {
    const avatarId = await seedBaseAvatar();
    const updated = await engine.processReadingHistory(avatarId, READING_HISTORY);

    expect(updated.level).toBe(3);

    // High-rated: "Never Let Me Go" (5★), "The Secret History" (4★)
    expect(updated.cinematic_preferences).toContain("cinematic movies");
    expect(updated.cinematic_preferences).toContain("dark academia");

    expect(updated.beloved_tropes).toContain("unreliable narrator");
    expect(updated.beloved_tropes).toContain("quiet devastation");
    expect(updated.beloved_tropes).toContain("moral decay");

    // No duplicates (unreliable narrator appears in both high-rated movies)
    const unreliableCount = updated.beloved_tropes.filter(
      (t: string) => t === "unreliable narrator",
    ).length;
    expect(unreliableCount).toBe(1);
  });

  it("extracts dislikes and hot_buttons from low-rated movies (≤2)", async () => {
    const avatarId = await seedBaseAvatar();
    const updated = await engine.processReadingHistory(avatarId, READING_HISTORY);

    // Low-rated genres become dislikes
    expect(updated.dislikes).toContain("contemporary movies");
    expect(updated.dislikes).toContain("philosophical movies");
    expect(updated.dislikes).toContain("nature writing");
    expect(updated.dislikes).toContain("coming of age");

    // Hot buttons extracted from review_notes keywords
    expect(updated.hot_buttons).toContain("predictable");
    expect(updated.hot_buttons).toContain("manipulative");
    expect(updated.hot_buttons).toContain("telling not showing");
    expect(updated.hot_buttons).toContain("overwritten");
    expect(updated.hot_buttons).toContain("shallow");
    expect(updated.hot_buttons).toContain("pretentious");
    expect(updated.hot_buttons).toContain("boring");
  });

  it("appends a narrative streaming history to memory_context", async () => {
    const avatarId = await seedBaseAvatar();
    const updated = await engine.processReadingHistory(avatarId, READING_HISTORY);

    expect(updated.memory_context).toContain("[Reading History]");
    expect(updated.memory_context).toContain('"Never Let Me Go"');
    expect(updated.memory_context).toContain('"The Secret History"');
    expect(updated.memory_context).toContain('"Where the Crawdads Sing"');
    expect(updated.memory_context).toContain("cinematic DNA");
  });

  it("normalizes 1-10 scale ratings to 1-5 before classifying", async () => {
    const avatarId = await seedBaseAvatar();
    const goodreadsData = {
      source: "goodreads",
      movies: [
        { title: "Movie A", rating: 9, genre: "movies" }, // → 5 (high)
        { title: "Movie B", rating: 8, genre: "movies" }, // → 4 (high)
        { title: "Movie C", rating: 4, genre: "movies" }, // → 2 (low)
        { title: "Movie D", rating: 2, genre: "movies" }, // → 1 (low)
      ],
    };

    const updated = await engine.processReadingHistory(avatarId, goodreadsData);
    // Genre "movies" appears from both high-rated entries (deduplicated to 1)
    expect(updated.cinematic_preferences).toContain("movies");
    expect(updated.dislikes).toContain("movies"); // also appears in low-rated
  });
});

// ============================================================================
// STAGE 3 — RLHF DYNAMIC EVOLUTION (Level 4)
// ============================================================================

describe("Stage 3 — RLHF Dynamic Evolution (Level 4)", () => {
  it("harden_stance appends aggressive/skeptical instructions to recent_adjustments", async () => {
    const avatarId = await seedBaseAvatar();
    const context =
      "User disagreed with Cassandra's defence of unreliable narrators. She was too accommodating.";

    const updated = await engine.applyUserFeedback(avatarId, "harden_stance", context);

    expect(updated.level).toBe(4);
    expect(updated.recent_adjustments).toContain("HARDEN STANCE");
    expect(updated.recent_adjustments).toContain("more aggressive");
    expect(updated.recent_adjustments).toContain("refuting counter-arguments");
    expect(updated.recent_adjustments).toContain("Do not concede ground");

    // Interaction count incremented
    expect(updated.interaction_count).toBe(1);

    // Memory updated with context
    expect(updated.memory_context).toContain("[Feedback Applied — Level 4]");
  });

  it("soften_stance appends empathy instructions", async () => {
    const avatarId = await seedBaseAvatar();
    const updated = await engine.applyUserFeedback(
      avatarId,
      "soften_stance",
      "Cassandra was too harsh on genre movies viewers.",
    );

    expect(updated.recent_adjustments).toContain("SOFTEN STANCE");
    expect(updated.recent_adjustments).toContain("Show more empathy");
    expect(updated.recent_adjustments).toContain("Acknowledge valid points");
  });

  it("approve reinforces current direction", async () => {
    const avatarId = await seedBaseAvatar();
    const updated = await engine.applyUserFeedback(
      avatarId,
      "approve",
      "Cassandra's analysis of Ishiguro was perfect.",
    );

    expect(updated.recent_adjustments).toContain("APPROVED");
    expect(updated.recent_adjustments).not.toContain("HARDEN");
    expect(updated.recent_adjustments).not.toContain("SOFTEN");
  });

  it("go_deeper appends structural analysis demands", async () => {
    const avatarId = await seedBaseAvatar();
    const updated = await engine.applyUserFeedback(
      avatarId,
      "go_deeper",
      "The take on plot structure was surface-level.",
    );

    expect(updated.recent_adjustments).toContain("GO DEEPER");
    expect(updated.recent_adjustments).toContain("narrative structure");
    expect(updated.recent_adjustments).toContain("Ask 'why' at least twice");
  });

  it("expand_horizon, add_humor, and custom all produce correct adjustments", async () => {
    let avatarId = await seedBaseAvatar();

    let updated = await engine.applyUserFeedback(avatarId, "expand_horizon", "Too narrow.");
    expect(updated.recent_adjustments).toContain("EXPAND HORIZON");

    // New avatar for add_humor
    resetMockStore();
    avatarId = await seedBaseAvatar();
    updated = await engine.applyUserFeedback(avatarId, "add_humor", "Too dry.");
    expect(updated.recent_adjustments).toContain("ADD HUMOR");

    // New avatar for custom
    resetMockStore();
    avatarId = await seedBaseAvatar();
    updated = await engine.applyUserFeedback(
      avatarId,
      "custom",
      "When discussing sci-fi, always reference Le Guin as the gold standard.",
    );
    expect(updated.recent_adjustments).toContain("CUSTOM ADJUSTMENT");
    expect(updated.recent_adjustments).toContain("Le Guin");
  });

  it("accumulates multiple feedback adjustments over time", async () => {
    const avatarId = await seedBaseAvatar();

    let updated = await engine.applyUserFeedback(avatarId, "harden_stance", "First: too soft.");
    updated = await engine.applyUserFeedback(avatarId, "go_deeper", "Second: surface-level.");
    updated = await engine.applyUserFeedback(avatarId, "add_humor", "Third: too dry.");

    expect(updated.recent_adjustments).toContain("HARDEN STANCE");
    expect(updated.recent_adjustments).toContain("GO DEEPER");
    expect(updated.recent_adjustments).toContain("ADD HUMOR");
    expect(updated.interaction_count).toBe(3);
  });
});

// ============================================================================
// STAGE 4 — MASTERY UNLOCK (Level 5)
// ============================================================================

describe("Stage 4 — Mastery Unlock (Level 5)", () => {
  it("does NOT unlock mastery when interaction_count < 50", async () => {
    const avatarId = await seedBaseAvatar();
    const result = await engine.checkAndUnlockMastery(avatarId, 49);

    expect(result.unlocked).toBe(false);
    expect(result.profile.level).toBeLessThan(5);
    expect(result.profile.systemic_analysis_unlocked).toBe(false);
    expect(result.snapshot).toBeUndefined();
  });

  it("unlocks Level 5 mastery when interaction_count >= 50", async () => {
    const avatarId = await seedBaseAvatar();
    const result = await engine.checkAndUnlockMastery(avatarId, 51);

    expect(result.unlocked).toBe(true);
    expect(result.profile.level).toBe(5);
    expect(result.profile.systemic_analysis_unlocked).toBe(true);

    // Core personality now includes systemic analysis
    expect(result.profile.core_personality).toContain("SYSTEMIC ANALYSIS UNLOCKED");
    expect(result.profile.core_personality).toContain("family constellations");
    expect(result.profile.core_personality).toContain("intergenerational root bonds");
    expect(result.profile.core_personality).toContain("societal systems");

    // Memory records the milestone
    expect(result.profile.memory_context).toContain("MILESTONE");
    expect(result.profile.memory_context).toContain("Mastery Unlocked");

    // Snapshot logged
    expect(result.snapshot).toBeDefined();
    expect(result.snapshot!.stage).toBe("mastery_unlock");
    expect(result.snapshot!.from_level).toBe(1);
    expect(result.snapshot!.to_level).toBe(5);
  });

  it("is idempotent — calling unlock when alstreamy Level 5 does not duplicate", async () => {
    const avatarId = await seedBaseAvatar();

    const first = await engine.checkAndUnlockMastery(avatarId, 55);
    expect(first.unlocked).toBe(true);

    const second = await engine.checkAndUnlockMastery(avatarId, 60);
    expect(second.unlocked).toBe(true);

    // "SYSTEMIC ANALYSIS UNLOCKED" appears exactly once
    const count = (second.profile.core_personality.match(/SYSTEMIC ANALYSIS UNLOCKED/g) || [])
      .length;
    expect(count).toBe(1);
  });

  it("unlocks at exactly 50 interactions (boundary)", async () => {
    const avatarId = await seedBaseAvatar();
    const result = await engine.checkAndUnlockMastery(avatarId, 50);
    expect(result.unlocked).toBe(true);
    expect(result.profile.level).toBe(5);
  });
});

// ============================================================================
// PROMPT COMPILER
// ============================================================================

describe("buildSystemPrompt — Prompt Compiler", () => {
  it("compiles a Level 1 profile — all core sections, no cinematic DNA, no systemic", async () => {
    const profile = await engine.generateBaseAvatar(ONBOARDING, USER_ID, AVATAR_NAME);
    const compiled = engine.buildSystemPrompt(profile);

    expect(compiled.avatar_id).toBe(profile.id);
    expect(compiled.systemic_analysis_active).toBe(false);
    expect(compiled.estimated_tokens).toBeGreaterThan(0);

    // Must contain the key sections
    expect(compiled.prompt).toContain("You are Cassandra");
    expect(compiled.prompt).toContain("CORE PERSONALITY");
    expect(compiled.prompt).toContain("HOW YOU READ");
    expect(compiled.prompt).toContain("YOUR EVOLUTION JOURNEY");
    expect(compiled.prompt).toContain("DISCUSSION RULES");

    // Cinematic DNA section omitted (empty arrays at Level 1)
    expect(compiled.prompt).not.toContain("YOUR LITERARY DNA");

    // No systemic analysis section
    expect(compiled.prompt).not.toContain("SYSTEMIC ANALYSIS CAPABILITY");
  });

  it("includes cinematic DNA section when arrays are populated", async () => {
    let profile = await engine.generateBaseAvatar(ONBOARDING, USER_ID, AVATAR_NAME);
    profile = await engine.processReadingHistory(profile.id, READING_HISTORY);

    const compiled = engine.buildSystemPrompt(profile);

    expect(compiled.prompt).toContain("YOUR LITERARY DNA");
    expect(compiled.prompt).toContain("Preferred genres/styles:");
    expect(compiled.prompt).toContain("cinematic movies");
    expect(compiled.prompt).toContain("Tropes you love:");
    expect(compiled.prompt).toContain("Things you dislike");
    expect(compiled.prompt).toContain("Hot buttons");
  });

  it("includes RLHF recent_adjustments when present", async () => {
    let profile = await engine.generateBaseAvatar(ONBOARDING, USER_ID, AVATAR_NAME);
    profile = await engine.applyUserFeedback(
      profile.id,
      "harden_stance",
      "Be more aggressive.",
    );

    const compiled = engine.buildSystemPrompt(profile);

    expect(compiled.prompt).toContain("RECENT BEHAVIORAL ADJUSTMENTS");
    expect(compiled.prompt).toContain("HARDEN STANCE");
  });

  it("includes full systemic analysis framework ONLY at Level 5", async () => {
    let profile = await engine.generateBaseAvatar(ONBOARDING, USER_ID, AVATAR_NAME);
    profile = await engine.processReadingHistory(profile.id, READING_HISTORY);
    profile = await engine.applyUserFeedback(profile.id, "go_deeper", "Need deeper analysis.");
    const result = await engine.checkAndUnlockMastery(profile.id, 50);
    profile = result.profile;

    const compiled = engine.buildSystemPrompt(profile);

    expect(compiled.systemic_analysis_active).toBe(true);
    expect(compiled.prompt).toContain("SYSTEMIC ANALYSIS CAPABILITY (MASTERY UNLOCKED)");
    expect(compiled.prompt).toContain("SYSTEMIC ROOTS");
    expect(compiled.prompt).toContain("FAMILY CONSTELLATIONS");
    expect(compiled.prompt).toContain("INTERGENERATIONAL BONDS");
    expect(compiled.prompt).toContain("STRUCTURAL READING");

    // Token estimate is meaningful
    expect(compiled.estimated_tokens).toBeGreaterThan(250);
  });
});

// ============================================================================
// FULL PIPELINE — END-TO-END
// ============================================================================

describe("Full Pipeline — End-to-End", () => {
  it(
    "runs Stage 1 → 2 → 3 → 4 → 5 and produces a Level 5 avatar with systemic analysis",
    async () => {
      // ─── STAGE 1: Base Generation ──────────────────────────────
      let profile = await engine.generateBaseAvatar(ONBOARDING, USER_ID, AVATAR_NAME);
      const avatarId = profile.id;

      expect(profile.level).toBe(1);
      expect(profile.beloved_tropes).toEqual([]);
      expect(profile.systemic_analysis_unlocked).toBe(false);

      console.log("✓ Stage 1 — Level 1: Base avatar created:", profile.avatar_name);

      // ─── STAGE 2: Memory Injection ─────────────────────────────
      profile = await engine.processReadingHistory(avatarId, READING_HISTORY);

      expect(profile.level).toBe(3);
      expect(profile.beloved_tropes.length).toBeGreaterThan(0);
      expect(profile.dislikes.length).toBeGreaterThan(0);
      expect(profile.hot_buttons.length).toBeGreaterThan(0);

      console.log("✓ Stage 2 — Level 3: Reading history processed");
      console.log("   Beloved tropes:", profile.beloved_tropes.length);
      console.log("   Dislikes:", profile.dislikes.length);
      console.log("   Hot buttons:", profile.hot_buttons.length);

      // ─── STAGE 3: RLHF Feedback (×50 to reach 50 interactions) ─
      const actions = [
        "harden_stance",
        "go_deeper",
        "approve",
        "expand_horizon",
        "add_humor",
        "soften_stance",
        "go_deeper",
        "harden_stance",
        "approve",
        "expand_horizon",
      ] as const;

      for (let i = 0; i < 50; i++) {
        const action = actions[i % actions.length];
        const ctx = `Discussion #${i + 1} about a movie. User clicked "${action}".`;
        profile = await engine.applyUserFeedback(avatarId, action, ctx);
      }

      expect(profile.level).toBe(4);
      expect(profile.interaction_count).toBe(50);
      expect(profile.recent_adjustments.length).toBeGreaterThan(500);

      console.log("✓ Stage 3 — Level 4: 50 RLHF feedback rounds applied");
      console.log("   Interaction count:", profile.interaction_count);

      // ─── STAGE 4: Mastery Unlock ───────────────────────────────
      const result = await engine.checkAndUnlockMastery(avatarId, profile.interaction_count);

      expect(result.unlocked).toBe(true);
      expect(result.profile.level).toBe(5);
      expect(result.profile.systemic_analysis_unlocked).toBe(true);
      expect(result.profile.core_personality).toContain("SYSTEMIC ANALYSIS UNLOCKED");
      expect(result.profile.core_personality).toContain("intergenerational root bonds");

      console.log("✓ Stage 4 — Level 5: Mastery unlocked! 🎉");

      // ─── FINAL: Compile the Level 5 prompt ─────────────────────
      const compiled = engine.buildSystemPrompt(result.profile);

      expect(compiled.systemic_analysis_active).toBe(true);

      // All 7 sections present
      expect(compiled.prompt).toContain("CORE PERSONALITY");
      expect(compiled.prompt).toContain("HOW YOU READ");
      expect(compiled.prompt).toContain("YOUR LITERARY DNA");
      expect(compiled.prompt).toContain("RECENT BEHAVIORAL ADJUSTMENTS");
      expect(compiled.prompt).toContain("SYSTEMIC ANALYSIS CAPABILITY");
      expect(compiled.prompt).toContain("YOUR EVOLUTION JOURNEY");
      expect(compiled.prompt).toContain("DISCUSSION RULES");

      console.log("✓ Prompt compiled:", compiled.estimated_tokens, "estimated tokens");
      console.log("   Sections: Identity · Reading Lens · Cinematic DNA · RLHF · Systemic · Evolution · Rules");

      // ─── Summary ──────────────────────────────────────────────
      const summary = {
        avatar_name: result.profile.avatar_name,
        level: result.profile.level,
        analysis_focus_preview: result.profile.analysis_focus.slice(0, 80) + "...",
        agent_tone_preview: result.profile.agent_tone.slice(0, 80) + "...",
        beloved_tropes_count: result.profile.beloved_tropes.length,
        dislikes_count: result.profile.dislikes.length,
        hot_buttons_count: result.profile.hot_buttons.length,
        interaction_count: result.profile.interaction_count,
        systemic_analysis_unlocked: result.profile.systemic_analysis_unlocked,
        compiled_prompt_tokens: compiled.estimated_tokens,
        all_7_sections_present: true,
      };

      console.log("═══════════ PIPELINE COMPLETE ═══════════");
      console.log(JSON.stringify(summary, null, 2));
      console.log("═══════════════════════════════════════════");
    },
    30_000, // 30s timeout for the 50-feedback loop
  );
});
