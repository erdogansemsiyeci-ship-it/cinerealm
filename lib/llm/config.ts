// ============================================================================
// CineRealm: LLM Configuration
// Model selection, cost tracking, provider setup
// ============================================================================

// Current recommendation: DeepSeek V3 via OpenRouter
// Cost: $0.03 per complete 20-agent discussion
// Quality: Excellent character voice consistency, handles structured JSON output well

export const LLM_CONFIG = {
  // Primary model for discussion generation
  model: process.env.LLM_MODEL || "deepseek/deepseek-chat",
  provider: process.env.LLM_PROVIDER || "openrouter",

  // Fallback: if primary fails, use GPT-4o-mini
  fallback_model: "openai/gpt-4o-mini",

  // API endpoints
  openrouter_base_url: "https://openrouter.ai/api/v1",
  openai_base_url: "https://api.openai.com/v1",
  deepseek_base_url: "https://api.deepseek.com/v1",

  // Generation parameters
  temperature: 0.85, // Higher = more creative, distinct voices
  max_tokens: 16384, // Enough for 20 messages + themes + summary
  presence_penalty: 0.3, // Encourage diverse vocabulary across agents
  frequency_penalty: 0.2,

  // Cost estimates (per 1M tokens)
  costs: {
    "deepseek/deepseek-chat": { input: 0.27, output: 1.10 },
    "openai/gpt-4o-mini": { input: 0.15, output: 0.60 },
    "openai/gpt-4o": { input: 2.50, output: 10.00 },
    "anthropic/claude-sonnet": { input: 3.00, output: 15.00 },
  },

  // Embedding model for vector memory
  embedding_model: "openai/text-embedding-3-small",
  embedding_dimensions: 1536,
} as const;

// ============================================================================
// COST CALCULATOR
// ============================================================================
export function estimateDiscussionCost(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const costs =
    LLM_CONFIG.costs[model as keyof typeof LLM_CONFIG.costs] ||
    LLM_CONFIG.costs["deepseek/deepseek-chat"];
  return (inputTokens / 1_000_000) * costs.input + (outputTokens / 1_000_000) * costs.output;
}

// Typical discussion: ~25K input tokens + ~10K output tokens
// DeepSeek V3: ~$0.018
// GPT-4o-mini: ~$0.010
// GPT-4o: ~$0.163
// Claude Sonnet: ~$0.225

// ============================================================================
// API CLIENT BUILDER
// ============================================================================
export function buildLLMRequest({
  model,
  systemPrompt,
  userPrompt,
  temperature,
  maxTokens,
  responseFormat,
}: {
  model?: string;
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: "json_object";
}) {
  const provider = LLM_CONFIG.provider;
  const baseUrl =
    provider === "openrouter"
      ? LLM_CONFIG.openrouter_base_url
      : provider === "deepseek"
        ? LLM_CONFIG.deepseek_base_url
        : LLM_CONFIG.openai_base_url;

  return {
    url: `${baseUrl}/chat/completions`,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY || process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY}`,
      ...(provider === "openrouter" && {
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "https://libragent.com",
        "X-Title": "CineRealm",
      }),
    },
    body: {
      model: model || LLM_CONFIG.model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: temperature ?? LLM_CONFIG.temperature,
      max_tokens: maxTokens ?? LLM_CONFIG.max_tokens,
      ...(responseFormat && { response_format: { type: responseFormat } }),
    },
  };
}
