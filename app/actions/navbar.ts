"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function getNavProfile(): Promise<{
  session: boolean;
  username?: string;
  tier?: string;
} | null> {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { session: false };

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, membership_tier")
    .eq("id", session.user.id)
    .single();

  return {
    session: true,
    username: profile?.username ?? session.user.email?.split("@")[0] ?? "Viewer",
    tier: profile?.membership_tier ?? "free",
  };
}
