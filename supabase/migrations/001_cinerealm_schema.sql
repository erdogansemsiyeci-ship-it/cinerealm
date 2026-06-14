-- CineRealm v3 Schema — Fresh Start
-- Supabase: ucnylwlyfsbcfdntsgdq (West EU / Ireland)

-- UUID generation uses gen_random_uuid() (pgcrypto, always available)

-- ============================================================
-- MOVIES
-- ============================================================
CREATE TABLE IF NOT EXISTS movies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  director TEXT,
  year INTEGER,
  genre TEXT,
  description TEXT,
  poster_url TEXT,
  backdrop_url TEXT,
  tmdb_id INTEGER,
  imdb_id TEXT,
  runtime INTEGER,           -- minutes
  language TEXT DEFAULT 'en',
  country TEXT,
  rating NUMERIC(3,1),        -- e.g. 8.5
  metacritic INTEGER,
  tagline TEXT,
  trailer_url TEXT,
  is_published BOOLEAN DEFAULT true,
  content_hash TEXT,
  slug TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- AGENTS (AI cinema critics / experts)
-- ============================================================
CREATE TABLE IF NOT EXISTS agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name TEXT NOT NULL,
  age INTEGER,
  gender TEXT,
  nationality TEXT,
  personality_style TEXT,     -- e.g. 'analytical', 'passionate', 'contrarian'
  expertise TEXT[],            -- e.g. {'screenwriting', 'cinematography'}
  bio TEXT,
  avatar_url TEXT,
  category TEXT,               -- e.g. 'visual', 'narrative', 'cultural', 'philosophical'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- DISCUSSIONS (agent debates about movies)
-- ============================================================
CREATE TABLE IF NOT EXISTS discussions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  movie_id UUID REFERENCES movies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  topic TEXT,                  -- e.g. 'cinematography', 'screenplay', 'themes'
  status TEXT DEFAULT 'pending',  -- pending, in_progress, completed
  agent_count INTEGER DEFAULT 2,
  message_count INTEGER DEFAULT 0,
  phase TEXT DEFAULT 'perspectives',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- DISCUSSION MESSAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discussion_id UUID REFERENCES discussions(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  reply_to_agent UUID REFERENCES agents(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  turn_number INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- FINGERPRINTS (for Predictive Oracle / B2B)
-- ============================================================
CREATE TABLE IF NOT EXISTS fingerprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  movie_id UUID REFERENCES movies(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  fingerprint_vector JSONB,
  cosine_similarity NUMERIC(5,4),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_movies_slug ON movies(slug);
CREATE INDEX IF NOT EXISTS idx_movies_genre ON movies(genre);
CREATE INDEX IF NOT EXISTS idx_movies_year ON movies(year);
CREATE INDEX IF NOT EXISTS idx_discussions_movie ON discussions(movie_id);
CREATE INDEX IF NOT EXISTS idx_discussions_status ON discussions(status);
CREATE INDEX IF NOT EXISTS idx_messages_discussion ON messages(discussion_id);
CREATE INDEX IF NOT EXISTS idx_messages_agent ON messages(agent_id);
CREATE INDEX IF NOT EXISTS idx_agents_category ON agents(category);

-- ============================================================
-- RLS — allow public read, service_role full access
-- ============================================================
ALTER TABLE movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE fingerprints ENABLE ROW LEVEL SECURITY;

-- Public can read all
CREATE POLICY "Public read movies" ON movies FOR SELECT USING (true);
CREATE POLICY "Public read agents" ON agents FOR SELECT USING (true);
CREATE POLICY "Public read discussions" ON discussions FOR SELECT USING (true);
CREATE POLICY "Public read messages" ON messages FOR SELECT USING (true);
CREATE POLICY "Public read fingerprints" ON fingerprints FOR SELECT USING (true);

-- Service role can do everything (default, no policy needed)
