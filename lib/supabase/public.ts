// Public Supabase client for server components (no cookies — ISR cacheable)
// Use this for public-facing pages that don't need auth (movie pages, agent pages, etc.)
// Unlike server.ts, this does NOT call cookies() so Next.js won't mark pages as dynamic.

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export function createPublicClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
