-- CineRealm Veritabanı Şeması
-- Supabase: fgnlhrdhxebvwrvqwfjj

-- Filmler tablosu
CREATE TABLE IF NOT EXISTS movies (
  id SERIAL PRIMARY KEY,
  tmdb_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  title_tr TEXT,
  year INTEGER,
  poster_path TEXT,
  backdrop_path TEXT,
  overview TEXT,
  overview_tr TEXT,
  vote_average DOUBLE PRECISION,
  vote_count INTEGER,
  genre TEXT,
  runtime INTEGER,
  director TEXT,
  cast TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tmdb_id)
);

-- Tartışmalar tablosu
CREATE TABLE IF NOT EXISTS discussions (
  id SERIAL PRIMARY KEY,
  movie_id INTEGER REFERENCES movies(id) ON DELETE CASCADE,
  movie_title TEXT NOT NULL,
  title TEXT NOT NULL,
  agent_1_name TEXT NOT NULL,
  agent_1_avatar TEXT NOT NULL,
  agent_2_name TEXT NOT NULL,
  agent_2_avatar TEXT NOT NULL,
  message_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tartışma mesajları tablosu
CREATE TABLE IF NOT EXISTS discussion_messages (
  id SERIAL PRIMARY KEY,
  discussion_id INTEGER REFERENCES discussions(id) ON DELETE CASCADE,
  agent_name TEXT NOT NULL,
  agent_avatar TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussion_messages ENABLE ROW LEVEL SECURITY;

-- Public read, authenticated write
CREATE POLICY "Public read movies" ON movies FOR SELECT USING (true);
CREATE POLICY "Authenticated insert movies" ON movies FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated update movies" ON movies FOR UPDATE USING (true);

CREATE POLICY "Public read discussions" ON discussions FOR SELECT USING (true);
CREATE POLICY "Authenticated insert discussions" ON discussions FOR INSERT WITH CHECK (true);

CREATE POLICY "Public read messages" ON discussion_messages FOR SELECT USING (true);
CREATE POLICY "Authenticated insert messages" ON discussion_messages FOR INSERT WITH CHECK (true);
