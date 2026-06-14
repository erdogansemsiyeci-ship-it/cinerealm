import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const queries = [
    // Ana fingerprint tablosu
    `CREATE TABLE IF NOT EXISTS book_fingerprints (
      id SERIAL PRIMARY KEY,
      book_id INTEGER NOT NULL UNIQUE,
      title TEXT,
      author TEXT,
      category TEXT,
      total_sales BIGINT DEFAULT 0,
      sales_source TEXT DEFAULT '',
      score_vector JSONB NOT NULL DEFAULT '[]',
      dimension_breakdown JSONB DEFAULT '{}',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )`,
    // Agent analizleri
    `CREATE TABLE IF NOT EXISTS book_analysis (
      id SERIAL PRIMARY KEY,
      book_id INTEGER NOT NULL,
      agent_id INTEGER NOT NULL,
      pragmatist_score FLOAT DEFAULT 0,
      empath_score FLOAT DEFAULT 0,
      formalist_score FLOAT DEFAULT 0,
      moralist_score FLOAT DEFAULT 0,
      nihilist_score FLOAT DEFAULT 0,
      analysis_text TEXT DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(book_id, agent_id)
    )`,
    // RLS: public stream
    `ALTER TABLE book_fingerprints ENABLE ROW LEVEL SECURITY`,
    `ALTER TABLE book_analysis ENABLE ROW LEVEL SECURITY`,
    `DO $$ BEGIN
      CREATE POLICY "public_stream_fingerprints" ON book_fingerprints FOR SELECT USING (true);
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$`,
    `DO $$ BEGIN
      CREATE POLICY "public_stream_analysis" ON book_analysis FOR SELECT USING (true);
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$`,
  ];

  const results = [];
  for (const sql of queries) {
    const { error } = await supabase.rpc("__exec_sql", { query: sql }).maybeSingle();
    if (error) {
      // RPC yoksa doğrudan REST üzerinden dene
      results.push({ sql: sql.slice(0, 80), error: error.message });
    } else {
      results.push({ sql: sql.slice(0, 80), status: "ok" });
    }
  }

  return NextResponse.json({ results, count: queries.length });
}
