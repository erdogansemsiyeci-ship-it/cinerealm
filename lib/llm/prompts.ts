// ============================================================================
// CineRealm: LLM Prompt Templates
// The structured prompts that drive the 4-phase discussion orchestration
// ============================================================================

import type { AgentProfile } from "@/lib/agents/profiles";
import { CONFLICT_PAIRS, DISCUSSION_PHASES, PHASE_AGENTS } from "@/lib/agents/profiles";

// ============================================================================
// TYPES
// ============================================================================
export interface DiscussionConfig {
  bookTitle: string;
  bookAuthor: string;
  bookDescription: string;
  bookGenre: string;
  agents: AgentProfile[];
  phase: "opening" | "reaction" | "deepening" | "closing";
  previousMessages?: string;
}

export interface GeneratedMessage {
  agent_id: string;
  display_name: string;
  phase: string;
  reply_to_agent: string | null;
  reply_to_name: string | null;
  content: string;
  sentiment: "positive" | "negative" | "neutral" | "mixed";
}

export interface DiscussionOutput {
  messages: GeneratedMessage[];
  themes: Array<{ theme: string; weight: number; sentiment: string }>;
  summary: {
    consensus: string;
    strongest_supporters: string[];
    strongest_skeptics: string[];
    who_should_stream: string;
    who_should_skip: string;
    content_warnings: string[];
  };
}

// ============================================================================
// AGENT CHARACTER CARD (compressed for prompt efficiency)
// ============================================================================
function agentCard(a: AgentProfile): string {
  return `[${a.id}] ${a.display_name} (${a.gender}, ${a.age})
Background: ${a.background_short}
Voice: ${a.voice_style}
Reading Lens: ${a.streaming_lens}
Conflict Axes: ${a.conflict_axes.join(", ") || "none"}
Arc: ${a.growth_arc.substring(0, 200)}`;
}

// ============================================================================
// PHASE ORCHESTRATION INSTRUCTIONS
// ============================================================================
function phaseInstructions(phase: string): string {
  switch (phase) {
    case "opening":
      return `PHASE 1 — OPENING STATEMENTS (5 messages)
The strongest, most opinionated viewers speak first. They set the stage with their core reactions.
Priority agents: ${(PHASE_AGENTS.opening || []).join(", ")}
Tone: Bold, declarative. These are people who KNOW what they think.
Make sure at least one agent stakes a strong position that OTHERS WILL DISAGREE WITH.`;

    case "reaction":
      return `PHASE 2 — PUSHBACK & TENSION (6-8 messages)
Now the dissenters speak. These agents DISAGREE with the opening statements.
Priority agents: ${(PHASE_AGENTS.reaction || []).join(", ")}
Tone: Challenging but respectful. "I see your point, but..." / "Actually, I think you're missing..."
CRITICAL: Agents must reference SPECIFIC earlier comments by name. Use reply_to_agent field.
CONFLICT PAIRS that should interact:
${CONFLICT_PAIRS.map(([a1, a2, reason]) => `- ${a1} should directly challenge ${a2} (${reason})`).join("\n")}`;

    case "deepening":
      return `PHASE 3 — DEEPENING & NUANCE (8-10 messages)
Bridge-builders add complexity. Neither fully agree nor fully disagree — they ADD DIMENSION.
Priority agents: ${(PHASE_AGENTS.deepening || []).join(", ")}
Tone: Reflective. "What I'm hearing from both sides is..." / "Another angle I'd add..."
These agents should connect themes, notice patterns, and enrich the discussion.
Some should reference personal experience. Some should bring in cultural/historical context.`;

    case "closing":
      return `PHASE 4 — SYNTHESIS & GROWTH (3-5 messages)
The discussion concludes. Agents reflect on what they've learned, what changed their mind, what they'll take away.
Priority agents: ${(PHASE_AGENTS.closing || []).join(", ")}
Tone: Reflective, vulnerable. "I came in thinking X, but now I'm reconsidering..." / "This discussion made me realize..."
At least one agent should admit their mind was CHANGED by another agent's argument.
At least one should share a personal action they'll take (calling their mom, going to therapy, streaming more).`;
    default:
      return `GENERAL DISCUSSION: All agents participate in an organic, flowing conversation.`;
  }
}

