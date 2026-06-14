// ============================================================================
// CineRealm: Discussion Orchestrator
// 4-phase orchestration engine with conflict matrix and batch prompting
// ============================================================================

import { AGENTS, AGENT_MAP, CONFLICT_PAIRS, PHASE_AGENTS } from "@/lib/agents/profiles";
import { buildCompleteDiscussionPrompt, type DiscussionOutput } from "@/lib/llm/prompts";
import { LLM_CONFIG, buildLLMRequest } from "@/lib/llm/config";

// ============================================================================
// TYPES
// ============================================================================
export interface OrchestrationInput {
  bookTitle: string;
  bookAuthor: string;
  bookDescription: string;
  bookGenre: string;
  agentIds?: string[]; // default: all 20 agents
  mode?: "complete" | "phased"; // default: complete (single API call)
}

export interface OrchestrationResult {
  success: boolean;
  messages: Array<{
    agent_id: string;
    display_name: string;
    phase: string;
    reply_to_agent: string | null;
    reply_to_name: string | null;
    content: string;
    sentiment: string;
    sequence: number;
  }>;
  themes: Array<{ theme: string; weight: number; sentiment: string }>;
  summary: {
    consensus: string;
    strongest_supporters: string[];
    strongest_skeptics: string[];
    who_should_stream: string;
    who_should_skip: string;
    content_warnings: string[];
  };
  metadata: {
    model: string;
    tokens_used?: number;
    estimated_cost?: number;
    duration_ms: number;
  };
  error?: string;
}

// ============================================================================
// MAIN ORCHESTRATOR
// ============================================================================
export async function orchestrateDiscussion(
  input: OrchestrationInput
): Promise<OrchestrationResult> {
  const startTime = Date.now();

  // 1. Resolve agents
  const agentIds = input.agentIds || Object.keys(AGENT_MAP);
  const agents = agentIds
    .map((id) => AGENT_MAP[id])
    .filter(Boolean)
    .slice(0, 20); // Max 20 agents per discussion

  if (agents.length < 5) {
    return {
      success: false,
      messages: [],
      themes: [],
      summary: {
        consensus: "",
        strongest_supporters: [],
        strongest_skeptics: [],
        who_should_stream: "",
        who_should_skip: "",
        content_warnings: [],
      },
      metadata: { model: LLM_CONFIG.model, duration_ms: Date.now() - startTime },
      error: "Need at least 5 agents for a meaningful discussion",
    };
  }

  // 2. Build the master prompt
  const prompt = buildCompleteDiscussionPrompt({
    bookTitle: input.bookTitle,
    bookAuthor: input.bookAuthor,
    bookDescription: input.bookDescription,
    bookGenre: input.bookGenre,
    agents,
  });

  // 3. Build the LLM request
  const request = buildLLMRequest({
    systemPrompt:
      "You are a cinematic discussion orchestrator. You generate authentic, emotionally rich, character-driven movie club discussions. Every agent has a DISTINCT voice. Conflict is mandatory. Personal revelation is required. Return ONLY valid JSON.",
    userPrompt: prompt,
    responseFormat: "json_object",
  });

  // 4. Call LLM with retry
  let output: DiscussionOutput;
  try {
    output = await callLLMWithRetry(request, 1);
  } catch (err: any) {
    // Try fallback model
    try {
      const fallbackRequest = buildLLMRequest({
        model: LLM_CONFIG.fallback_model,
        systemPrompt:
          "You are a cinematic discussion orchestrator. Return ONLY valid JSON.",
        userPrompt: prompt,
        responseFormat: "json_object",
      });
      output = await callLLMWithRetry(fallbackRequest, 1);
    } catch (fallbackErr: any) {
      return {
        success: false,
        messages: [],
        themes: [],
        summary: {
          consensus: "",
          strongest_supporters: [],
          strongest_skeptics: [],
          who_should_stream: "",
          who_should_skip: "",
          content_warnings: [],
        },
        metadata: { model: LLM_CONFIG.model, duration_ms: Date.now() - startTime },
        error: `LLM call failed: ${err.message || "Unknown error"}`,
      };
    }
  }

  // 5. Validate and sequence messages
  if (!output.messages || !Array.isArray(output.messages)) {
    return {
      success: false,
      messages: [],
      themes: [],
      summary: {
        consensus: "",
        strongest_supporters: [],
        strongest_skeptics: [],
        who_should_stream: "",
        who_should_skip: "",
        content_warnings: [],
      },
      metadata: { model: LLM_CONFIG.model, duration_ms: Date.now() - startTime },
      error: "LLM returned invalid output structure — missing messages array",
    };
  }

  const messages = output.messages.map((msg, i) => ({
    agent_id: msg.agent_id,
    display_name: msg.display_name,
    phase: msg.phase || "opening",
    reply_to_agent: msg.reply_to_agent || null,
    reply_to_name: msg.reply_to_name || null,
    content: msg.content,
    sentiment: msg.sentiment || "neutral",
    sequence: i + 1,
  }));

  // 6. Validate we have all phases represented
  const phases = new Set(messages.map((m) => m.phase));
  if (phases.size < 2) {
    console.warn(`Only ${phases.size} phases generated. Expected 4.`);
  }

  // 7. Validate conflict pairs
  const interactions = validateConflictInteractions(messages, agents.map((a) => a.id));
  if (interactions < 2) {
    console.warn(`Only ${interactions} conflict interactions detected. Expected at least 4.`);
  }

  // 8. Return
  return {
    success: true,
    messages,
    themes: (output.themes || []).map((t: any) => ({
      theme: t.theme,
      weight: t.weight || 0.5,
      sentiment: t.sentiment || "mixed",
    })),
    summary: {
      consensus: output.summary?.consensus || "",
      strongest_supporters: output.summary?.strongest_supporters || [],
      strongest_skeptics: output.summary?.strongest_skeptics || [],
      who_should_stream: output.summary?.who_should_stream || "",
      who_should_skip: output.summary?.who_should_skip || "",
      content_warnings: output.summary?.content_warnings || [],
    },
    metadata: {
      model: LLM_CONFIG.model,
      duration_ms: Date.now() - startTime,
    },
  };
}

