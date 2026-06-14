// ============================================================================
// CineRealm Predictive Oracle: Fingerprint Engine
// Cosine similarity, vector extraction, category classification
// ============================================================================

import { createClient as createServerClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

// ---- TYPES ----

export interface AgentScore {
  agent_id: string;
  dimension: string;
  score: number;
}

/** Raw row shape from book_analysis table */
export interface BookAnalysisRow {
  agent_id: string;
  pragmatist_score: number;
  empath_score: number;
  formalist_score: number;
  moralist_score: number;
  nihilist_score: number;
}

/**
 * Convert book_analysis rows (flat per-agent with 5 dimensions) 
 * into AgentScore[] array (one entry per dimension per agent).
 */
export function rowsToScores(rows: BookAnalysisRow[]): AgentScore[] {
  const dimensions = ["pragmatist", "empath", "formalist", "moralist", "nihilist"] as const;
  const scores: AgentScore[] = [];
  for (const row of rows) {
    for (const dim of dimensions) {
      scores.push({
        agent_id: row.agent_id,
        dimension: dim,
        score: row[`${dim}_score` as keyof BookAnalysisRow] as number,
      });
    }
  }
  return scores;
}

export interface FingerprintVector {
  book_id: string; // UUID
  book_title: string;
  book_author: string;
  vector: number[]; // 20-dimensional
  category: "commercial_bestseller" | "cinematic_masterpiece" | "viral_controversial" | "uncategorized";
  pragmatist_score: number;
  empath_score: number;
  formalist_score: number;
  moralist_score: number;
  nihilist_score: number;
  agent_count: number;
}

export interface SimilarityResult {
  target_book_id: string; // UUID
  target_title: string;
  similar_books: Array<{
    book_id: string;
    title: string;
    author: string;
    similarity: number; // 0-1
    category: string;
  }>;
  predicted_category: string;
  category_similarities: {
    commercial_bestseller: number;
    cinematic_masterpiece: number;
    viral_controversial: number;
  };
  market_prediction: {
    tier: "S" | "A" | "B" | "C" | "D";
    estimated_sales: string;
    risk_level: "low" | "medium" | "high";
    confidence: number; // 0-1
  };
  top_driving_agents: Array<{
    agent_id: string;
    dimension: string;
    score: number;
    contribution: number;
  }>;
}

export interface CategoryBaseline {
  category: string;
  avg_vector: number[];
  book_count: number;
}

// ---- VECTOR EXTRACTION ----

/**
 * Extract a 20-dimensional vector from a movie's analysis scores.
 * 4 agent types × 5 dimensions = 20
 */
export function extractVector(scores: AgentScore[]): number[] | null {
  // We need 5 dimensions from each agent type
  const dimensions = ["pragmatist", "empath", "formalist", "moralist", "nihilist"];
  
  // Get unique agent_ids
  const agentIds = [...new Set(scores.map(s => s.agent_id))];
  if (agentIds.length === 0) return null;

  // For each agent, get their 5 dimension scores
  // Then average across agents for each dimension → 5 values
  // But we want a richer vector: agent × dimension = more dimensions
  // Strategy: take top 4 agents by average score, use their 5 dimensions = 20
  const agentAvgScores = agentIds.map(aid => {
    const agentScores = scores.filter(s => s.agent_id === aid);
    const dimScores: Record<string, number> = {};
    for (const s of agentScores) {
      dimScores[s.dimension] = s.score;
    }
    // Average of 5 dimensions
    const avg = dimensions.reduce((sum, d) => sum + (dimScores[d] || 0), 0) / dimensions.length;
    return { agent_id: aid, avg, dimScores };
  });

  // Sort by average score, take top 4
  const top4 = agentAvgScores.sort((a, b) => b.avg - a.avg).slice(0, 4);

  // Pad to 4 agents if fewer
  while (top4.length < 4) {
    top4.push({ agent_id: `pad_${top4.length}`, avg: 0, dimScores: {} });
  }

  // Build 20-dimensional vector
  const vector: number[] = [];
  for (const agent of top4) {
    for (const dim of dimensions) {
      vector.push(agent.dimScores[dim] || 0);
    }
  }

  return vector;
}

// ---- COSINE SIMILARITY ----

/**
 * Calculate cosine similarity between two equal-length vectors.
 * Returns 0-1 where 1 is identical direction.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;

  return dotProduct / denominator;
}

// ---- CATEGORY CLASSIFICATION ----

/**
 * Classify a movie's scores into one of 3 categories based on agent dimension scores.
 */
export function classifyBook(scores: AgentScore[]): string {
  const dimensions = ["pragmatist", "empath", "formalist", "moralist", "nihilist"];
  const avgByDim: Record<string, number> = {};

  for (const dim of dimensions) {
    const dimScores = scores.filter(s => s.dimension === dim).map(s => s.score);
    avgByDim[dim] = dimScores.length > 0
      ? dimScores.reduce((a, b) => a + b, 0) / dimScores.length
      : 0;
  }

  const prag = avgByDim["pragmatist"] || 0;
  const emp = avgByDim["empath"] || 0;
  const form = avgByDim["formalist"] || 0;
  const moral = avgByDim["moralist"] || 0;
  const nihil = avgByDim["nihilist"] || 0;

  // High pragmatist + empath → Commercial Bestseller
  if (prag >= 7 && emp >= 7 && form < 6) return "commercial_bestseller";
  // High formalist + moralist → Cinematic Masterpiece
  if (form >= 7 && moral >= 6) return "cinematic_masterpiece";
  // High variance moralist vs nihilist → Viral/Controversial
  if (Math.abs(moral - nihil) >= 3) return "viral_controversial";

  // Fallback: find max
  const max = Math.max(prag, emp, form, moral, nihil);
  if (max === prag || max === emp) return "commercial_bestseller";
  if (max === form) return "cinematic_masterpiece";
  return "viral_controversial";
}

// ---- BATCH SIMILARITY ----

/**
 * Compare one movie against all fingerprinted movies.
 */
export function computeSimilarities(
  targetVector: number[],
  fingerprints: FingerprintVector[]
): SimilarityResult["similar_books"] {
  return fingerprints
    .map(fp => ({
      book_id: fp.book_id,
      title: fp.book_title,
      author: fp.book_author,
      similarity: cosineSimilarity(targetVector, fp.vector),
      category: fp.category,
    }))
    .sort((a, b) => b.similarity - a.similarity);
}

// ---- CATEGORY BASELINES ----

/**
 * Compute average vectors for each category.
 */
export function computeBaselines(fingerprints: FingerprintVector[]): CategoryBaseline[] {
  const byCategory: Record<string, FingerprintVector[]> = {};

  for (const fp of fingerprints) {
    const cat = fp.category || "uncategorized";
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(fp);
  }

  const baselines: CategoryBaseline[] = [];
  for (const [cat, movies] of Object.entries(byCategory)) {
    if (movies.length === 0) continue;
    const vecLen = movies[0].vector.length;
    const avgVector: number[] = new Array(vecLen).fill(0);
    for (const movie of movies) {
      for (let i = 0; i < vecLen; i++) {
        avgVector[i] += movie.vector[i] / movies.length;
      }
    }
    baselines.push({ category: cat, avg_vector: avgVector, book_count: movies.length });
  }

  return baselines;
}

// ---- MARKET PREDICTION ----

/**
 * Generate market prediction from category similarities.
 */
export function predictMarket(
  categorySimilarities: SimilarityResult["category_similarities"]
): SimilarityResult["market_prediction"] {
  const { commercial_bestseller, cinematic_masterpiece, viral_controversial } = categorySimilarities;
  const max = Math.max(commercial_bestseller, cinematic_masterpiece, viral_controversial);
  const confidence = max;

  if (commercial_bestseller >= 0.85) {
    return { tier: "S", estimated_sales: "1M+ copies", risk_level: "low", confidence };
  }
  if (commercial_bestseller >= 0.70 || viral_controversial >= 0.70) {
    return { tier: "A", estimated_sales: "500K-1M copies", risk_level: "low", confidence };
  }
  if (cinematic_masterpiece >= 0.70) {
    return { tier: "B", estimated_sales: "100K-500K copies", risk_level: "medium", confidence };
  }
  if (max >= 0.50) {
    return { tier: "C", estimated_sales: "10K-100K copies", risk_level: "medium", confidence };
  }
  return { tier: "D", estimated_sales: "<10K copies", risk_level: "high", confidence };
}

// ---- FULL ANALYSIS ----

/**
 * Full oracle analysis: vector extraction, fingerprinting, similarity, prediction.
 */
export async function runOracle(
  bookId: string, // UUID
  bookTitle: string,
  bookAuthor: string,
  scores: AgentScore[]
): Promise<SimilarityResult> {
  const supabase = await createServerClient();
  const supabaseService = createServiceClient();

  // Extract vector
  const vector = extractVector(scores);
  if (!vector) throw new Error(`Failed to extract vector for movie ${bookId}`);

  // Classify
  const category = classifyBook(scores);

  // Get dimension averages
  const dims = ["pragmatist", "empath", "formalist", "moralist", "nihilist"];
  const avgScores: Record<string, number> = {};
  for (const d of dims) {
    const vals = scores.filter(s => s.dimension === d).map(s => s.score);
    avgScores[d] = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  }

  // Write fingerprint via service client (bypasses RLS)
  const { error: writeErr } = await supabaseService
    .from("book_fingerprints")
    .upsert({
      book_id: bookId,
      book_title: bookTitle,
      book_author: bookAuthor,
      agent_scores: vector,
      category,
      pragmatist_score: avgScores["pragmatist"],
      empath_score: avgScores["empath"],
      formalist_score: avgScores["formalist"],
      moralist_score: avgScores["moralist"],
      nihilist_score: avgScores["nihilist"],
      agent_count: [...new Set(scores.map(s => s.agent_id))].length,
      updated_at: new Date().toISOString(),
    }, { onConflict: "book_id" });

  if (writeErr) console.error("Fingerprint write error:", writeErr);

  // Fetch all other fingerprints for comparison (stream via server client)
  const { data: allFps } = await supabase.from("book_fingerprints").select("*");
  const fingerprints: FingerprintVector[] = (allFps || []).map((fp: any) => ({
    book_id: fp.book_id,
    book_title: fp.book_title,
    book_author: fp.book_author,
    vector: fp.agent_scores,
    category: fp.category,
    pragmatist_score: fp.pragmatist_score,
    empath_score: fp.empath_score,
    formalist_score: fp.formalist_score,
    moralist_score: fp.moralist_score,
    nihilist_score: fp.nihilist_score,
    agent_count: fp.agent_count,
  }));

  // Compute similarities (exclude self)
  const otherFps = fingerprints.filter(fp => fp.book_id !== bookId);
  const similarBooks = computeSimilarities(vector, otherFps).slice(0, 10);

  // Category baselines & similarities
  const baselines = computeBaselines(otherFps);
  const categorySimilarities: Record<string, number> = {
    commercial_bestseller: 0,
    cinematic_masterpiece: 0,
    viral_controversial: 0,
  };
  for (const bl of baselines) {
    categorySimilarities[bl.category] = cosineSimilarity(vector, bl.avg_vector);
  }

  // Market prediction
  const market = predictMarket(categorySimilarities);

  // Top driving agents
  const agentContributions = scores.map(s => ({
    agent_id: s.agent_id,
    dimension: s.dimension,
    score: s.score,
    contribution: s.score / 10, // normalize
  }));
  const topAgents = agentContributions
    .sort((a, b) => b.contribution - a.contribution)
    .slice(0, 5);

  return {
    target_book_id: bookId,
    target_title: bookTitle,
    similar_books: similarBooks,
    predicted_category: category,
    category_similarities: categorySimilarities,
    market_prediction: market,
    top_driving_agents: topAgents,
  };
}