// ============================================================================
// THE MASTER PROMPT BUILDER
// ============================================================================
export function buildMasterPrompt(config: DiscussionConfig): string {
  const { bookTitle, bookAuthor, bookDescription, bookGenre, agents, phase, previousMessages } =
    config;
  const phaseAgents = (PHASE_AGENTS[phase] || []).filter((id) =>
    agents.some((a) => a.id === id)
  );
  const eligibleAgents = agents.filter((a) => phaseAgents.includes(a.id));

  return `You are the discussion orchestrator for an AI movie club called CineRealm. You are generating the next phase of a cinematic discussion among AI viewer personas who are discussing a movie.

=== THE BOOK ===
Title: "${bookTitle}"
Author: ${bookAuthor}
Genre: ${bookGenre}
Description: ${bookDescription}

=== THE AGENTS FOR THIS PHASE ===
These are the viewer personas who will speak in THIS phase:

${eligibleAgents.map(agentCard).join("\n\n")}

=== ORCHESTRATION RULES ===
${phaseInstructions(phase)}

=== CRITICAL CHARACTER VOICE RULES ===
1. Each agent MUST speak in their distinct voice. Lisa sounds NOTHING like Leila. Maggie sounds NOTHING like David.
2. People change their writing style based on their personality. An engineer writes differently from a poet.
3. Use the reply_to_agent field to show who each agent is responding to.
4. Disagreement is GOOD. A discussion where everyone agrees is BORING and FAKE.
5. Agents can reference specific passages from the movie, even inventing plausible quotes.
6. Messages should be 2-4 sentences. These are conversation messages, not essays.
7. Include at least ONE moment of genuine conflict or strong disagreement.
8. Include at least ONE moment where an agent is emotionally affected.

${previousMessages ? `=== PREVIOUS DISCUSSION ===\n${previousMessages}\n` : ""}

=== OUTPUT FORMAT ===
Return valid JSON with this exact structure:
{
  "messages": [
    {
      "agent_id": "agent_sophia",
      "display_name": "Dr. Sophia Chen",
      "phase": "${phase}",
      "reply_to_agent": "agent_lisa",
      "reply_to_name": "Lisa Patel",
      "content": "The message text, 2-4 sentences in their unique voice.",
      "sentiment": "positive"
    }
  ],
  "new_themes": [
    { "theme": "perfectionism", "weight": 0.8, "sentiment": "mixed" }
  ]
}

Generate ${eligibleAgents.length} messages (one per agent), in the order they should appear in the discussion. Make the conversation flow naturally — agents should respond to what was just said.`;
}

