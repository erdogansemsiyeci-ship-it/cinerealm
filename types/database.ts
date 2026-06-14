// ============================================================================
// CineRealm: Database Types
// Match the Supabase schema (001_cinerealm_schema.sql)
// ============================================================================

// ── Movies ────────────────────────────────────────────────────────
export interface Movie {
  id: string;
  title: string;
  director: string | null;
  year: number | null;
  genre: string | null;
  description: string | null;
  poster_url: string | null;
  backdrop_url: string | null;
  tmdb_id: number | null;
  imdb_id: string | null;
  runtime: number | null;
  language: string;
  country: string | null;
  rating: number | null;
  metacritic: number | null;
  tagline: string | null;
  trailer_url: string | null;
  is_published: boolean;
  content_hash: string | null;
  slug: string | null;
  created_at: string;
  updated_at: string;
}

// ── Agents ───────────────────────────────────────────────────────
export interface Agent {
  id: string;
  display_name: string;
  age: number | null;
  gender: string | null;
  nationality: string | null;
  personality_style: string | null;
  expertise: string[] | null;
  bio: string | null;
  avatar_url: string | null;
  category: string | null;
  is_active: boolean;
  created_at: string;
}

// ── Discussions ────────────────────────────────────────────────
export interface Discussion {
  id: string;
  movie_id: string;
  title: string;
  topic: string | null;
  status: string;
  agent_count: number;
  message_count: number;
  phase: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  movies?: Movie;
}

// ── Messages ───────────────────────────────────────────────────
export interface Message {
  id: string;
  discussion_id: string;
  agent_id: string | null;
  reply_to_agent: string | null;
  content: string;
  turn_number: number;
  created_at: string;
  // Joined
  agents?: Agent;
  reply_to?: Agent;
}

// ── Fingerprints ───────────────────────────────────────────────
export interface Fingerprint {
  id: string;
  movie_id: string;
  agent_id: string;
  fingerprint_vector: any;
  cosine_similarity: number | null;
  created_at: string;
}

// ── Database schema (for Supabase type generation) ─────────────
export interface Database {
  public: {
    Tables: {
      movies: { Row: Movie };
      agents: { Row: Agent };
      discussions: { Row: Discussion };
      messages: { Row: Message };
      fingerprints: { Row: Fingerprint };
    };
  };
}
