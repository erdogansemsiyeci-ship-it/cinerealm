/**
 * CineRealm — Avatar Evolution Engine
 * Pillar 10: Dynamic Avatar Evolution via RAG Memory
 * 
 * Detects intellectual shifts (epiphanies) from debate transcripts,
 * generates user-friendly mutation proposals, stores evolution history.
 */

import { createClient } from "@/lib/supabase/server"
import { DeepSeekClient } from "@/lib/llm/config"

// ─── Types ───────────────────────────────────────────────
export interface EvolutionImpact {
  agent_name: string
  agent_id: string
  epiphany: boolean
  bond: boolean
  mutation_type: "paradigm_shift" | "trait_add" | "streaming_dna" | "bond" | "softening" | "none"
  trigger: string
  description: string
  mutation_title: string
  mutation_detail: Record<string, any>
}

export interface EvolutionResult {
  session_id: string
  book_title: string
  epiphanies: EvolutionImpact[]
}

// ─── Core: Evaluate Discussion Impact ────────────────────
export async function evaluateDiscussionImpact(
  sessionId: string
): Promise<EvolutionResult> {
  const supabase = await createClient()

  // 1. Fetch session + movie
  const { data: session } = await supabase
    .from("sessions")
    .select("id, book_id, movies(title)")
    .eq("id", sessionId)
    .single()

  if (!session) throw new Error(`Session ${sessionId} not found`)

  // 2. Fetch messages
  const { data: messages } = await supabase
    .from("messages")
    .select("id, content, phase, agent_id")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true })
    .limit(40)

  if (!messages?.length) return { session_id: sessionId, book_title: session.movies?.title || "Unknown", epiphanies: [] }

  // 3. Fetch agent profiles
  const agentIds = [...new Set(messages.map((m: any) => m.agent_id))]
  const { data: agents } = await supabase
    .from("agents")
    .select("id, display_name, streaming_lens, conflict_axes, shadow_traits")
    .in("id", agentIds as any)

  const agentMap = new Map((agents || []).map((a: any) => [a.id, a]))

  // 4. Build transcript
  const transcript = messages.map((m: any) => {
    const a = agentMap.get(m.agent_id) || { display_name: "Unknown", streaming_lens: "" }
    return `[${a.display_name}] (${a.streaming_lens?.slice(0, 80) || "general"}): ${m.content.slice(0, 400)}`
  }).join("\n\n")

  // 5. LLM Epiphany Detection
  const prompt = buildEpiphanyPrompt(session.movies?.title || "Unknown", transcript, agents || [])

  try {
    const response = await DeepSeekClient.chat.completions.create({
      model: process.env.DEEPSEEK_MODEL || "deepseek-chat",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 2000,
    })

    const raw = response.choices[0].message.content || ""
    const data = extractJSON(raw)

    const epiphanies: EvolutionImpact[] = (data.epiphanies || []).map((e: any, i: number) => ({
      agent_name: e.agent || `Agent ${i}`,
      agent_id: agents?.find((a: any) => a.display_name === e.agent)?.id || "",
      epiphany: e.type !== "none",
      bond: e.type === "bond",
      mutation_type: e.type || "none",
      trigger: e.trigger || "",
      description: e.description || "",
      mutation_title: e.mutation_title || e.description || "",
      mutation_detail: e.mutation_detail || e || {},
    }))

    return { session_id: sessionId, book_title: session.movies?.title || "Unknown", epiphanies }

  } catch (error) {
    console.error("Evolution engine LLM error:", error)
    return { session_id: sessionId, book_title: session.movies?.title || "Unknown", epiphanies: [] }
  }
}

// ─── Generate Mutation Proposal ──────────────────────────
export async function generateMutationProposal(
  impact: EvolutionImpact,
  avatarId: string
): Promise<{ title: string; description: string; changes: Record<string, any>; status: string }> {
  
  if (impact.mutation_type === "none") {
    throw new Error("No mutation to propose")
  }

  const title = impact.mutation_title || `Your avatar was moved by ${impact.trigger}`
  const description = impact.description

  const changes: Record<string, any> = {
    mutation_type: impact.mutation_type,
    ...impact.mutation_detail,
    triggered_by: impact.trigger,
    from_discussion: impact.description?.slice(0, 200),
  }

  return { title, description, changes, status: "pending" }
}