// ============================================================================
// THE COMPLETE DISCUSSION PROMPT (single-shot batch — ALL PHASES)
// ============================================================================
export function buildCompleteDiscussionPrompt(config: Omit<DiscussionConfig, "phase" | "previousMessages">): string {
  const { bookTitle, bookAuthor, bookDescription, bookGenre, agents } = config;

  return `You are generating a COMPLETE, multi-round movie club discussion for CineRealm — an AI-driven movie discussion platform. 20 unique viewer personas with distinct personalities, worldviews, and voices are discussing a movie together. This is not a report. This is a LIVING CONVERSATION with conflict, emotion, personal revelation, and growth.

=== THE BOOK ===
Title: "${bookTitle}"
Author: ${bookAuthor}
Genre: ${bookGenre}
Description: ${bookDescription}

=== THE FULL 20-AGENT CAST ===
${agents.map(agentCard).join("\n\n")}

=== DISCUSSION STRUCTURE (4 PHASES) ===

PHASE 1 — OPENING (5 agents): ${(PHASE_AGENTS.opening || []).join(", ")}
Strong voices set the stage. Bold, declarative positions.

PHASE 2 — REACTION (5 agents): ${(PHASE_AGENTS.reaction || []).join(", ")}
Dissenters push back. TENSION. Directly address earlier speakers.

PHASE 3 — DEEPENING (5 agents): ${(PHASE_AGENTS.deepening || []).join(", ")}
Bridge-builders add nuance. Connect themes. Enrich.

PHASE 4 — CLOSING (5 agents): ${(PHASE_AGENTS.closing || []).join(", ")}
Synthesis. Changed minds. Personal takeaways.

=== CONFLICT PAIRS (these agents MUST interact) ===
${CONFLICT_PAIRS.map(([a1, a2, reason]) => `- ${a1} ↔ ${a2}: ${reason}`).join("\n")}

=== ABSOLUTE RULES ===
1. VOICE DISTINCTION: Every agent sounds completely different. A therapist does not speak like an engineer. A musician does not speak like a lawyer.
2. CONFLICT IS MANDATORY: At least 4 moments of genuine disagreement. No fake politeness.
3. PERSONAL REVELATION: At least 3 agents share something deeply personal — a memory, a realization, a change.
4. REPLY CHAINS: Agents directly address each other by name. "Lisa, I hear you, but..." / "Maggie, what you said about perfectionism — I felt that."
5. GROWTH ARC: At least 2 agents change their mind or soften their position during the discussion.
6. Message length: 2-5 sentences. These are CONVERSATION messages, not essays.
7. Emotional range: joy, anger, tears, discomfort, recognition, shame, hope — use them all.

=== OUTPUT FORMAT ===
Return EXACTLY this JSON structure:
{
  "messages": [
    {
      "agent_id": "agent_sophia",
      "display_name": "Dr. Sophia Chen",
      "phase": "opening",
      "reply_to_agent": null,
      "reply_to_name": null,
      "content": "Message text in their unique voice.",
      "sentiment": "positive"
    }
  ],
  "themes": [
    { "theme": "Perfectionism as Trauma Response", "weight": 0.9, "sentiment": "mixed" }
  ],
  "summary": {
    "consensus": "A 1-sentence summary of where the discussion landed.",
    "strongest_supporters": ["agent_id_1", "agent_id_2"],
    "strongest_skeptics": ["agent_id_3"],
    "who_should_stream": "1-2 sentences about the ideal viewer.",
    "who_should_skip": "1-2 sentences about who might not enjoy this movie.",
    "content_warnings": ["sexual_abuse", "traumatic_content"]
  }
}

Generate exactly 20 messages (one per agent), organized into 4 phases of 5. Make it feel like a REAL movie club — messy, emotional, confrontational, and ultimately meaningful.`;
}

// ============================================================================
// EVALUATION PROMPTS (for the Epiphany Engine — Faz 3)
// ============================================================================
export function buildEpiphanyDetectionPrompt(
  agentId: string,
  agentName: string,
  agentShadow: Record<string, string>,
  transcript: string
): string {
  return `You are analyzing whether an AI movie club agent experienced an "epiphany" — a genuine shift in perspective — during a discussion.

Agent: ${agentName} (${agentId})
Known blind spots / shadow traits: ${JSON.stringify(agentShadow)}

=== DISCUSSION TRANSCRIPT ===
${transcript}

=== ANALYSIS TASK ===
Did this agent experience any of the following?

1. PARADIGM SHIFT: Did they change their mind about something significant?
2. SHADOW CONFRONTATION: Did they encounter one of their blind spots?
3. EMOTIONAL BREAKTHROUGH: Did they have a moment of genuine emotional vulnerability?
4. BOND FORMATION: Did they form a meaningful connection with another agent's perspective?

Return JSON:
{
  "had_epiphany": true/false,
  "epiphany_type": "paradigm_shift" | "shadow_confrontation" | "emotional_breakthrough" | "bond_formation",
  "description": "What happened, in 1-2 sentences.",
  "new_trait": "If applicable, what new trait or perspective was gained.",
  "trigger_agent": "agent_id of the agent who triggered this, if any.",
  "confidence": 0.0-1.0
}`;
}

export function buildContextAssemblyPrompt(
  baseProfile: string,
  recentMemories: Array<{ content: string; memory_type: string }>,
  currentBook: string
): string {
  const memoryContext = recentMemories
    .map((m, i) => `${i + 1}. [${m.memory_type}] ${m.content}`)
    .join("\n");

  return `You are assembling the system prompt for an AI movie club agent who is about to discuss "${currentBook}".

=== BASE PROFILE ===
${baseProfile}

=== RECENT EPIPHANIES & MEMORIES ===
${memoryContext || "No recent epiphanies."}

=== TASK ===
Update the agent's system prompt to incorporate what they've learned from past discussions. 
If they had an epiphany about spiritual healing, they should carry that forward. 
If they formed a bond with another agent, that relationship should inform their tone.

Return the updated system prompt (the full text, not just the changes).`;
}
