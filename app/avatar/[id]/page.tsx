// CineRealm: Personal Avatar Dashboard
// Server-rendered evolution tracker for user-owned gamified avatars
// Route: /avatar/{avatar.id} — reachable only after onboarding quiz completion

import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getAvatarProfile, buildSystemPrompt } from "@/lib/evolution/avatar-evolution";
import type { AvatarProfile, CompiledSystemPrompt } from "@/types/avatar";
import CopyPromptButton from "@/components/avatar/CopyPromptButton";

// ─── Types ───────────────────────────────────────────────
interface PageProps {
  params: Promise<{ id: string }>;
}

// ─── Helpers ─────────────────────────────────────────────
const LEVEL_LABELS: Record<number, string> = {
  1: "Genesis Seed",
  2: "Memory Weaving",
  3: "Preference Forged",
  4: "RLHF Refined",
  5: "Systemic Mastery",
};

const LEVEL_EMOJI: Record<number, string> = {
  1: "🌱",
  2: "🧵",
  3: "⚒️",
  4: "💎",
  5: "👁️",
};

const LEVEL_COLOR: Record<number, string> = {
  1: "text-emerald-400",
  2: "text-sky-400",
  3: "text-amber-400",
  4: "text-violet-400",
  5: "text-rose-400",
};

const LEVEL_BG: Record<number, string> = {
  1: "bg-emerald-400/10 border-emerald-400/20",
  2: "bg-sky-400/10 border-sky-400/20",
  3: "bg-amber-400/10 border-amber-400/20",
  4: "bg-violet-400/10 border-violet-400/20",
  5: "bg-rose-400/10 border-rose-400/20",
};

const STAGE_DESCRIPTIONS: Record<number, string> = {
  1: "Your avatar has been born from your onboarding choices — three answers that set its analytical focus, rhetorical voice, and first cinematic memory.",
  2: "Import your streaming history to teach the avatar what you love and hate. Every rated movie sharpens its cinematic DNA.",
  3: "Your avatar now has distinct preferences, beloved tropes, and hot buttons. Its personality is forged — but it can still be shaped.",
  4: "Every feedback action (approve, harden stance, go deeper) rewires the avatar's recent adjustments. It's learning from your reactions in real time.",
  5: "Fifty interactions unlocked Systemic Analysis — your avatar can now trace intergenerational bonds, family constellations, and deep structural patterns in narrative.",
};

// ─── Metadata ────────────────────────────────────────────
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;

  try {
    const profile = await getAvatarProfile(id);
    if (!profile) return { title: "Avatar Not Found | CineRealm" };

    return {
      title: `${profile.avatar_name} (Lv.${profile.level}) | CineRealm`,
      description: `"${profile.core_personality}" — ${LEVEL_LABELS[profile.level]}. ${profile.analysis_focus}.`,
      keywords: [profile.avatar_name, "AI avatar", "CineRealm", profile.analysis_focus?.replace(/_/g, " ") || "", "streaming avatar"],
      openGraph: {
        title: `${profile.avatar_name} — ${LEVEL_LABELS[profile.level]} | CineRealm`,
        description: profile.core_personality,
        type: "profile",
        siteName: "CineRealm",
      },
      twitter: {
        card: "summary_large_image",
        title: `${profile.avatar_name} | CineRealm`,
        description: profile.core_personality?.slice(0, 160),
      },
      alternates: { canonical: `https://cinerealm.app/avatar/${id}` },
    };
  } catch {
    return { title: "Avatar Not Found | CineRealm" };
  }
}