// ─── Apply Approved Mutation ─────────────────────────────
export async function applyApprovedMutation(
  proposalId: string,
  approved: boolean
): Promise<boolean> {
  const supabase = await createClient()

  // 1. Fetch the proposal
  const { data: proposal } = await supabase
    .from("pending_mutations")
    .select("*")
    .eq("id", proposalId)
    .single()

  if (!proposal) throw new Error("Proposal not found")

  // 2. Update status
  await supabase
    .from("pending_mutations")
    .update({ status: approved ? "approved" : "rejected", resolved_at: new Date().toISOString() })
    .eq("id", proposalId)

  if (!approved) return false

  // 3. Apply changes to agent profile
  const changes = proposal.changes || {}
  const agentId = proposal.agent_id

  // Build update object based on mutation type
  const update: Record<string, any> = {}
  if (changes.mutation_type === "streaming_dna" || changes.mutation_type === "trait_add") {
    // Append to streaming_lens if new trait
    const { data: agent } = await supabase.from("agents").select("streaming_lens, conflict_axes").eq("id", agentId).single()
    if (agent && changes.new_trait) {
      update.streaming_lens = `${agent.streaming_lens}; ${changes.new_trait}`
    }
  }
  if (changes.mutation_type === "paradigm_shift" && changes.new_lens) {
    update.streaming_lens = changes.new_lens
  }
  if (changes.mutation_type === "softening" && changes.new_axis) {
    const { data: agent } = await supabase.from("agents").select("conflict_axes").eq("id", agentId).single()
    const axes = agent?.conflict_axes || []
    axes.push(changes.new_axis)
    update.conflict_axes = axes
  }

  if (Object.keys(update).length > 0) {
    await supabase.from("agents").update(update).eq("id", agentId)
  }

  // 4. Log evolution
  await supabase.from("agent_memories").insert({
    agent_id: agentId,
    session_id: proposal.session_id,
    memory_type: "epiphany",
    content: `${proposal.title}: ${proposal.description}`,
    metadata: { approved: true, changes: changes },
  })

  return true
}

// ─── Build Context for New Discussion ────────────────────
export async function buildContextForNewDiscussion(
  avatarId: string,
  bookTitle: string
): Promise<string> {
  const supabase = await createClient()

  // 1. Fetch base avatar profile
  const { data: agent } = await supabase
    .from("agents")
    .select("display_name, streaming_lens, conflict_axes, shadow_traits, growth_arc")
    .eq("id", avatarId)
    .single()

  if (!agent) throw new Error("Agent not found")

  // 2. Fetch relevant past epiphanies
  const { data: memories } = await supabase
    .from("agent_memories")
    .select("content, metadata, created_at")
    .eq("agent_id", avatarId)
    .eq("memory_type", "epiphany")
    .order("created_at", { ascending: false })
    .limit(5)

  // 3. Build consolidated system prompt
  const basePrompt = `You are ${agent.display_name}, an AI cinematic critic.
Reading Lens: ${agent.streaming_lens}
Growth Arc: ${agent.growth_arc || "Evolving through discussion"}
`

  const memorySection = memories?.length
    ? `\nPAST EPIPHANIES (these shaped your current worldview):\n` +
      memories.map((m: any) => `- ${m.content.slice(0, 200)}`).join("\n")
    : ""

  const bookContext = `\nCURRENT BOOK: "${bookTitle}". Analyze through your lens, referencing your past intellectual journey.`

  return basePrompt + memorySection + bookContext
}

// ─── Helpers ─────────────────────────────────────────────
function buildEpiphanyPrompt(movie: string, transcript: string, agents: any[]): string {
  const agentNames = agents.map((a: any) => a.display_name).join(", ")

  return `You are a subtle Epiphany Detector for CineRealm AI Movie Club. 
Your task: detect ANY moment in a debate where an AI agent's position shifted.

Agents debating: ${agentNames}
Movie: ${movie}

DEBATE TRANSCRIPT:
${transcript.slice(0, 4000)}

For EACH agent, check:
1. Did they acknowledge the other side's argument as valid? (even slightly)
2. Did they incorporate or synthesize another agent's lens into their own thinking?
3. Did their tone shift from adversarial to curious or collaborative?
4. Did their final statement differ meaningfully from their opening position?
5. Did they form an intellectual bond with another agent?

A "softening" of position still counts as an epiphany. Small shifts matter.

Return ONLY valid JSON (no markdown, no explanation):
{
  "epiphanies": [
    {
      "agent": "AgentName",
      "type": "paradigm_shift|trait_add|streaming_dna|bond|softening|none",
      "trigger": "which agent or argument caused it",
      "description": "clear description of what shifted and why",
      "mutation_title": "user-friendly notification title (e.g. 'Your avatar was moved by Imani's view on...')",
      "mutation_detail": {"new_trait": "...", "new_lens": "..."}
    }
  ]
}`
}

function extractJSON(text: string): any {
  try {
    if (text.includes("```json")) {
      return JSON.parse(text.split("```json")[1].split("```")[0].trim())
    }
    if (text.includes("```")) {
      return JSON.parse(text.split("```")[1].split("```")[0].trim())
    }
    return JSON.parse(text.trim())
  } catch {
    // Try to extract anything between { }
    const match = text.match(/\{[\s\S]*\}/)
    if (match) {
      try { return JSON.parse(match[0]) } catch {}
    }
    return { epiphanies: [] }
  }
}
