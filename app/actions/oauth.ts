"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

// ── Magic Link (passwordless) ────────────────────────

export async function sendMagicLink(formData: FormData): Promise<{ error?: string; success?: boolean }> {
  const email = (formData.get("email") as string)?.trim() || "";

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Please enter a valid email address." };
  }

  const supabase = await createClient();
  const origin = (await headers()).get("origin") || process.env.NEXT_PUBLIC_SITE_URL || "https://cinerealm.app";

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/dashboard`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

// ── Google OAuth ─────────────────────────────────────

export async function signInWithGoogle(): Promise<void> {
  const supabase = await createClient();
  const origin = (await headers()).get("origin") || process.env.NEXT_PUBLIC_SITE_URL || "https://cinerealm.app";

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  // signInWithOAuth returns a URL — redirect the user there
  if (data?.url) {
    redirect(data.url);
  }
}

// ── Auth callback handler ────────────────────────────

export async function handleAuthCallback(code: string): Promise<{ error?: string }> {
  if (!code) return { error: "No auth code provided." };

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return { error: error.message };
  }

  redirect("/dashboard");
}