// ─── Page ────────────────────────────────────────────────
export default async function AvatarDashboard({ params }: PageProps) {
  const { id } = await params;

  // ── Auth check ─────────────────────────────────────
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user?.id) {
    redirect("/login");
  }

  // ── Fetch avatar ───────────────────────────────────
  const profile = await getAvatarProfile(id);

  if (!profile) {
    notFound();
  }

  // ── Ownership gate ─────────────────────────────────
  if (profile.user_id !== session.user.id) {
    // Future: show public view | for now, 404 to not leak existence
    notFound();
  }

  // ── Compile system prompt ──────────────────────────
  const compiled: CompiledSystemPrompt = buildSystemPrompt(profile);

  // ── Extract section headers from the prompt for the chips ─
  const sectionNames = Array.from(
    compiled.prompt.matchAll(/=== (.+?) ===/g),
    (m) => m[1],
  );

  // ── Level progress bar width ───────────────────────
  const progressPercent = Math.min((profile.level / 5) * 100, 100);

  return (
    <>
      {/* JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Person",
            name: profile.avatar_name,
            description: profile.core_personality,
            knowsAbout: [
              profile.analysis_focus,
              ...profile.cinematic_preferences,
            ],
          }),
        }}
      />

      <div className="min-h-screen bg-background">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {/* ── Breadcrumb ──────────────────────────── */}
          <nav className="text-xs text-muted-foreground mb-8" aria-label="Breadcrumb">
            <ol className="flex flex-wrap gap-1.5 items-center">
              <li>
                <Link href="/" className="hover:text-primary transition-colors">
                  Home
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link href="/discuss" className="hover:text-primary transition-colors">
                  Discussions
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="text-foreground truncate max-w-[200px]">
                {profile.avatar_name}
              </li>
            </ol>
          </nav>

          {/* ── Identity Card ───────────────────────── */}
          <div className="rounded-2xl bg-card border border-border p-6 sm:p-8 mb-8">
            <div className="flex flex-col sm:flex-row gap-6 items-start">
              {/* Avatar visual */}
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-2 border-border flex-shrink-0 bg-card flex items-center justify-center">
                <img
                  src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(profile.avatar_name)}`}
                  alt={profile.avatar_name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1 space-y-3 min-w-0">
                <div className="flex items-start justify-between flex-wrap gap-3">
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-heading font-bold">
                      {profile.avatar_name}
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                      {profile.core_personality}
                    </p>
                  </div>

                  {/* Level badge */}
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold border ${LEVEL_BG[profile.level] || LEVEL_BG[1]} ${LEVEL_COLOR[profile.level] || LEVEL_COLOR[1]}`}
                  >
                    <span aria-hidden="true">{LEVEL_EMOJI[profile.level]}</span>
                    Level {profile.level} · {LEVEL_LABELS[profile.level]}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-secondary rounded-full h-2.5">
                  <div
                    className="bg-primary h-2.5 rounded-full transition-all duration-700"
                    style={{ width: `${progressPercent}%` }}
                    role="progressbar"
                    aria-valuenow={profile.level}
                    aria-valuemin={1}
                    aria-valuemax={5}
                    aria-label={`Avatar level ${profile.level} of 5`}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>Genesis</span>
                  <span>Memory</span>
                  <span>Forged</span>
                  <span>Refined</span>
                  <span>Mastery</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Two-Column Grid ──────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Left column: Core traits */}
            <div className="lg:col-span-1 space-y-6">
              {/* Stage description */}
              <div className="rounded-xl bg-card border border-border p-5">
                <h2 className="text-sm font-heading font-semibold text-primary mb-2 flex items-center gap-1.5">
                  <span>{LEVEL_EMOJI[profile.level]}</span>
                  Stage {profile.level}
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {STAGE_DESCRIPTIONS[profile.level]}
                </p>
              </div>

              {/* Analysis focus */}
              <div className="rounded-xl bg-card border border-border p-5">
                <h2 className="text-sm font-heading font-semibold text-primary mb-2">
                  🧠 Analysis Focus
                </h2>
                <p className="text-sm text-muted-foreground capitalize leading-relaxed">
                  {profile.analysis_focus?.replace(/_/g, " ") || "Not set"}
                </p>
              </div>

              {/* Agent tone */}
              <div className="rounded-xl bg-card border border-border p-5">
                <h2 className="text-sm font-heading font-semibold text-primary mb-2">
                  🎙️ Voice & Tone
                </h2>
                <p className="text-sm text-muted-foreground italic leading-relaxed">
                  {profile.agent_tone?.replace(/_/g, " ") || "Not set"}
                </p>
              </div>

              {/* Systemic analysis flag */}
              <div className="rounded-xl bg-card border border-border p-5">
                <h2 className="text-sm font-heading font-semibold text-primary mb-2">
                  👁️ Systemic Analysis
                </h2>
                {profile.systemic_analysis_unlocked ? (
                  <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-rose-400/10 text-rose-400 border border-rose-400/20">
                    🔓 Unlocked at Level 5
                  </span>
                ) : (
                  <div>
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-secondary text-muted-foreground border border-border mb-2">
                      🔒 Locked
                    </span>
                    <p className="text-xs text-muted-foreground">
                      Requires 50+ interactions (Level 5)
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Right column: DNA + Adjustments */}
            <div className="lg:col-span-2 space-y-6">
              {/* Cinematic DNA */}
              <div className="rounded-xl bg-card border border-border p-5">
                <h2 className="text-sm font-heading font-semibold text-primary mb-3">
                  📚 Cinematic DNA
                </h2>

                {profile.cinematic_preferences?.length > 0 ? (
                  <div className="mb-4">
                    <h3 className="text-xs text-muted-foreground mb-2 font-medium">
                      Preferred Genres & Styles
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {profile.cinematic_preferences.map((pref: string) => (
                        <span
                          key={pref}
                          className="px-2.5 py-1 rounded-full text-xs bg-accent text-accent-foreground border border-primary/20"
                        >
                          {pref}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground mb-4 italic">
                    No preferences yet — import your streaming history to populate.
                  </p>
                )}

                {profile.beloved_tropes?.length > 0 ? (
                  <div className="mb-4">
                    <h3 className="text-xs text-muted-foreground mb-2 font-medium">
                      ❤️ Beloved Tropes
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {profile.beloved_tropes.map((trope: string) => (
                        <span
                          key={trope}
                          className="px-2.5 py-1 rounded-full text-xs bg-emerald-400/10 text-emerald-400 border border-emerald-400/20"
                        >
                          {trope}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}

                {profile.dislikes?.length > 0 ? (
                  <div>
                    <h3 className="text-xs text-muted-foreground mb-2 font-medium">
                      ⚠️ Dislikes & Hot Buttons
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {profile.dislikes.map((d: string) => (
                        <span
                          key={d}
                          className="px-2.5 py-1 rounded-full text-xs bg-red-400/10 text-red-400 border border-red-400/20"
                        >
                          {d}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Recent RLHF Adjustments */}
              <div className="rounded-xl bg-card border border-border p-5">
                <h2 className="text-sm font-heading font-semibold text-primary mb-3 flex items-center gap-2">
                  🧬 Recent RLHF Adjustments
                  {profile.level >= 4 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-400/10 text-violet-400 border border-violet-400/20">
                      Active
                    </span>
                  )}
                </h2>
                {profile.recent_adjustments ? (
                  <div className="space-y-2">
                    {profile.recent_adjustments
                      .split(/\n\n|\n(?=\[)/)
                      .filter(Boolean)
                      .map((adjustment, i) => (
                        <div
                          key={i}
                          className="text-xs text-muted-foreground bg-secondary/50 rounded-lg p-3 border border-border leading-relaxed"
                        >
                          {adjustment.trim()}
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">
                    No adjustments yet. Feedback you give during discussions will appear here.
                  </p>
                )}
              </div>

              {/* Memory context */}
              {profile.memory_context && (
                <div className="rounded-xl bg-card border border-border p-5">
                  <h2 className="text-sm font-heading font-semibold text-primary mb-3">
                    🧿 Memory Context
                  </h2>
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-6">
                    {profile.memory_context}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ── System Prompt Preview ────────────────── */}
          <div className="rounded-2xl bg-card border border-border p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading font-semibold text-primary flex items-center gap-2">
                ⚡ Compiled System Prompt
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground font-sans">
                  ~{compiled.estimated_tokens} tokens
                </span>
              </h2>
              <CopyPromptButton text={compiled.prompt} />
            </div>

            {/* Sections list */}
            <div className="mb-4 flex flex-wrap gap-1.5">
              {sectionNames.map((name, i) => (
                <span
                  key={i}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground border border-border"
                >
                  {name}
                </span>
              ))}
            </div>

            <pre className="bg-card border border-border rounded-xl p-4 overflow-x-auto text-xs leading-relaxed text-muted-foreground max-h-64 overflow-y-auto whitespace-pre-wrap">
              {compiled.prompt}
            </pre>
          </div>

          {/* ── Action Buttons ───────────────────────── */}
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/discuss"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/10"
            >
              Join a Discussion
              <span aria-hidden="true">→</span>
            </Link>
            <Link
              href="/avatar/builder"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
            >
              Rebuild Avatar
            </Link>
            <Link
              href={`/avatar/${profile.id}/import`}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
            >
              Import Reading History
            </Link>
            {profile.level >= 4 && (
              <Link
                href={`/discuss?ref=${profile.id}`}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-violet-400/10 text-violet-400 border border-violet-400/20 hover:bg-violet-400/20 transition-colors font-semibold"
              >
                Give Feedback
                <span aria-hidden="true">🧬</span>
              </Link>
            )}
          </div>

          {/* ── Footer note ──────────────────────────── */}
          <p className="text-center text-[11px] text-muted-foreground mt-8">
            This is your personal AI viewer — visible only to you.{" "}
            <Link
              href={`/viewer/${encodeURIComponent(profile.avatar_name.toLowerCase().replace(/\s+/g, "-"))}`}
              className="text-primary hover:underline"
            >
              Make a public profile →
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
