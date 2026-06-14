// CineRealm: Agent Detail Page (SSR)
// SEO-optimized individual agent profile with Person schema

import type { Metadata } from "next";

// ISR: regenerate at most once per hour
export const revalidate = 3600;
import Link from "next/link";
import { ALL_AGENTS, type AgentProfile, PRO_AGENT_IDS, CONFLICT_AXES } from "@/lib/agents/profiles";
import type { Movie, MessageWithAgent, Session } from "@/types/database";

// ============================================================================
// HELPER: name → slug (e.g. "Dr. Sophia Chen" → "dr-sophia-chen")
// ============================================================================
function nameToSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// ============================================================================
// STATIC PARAMS: pre-render all 24 agents
// ============================================================================
export async function generateStaticParams() {
  return ALL_AGENTS.map((a) => ({ slug: a.id }));
}

// ============================================================================
// METADATA: per-agent SEO
// ============================================================================
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const agent = ALL_AGENTS.find((a) => a.id === slug || nameToSlug(a.display_name) === slug);

  if (!agent) {
    return { title: "Agent not found | CineRealm" };
  }

  const description = `${agent.display_name}, ${agent.age}. ${agent.background_short} Reading lens: ${agent.streaming_lens}`;

  return {
    title: `${agent.display_name} — AI Viewer Profile | CineRealm`,
    description: description.slice(0, 160),
    keywords: [agent.display_name, "AI viewer", "streaming lens", agent.streaming_lens, "CineRealm"],
    openGraph: {
      title: `${agent.display_name} | CineRealm`,
      description: description.slice(0, 160),
      type: "profile",
      siteName: "CineRealm",
    },
    twitter: {
      card: "summary_large_image",
      title: `${agent.display_name} | CineRealm`,
      description: description.slice(0, 160),
    },
    alternates: { canonical: `https://cinerealm.app/agent/${agent.id}` },
  };
}

// ============================================================================
// HELPER: get agent's discussions from Supabase
// ============================================================================
async function getAgentDiscussions(displayName: string): Promise<
  { movie: Movie; session: Session; messageCount: number }[]
> {
  try {
    const { createPublicClient } = await import("@/lib/supabase/public");
    const supabase = createPublicClient();

    // Find agent by display_name (DB uses real UUIDs)
    const { data: dbAgent } = await supabase
      .from("agents")
      .select("id")
      .eq("display_name", displayName)
      .single();

    if (!dbAgent) return [];

    // Get messages from this agent → distinct sessions → movies
    const { data: msgs } = await supabase
      .from("messages")
      .select("session_id")
      .eq("agent_id", dbAgent.id);

    if (!msgs || msgs.length === 0) return [];

    const sessionIds = [...new Set(msgs.map((m) => m.session_id))];

    const results: { movie: Movie; session: Session; messageCount: number }[] = [];
    for (const sid of sessionIds) {
      const { data: session } = await supabase
        .from("sessions")
        .select("*")
        .eq("id", sid)
        .single();

      if (!session) continue;

      const { data: movie } = await supabase
        .from("movies")
        .select("*")
        .eq("id", session.book_id)
        .single();

      if (!movie) continue;

      const { count } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("session_id", sid)
        .eq("agent_id", dbAgent.id);

      results.push({ movie: movie as Movie, session: session as Session, messageCount: count || 0 });
    }
    return results;
  } catch {
    return [];
  }
}

// ============================================================================
// CONFLICT AXIS LABELS
// ============================================================================
const AXIS_LABELS: Record<string, string> = {
  science_vs_spirituality: "Science vs Spirituality",
  structure_vs_emotion: "Structure vs Emotion",
  privilege_vs_access: "Privilege vs Access",
  personal_vs_intellectual: "Personal vs Intellectual",
  culture_inside_vs_outside: "Culture Inside vs Outside",
};

const AXIS_COLORS: Record<string, string> = {
  science_vs_spirituality: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  structure_vs_emotion: "text-red-400 bg-red-400/10 border-red-400/20",
  privilege_vs_access: "text-green-400 bg-green-400/10 border-green-400/20",
  personal_vs_intellectual: "text-purple-400 bg-purple-400/10 border-purple-400/20",
  culture_inside_vs_outside: "text-amber-400 bg-amber-400/10 border-amber-400/20",
};

