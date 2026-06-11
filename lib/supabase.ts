import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://fgnlhrdhxebvwrvqwfjj.supabase.co";

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "sb_publishable_badp82F6JQ35dlMofLTGnw_aveOVX8v";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