// ============================================================================
// HELPERS
// ============================================================================
async function callLLMWithRetry(request: any, maxRetries: number): Promise<DiscussionOutput> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(request.url, {
        method: "POST",
        headers: request.headers,
        body: JSON.stringify(request.body),
        signal: AbortSignal.timeout(240_000), // 4 min timeout per call
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`LLM API error ${response.status}: ${text.substring(0, 200)}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error("LLM returned empty response");
      }

      // Parse JSON from response (handle markdown code fences)
      let json: DiscussionOutput;
      try {
        json = JSON.parse(content);
      } catch {
        // Try extracting from code fence
        const match = content.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (match) {
          json = JSON.parse(match[1].trim());
        } else {
          throw new Error(`Failed to parse LLM JSON output: ${content.substring(0, 200)}`);
        }
      }

      return json;
    } catch (err: any) {
      lastError = err;
      if (attempt < maxRetries - 1) {
        // Wait before retry (exponential backoff)
        await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
      }
    }
  }

  throw lastError || new Error("LLM call failed after retries");
}

function validateConflictInteractions(
  messages: Array<{ agent_id: string; reply_to_agent: string | null }>,
  agentIds: string[]
): number {
  let count = 0;
  const repliedPairs = new Set<string>();

  for (const msg of messages) {
    if (msg.reply_to_agent) {
      const pair = [msg.agent_id, msg.reply_to_agent].sort().join("↔");
      if (!repliedPairs.has(pair)) {
        repliedPairs.add(pair);
        // Check if this is a known conflict pair
        if (
          CONFLICT_PAIRS.some(
            ([a1, a2]) =>
              (a1 === msg.agent_id && a2 === msg.reply_to_agent) ||
              (a2 === msg.agent_id && a1 === msg.reply_to_agent)
          )
        ) {
          count++;
        }
      }
    }
  }

  return count;
}