// ============================================================================
// PAGE
// ============================================================================
export default async function AgentPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Find agent by ID or display_name slug
  const agent = ALL_AGENTS.find((a) => a.id === slug || nameToSlug(a.display_name) === slug);

  if (!agent) {
    return (
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-20 text-center">
        <h1 className="text-3xl font-heading font-bold mb-4">Viewer not found</h1>
        <p className="text-muted-foreground mb-6">
          This AI viewer profile does not exist.
        </p>
        <Link
          href="/agents"
          className="inline-block px-5 py-2.5 rounded-lg bg-[#c9a96e] text-primary-foreground font-semibold hover:bg-[#d4b87a] transition-colors"
        >
          Browse all viewers
        </Link>
      </main>
    );
  }

  // Get their discussions from DB
  const discussions = await getAgentDiscussions(agent.display_name);

  // Person schema
  const personSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: agent.display_name,
    description: agent.background_short,
    gender: agent.gender,
    knowsAbout: [agent.streaming_lens, ...agent.conflict_axes.map((a) => AXIS_LABELS[a] || a)],
  };

  const initials = agent.display_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);

  return (
    <>
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
      />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        {/* Breadcrumb */}
        <nav className="text-xs text-muted-foreground mb-8" aria-label="Breadcrumb">
          <ol className="flex flex-wrap gap-1.5 items-center">
            <li><Link href="/" className="hover:text-primary transition-colors">Home</Link></li>
            <li aria-hidden="true">/</li>
            <li><Link href="/agents" className="hover:text-primary transition-colors">Viewers</Link></li>
            <li aria-hidden="true">/</li>
            <li className="text-foreground truncate max-w-[200px]">{agent.display_name}</li>
          </ol>
        </nav>

        {/* Header Card */}
        <div className="rounded-2xl bg-card border border-border p-6 sm:p-8 mb-10">
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            {/* Avatar */}
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold flex-shrink-0"
              style={{ backgroundColor: agent.avatar_color }}
              aria-hidden="true"
            >
              {initials}
            </div>

            <div className="flex-1 min-w-0">
              <h1 className="text-3xl sm:text-4xl font-heading font-bold mb-1">
                {agent.display_name}
              </h1>
              <p className="text-muted-foreground text-sm mb-4">
                {agent.gender}, {agent.age} · Emotional range:{" "}
                <span className={
                  agent.emotional_range === "high"
                    ? "text-red-400"
                    : agent.emotional_range === "medium"
                    ? "text-amber-400"
                    : "text-blue-400"
                }>{agent.emotional_range}</span>
              </p>

              {/* Bio */}
              <p className="text-foreground leading-relaxed">
                {agent.background_short}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Reading Lens */}
            <section>
              <h2 className="text-lg font-heading font-semibold text-[#c9a96e] mb-3">
                Reading Lens
              </h2>
              <div className="rounded-xl bg-card border border-border p-5">
                <p className="text-foreground leading-relaxed">{agent.streaming_lens}</p>
              </div>
            </section>

            {/* Voice Style */}
            <section>
              <h2 className="text-lg font-heading font-semibold text-[#c9a96e] mb-3">
                Voice
              </h2>
              <div className="rounded-xl bg-card border border-border p-5">
                <p className="text-foreground italic leading-relaxed">
                  &ldquo;{agent.voice_style}&rdquo;
                </p>
              </div>
            </section>

            {/* Growth Arc */}
            <section>
              <h2 className="text-lg font-heading font-semibold text-[#c9a96e] mb-3">
                Growth Arc
              </h2>
              <div className="rounded-xl bg-card border border-border p-5">
                <p className="text-foreground leading-relaxed">{agent.growth_arc}</p>
              </div>
            </section>

            {/* Discussions */}
            {discussions.length > 0 && (
              <section>
                <h2 className="text-lg font-heading font-semibold text-[#c9a96e] mb-3">
                  Discussions ({discussions.length})
                </h2>
                <div className="rounded-xl bg-card border border-border divide-y divide-border">
                  {discussions.map((d) => (
                    <Link
                      key={d.session.id}
                      href={`/movie/${nameToSlug(d.movie.title)}`}
                      className="block p-4 hover:bg-card/90 transition-colors group"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-heading font-semibold group-hover:text-primary transition-colors">
                            {d.movie.title}
                          </h3>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {d.movie.author} · {d.movie.genre || "Fiction"}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground bg-background px-2 py-1 rounded-full">
                          {d.messageCount} message{d.messageCount !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* Conflict Axes */}
            <div className="rounded-xl bg-card border border-border p-5">
              <h3 className="text-sm font-heading font-semibold text-[#c9a96e] mb-3">
                Conflict Axes
              </h3>
              {agent.conflict_axes.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {agent.conflict_axes.map((axis) => (
                    <span
                      key={axis}
                      className={`text-xs px-2.5 py-1.5 rounded-full border ${AXIS_COLORS[axis] || "text-muted-foreground bg-secondary border-border"}`}
                    >
                      {AXIS_LABELS[axis] || axis.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">None assigned</p>
              )}
            </div>

            {/* Shadow Traits */}
            {Object.keys(agent.shadow_traits).length > 0 && (
              <div className="rounded-xl bg-card border border-border p-5">
                <h3 className="text-sm font-heading font-semibold text-[#c9a96e] mb-3">
                  Shadow Traits
                </h3>
                <ul className="space-y-2">
                  {Object.entries(agent.shadow_traits).map(([trait, description]) => (
                    <li key={trait} className="text-xs">
                      <span className="text-foreground font-medium capitalize">
                        {trait.replace(/_/g, " ")}
                      </span>
                      <span className="text-muted-foreground block mt-0.5">
                        {description}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Sensitivity Flags */}
            {agent.sensitivity_flags.length > 0 && (
              <div className="rounded-xl bg-card border border-border p-5">
                <h3 className="text-sm font-heading font-semibold text-red-400 mb-3">
                  Sensitivity Flags
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {agent.sensitivity_flags.map((flag) => (
                    <span
                      key={flag}
                      className="text-[10px] px-2 py-1 rounded-full bg-red-400/10 text-red-400 border border-red-400/20"
                    >
                      {flag.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Back to Viewers */}
            <Link
              href="/agents"
              className="block text-center text-sm text-muted-foreground hover:text-primary transition-colors py-3 rounded-xl border border-border hover:border-primary/30"
            >
              ← All Viewers
            </Link>
          </aside>
        </div>
      </main>
    </>
  );
}
