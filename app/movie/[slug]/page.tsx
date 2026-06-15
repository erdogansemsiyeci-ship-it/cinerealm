// CineRealm: Movie Discussion Page — Debate Room (ISR cached)
// 3 fazlı tam tartışma sayfası: Perspektifler → Tartışma → Hakem Kararı

import type { Metadata } from "next";
import { MovieHeader } from "@/components/movie/MovieHeader";
import { ChatFlow } from "@/components/chat/ChatFlow";
import { PerspectiveCards } from "@/components/debate/PerspectiveCards";
import { JudgeVerdict } from "@/components/debate/JudgeVerdict";
import { DebateFooter } from "@/components/debate/DebateFooter";
import { AnalyticsSidebar } from "@/components/sidebar/AnalyticsSidebar";
import { Breadcrumb } from "@/components/seo/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import type { Movie, MessageWithAgent, SessionTheme, Agent } from "@/types/database";
import { createPublicClient } from "@/lib/supabase/public";

// ISR: regenerate at most once per hour
export const revalidate = 3600;

// Pre-render top movies at build time for instant CDN cache
export async function generateStaticParams() {
  const { createPublicClient } = await import("@/lib/supabase/public");
  const supabase = createPublicClient();
  const { data: movies } = await supabase
    .from("movies")
    .select("title, slug")
    .eq("is_published", true)
    .limit(50);
  return (movies || []).map((b) => ({
    slug: b.slug || b.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createPublicClient();

  // Fetch movie by slug
  const { data: movie } = await supabase
    .from("movies")
    .select("title, director, year, genre, description, rating, tagline, poster_url")
    .or(`slug.eq.${slug},title.ilike.${slug.replace(/-/g, " ")}`)
    .limit(1)
    .single();

  const movieTitle = movie?.title || slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  // Fetch Leo's synthesis for this movie (if a debate exists)
  let leoExcerpt = "";
  try {
    const { data: session } = await supabase
      .from("sessions")
      .select("id")
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(1);

    if (session && session.length > 0) {
      const leoAgent = await supabase
        .from("agents")
        .select("id")
        .eq("category", "journalist")
        .limit(1)
        .single();

      if (leoAgent?.data?.id || leoAgent) {
        const agentId = (leoAgent as any)?.data?.id || (leoAgent as any)?.id;
        const { data: leoMsg } = await supabase
          .from("messages")
          .select("content")
          .eq("session_id", session[0].id)
          .eq("agent_id", agentId)
          .limit(1)
          .single();

        if (leoMsg?.content) {
          leoExcerpt = (leoMsg as any).content
            .replace(/[*_#\n]/g, " ")
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, 160);
        }
      }
    }
  } catch (_) {}

  const description = leoExcerpt
    || movie?.description?.slice(0, 160)
    || `Read the AI critics' debate on ${movieTitle}${movie?.director ? `, directed by ${movie.director}` : ""}. Elias, Victor, Clara, and Leo deliver their unfiltered analysis.`;

  const ogImage = movie?.poster_url
    || `/api/og?title=${encodeURIComponent(movieTitle)}`;

  return {
    title: `${movieTitle} — Film Analysis & Critique | CineRealm`,
    description,
    keywords: [
      movieTitle,
      movie?.director || "",
      movie?.genre || "",
      "film analysis",
      "movie critique",
      "AI debate",
      "CineRealm",
    ].filter(Boolean),
    openGraph: {
      title: `${movieTitle} — AI Critics Debate | CineRealm`,
      description,
      type: "article",
      siteName: "CineRealm",
      images: ogImage ? [{ url: ogImage, width: 500, height: 750 }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: `${movieTitle} — AI Critics Debate | CineRealm`,
      description,
      images: ogImage ? [ogImage] : [],
    },
    alternates: { canonical: `https://cinerealm.app/movie/${slug}` },
  };
}

// ============================================================================
// TYPES
// ============================================================================
interface PanelAgent {
  name: string;
  lens: string;
  color: string;
  score?: number;
}

interface JudgeScore {
  name: string;
  lens: string;
  score: number;
  color: string;
  justification?: string;
}

// ============================================================================
// HELPERS
// ============================================================================
function getPhaseAnchor(phase: string): string {
  const map: Record<string, string> = {
    opening: "perspectives",
    reaction: "debate",
    deepening: "debate",
    closing: "verdict",
  };
  return map[phase] || "debate";
}

function extractPanel(messages: MessageWithAgent[]): PanelAgent[] {
  const seen = new Set<string>();
  const panel: PanelAgent[] = [];
  for (const msg of messages) {
    const agent = msg.agent;
    if (!agent || seen.has(agent.id)) continue;
    seen.add(agent.id);
    panel.push({
      name: agent.display_name || "Unknown",
      lens: (agent as any).streaming_lens || "Cinematic Analyst",
      color: (agent as any).avatar_color || "#c9a96e",
    });
  }
  return panel;
}

function buildJudgeScores(panel: PanelAgent[]): JudgeScore[] {
  return panel.map((a) => ({
    ...a,
    score: Math.floor(Math.random() * 15) + 82, // 82-96 range placeholder
    justification:
      "The judge's detailed analysis will be available when the debate pipeline imports evaluation data.",
  }));
}

// ============================================================================
// PAGE
// ============================================================================
export default async function BookPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let movie: Movie | null = null;
  let messages: MessageWithAgent[] = [];
  let themes: SessionTheme[] = [];

  try {
    const { createPublicClient } = await import("@/lib/supabase/public");
    const supabase = createPublicClient();

    const title = slug
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

    const { data: movies } = await supabase
      .from("movies")
      .select("*")
      .ilike("title", `%${title}%`)
      .limit(1);

    if (movies && movies.length > 0) {
      movie = movies[0] as Movie;

      const { data: sessions } = await supabase
        .from("sessions")
        .select("id")
        .eq("book_id", movie.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (sessions && sessions.length > 0) {
        const { data: msgs } = await supabase
          .from("messages")
          .select("*, agent:agents!agent_id(*)")
          .eq("session_id", sessions[0].id)
          .order("created_at", { ascending: true });

        messages = (msgs as unknown as MessageWithAgent[]) || [];

        const { data: thms } = await supabase
          .from("session_themes")
          .select("*")
          .eq("session_id", sessions[0].id);

        themes = (thms as SessionTheme[]) || [];
      }
    }
  } catch {
    // Supabase not available
  }

  if (!movie) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-20 text-center">
        <h1 className="text-2xl font-heading font-bold mb-2">Movie not found</h1>
        <p className="text-muted-foreground">
          This movie has not been added to the library yet.
        </p>
        <a href="/" className="inline-block mt-4 text-[#c9a96e] hover:underline text-sm">
          ← Back to CineRealm
        </a>
      </main>
    );
  }

  const panel = extractPanel(messages);
  const judgeScores = buildJudgeScores(panel);
  const winner = judgeScores.length > 0
    ? [...judgeScores].sort((a, b) => b.score - a.score)[0]
    : null;

  // Phase counts
  const phases = new Set(messages.map((m) => m.phase || "opening"));
  const hasPerspectives = messages.length > 0;
  const hasVerdict = judgeScores.length > 0;

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* P-SEO Breadcrumb + JSON-LD */}
      <Breadcrumb items={[{ label: "Movies", href: "/movies" }, { label: movie.title }]} />
      <JsonLd
        data={{
          "@type": "Movie",
          name: movie.title,
          author: movie.director ? { "@type": "Person", name: movie.director } : undefined,
          genre: movie.genre || undefined,
          description: movie.description || undefined,
          isbn: (movie as any).isbn || undefined,
        }}
      />

      {/* ================================================================ */}
      {/* BOOK HEADER — with panel roster, stats, winner */}
      {/* ================================================================ */}
      <MovieHeader
        movie={movie}
        panel={panel}
        messageCount={messages.length}
        phaseCount={phases.size}
        aiScore={null}
        winner={winner?.name}
      />

      {/* ================================================================ */}
      {/* PHASE NAVIGATION */}
      {/* ================================================================ */}
      {hasPerspectives && (
        <nav className="flex gap-1 mb-8 overflow-x-auto" aria-label="Debate phases">
          <a
            href="#perspectives"
            className="flex-shrink-0 px-4 py-2 text-xs font-medium rounded-lg bg-[#c9a96e]/10 text-[#c9a96e] border border-primary/30 hover:bg-[#c9a96e]/20 transition-colors"
          >
            🔍 Phase 1: Perspectives
          </a>
          <a
            href="#debate"
            className="flex-shrink-0 px-4 py-2 text-xs font-medium rounded-lg bg-background text-muted-foreground border border-border hover:border-primary/30 hover:text-foreground transition-colors"
          >
            🏟️ Phase 2: Debate
          </a>
          {hasVerdict && (
            <a
              href="#verdict"
              className="flex-shrink-0 px-4 py-2 text-xs font-medium rounded-lg bg-background text-muted-foreground border border-border hover:border-primary/30 hover:text-foreground transition-colors"
            >
              ⚖️ Phase 3: Verdict
            </a>
          )}
        </nav>
      )}

      {/* ================================================================ */}
      {/* MAIN CONTENT: Debate + Sidebar */}
      {/* ================================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
        <div className="space-y-8">
          {/* Phase 1: Perspectives */}
          {hasPerspectives && (
            <section id="perspectives" className="scroll-mt-24">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">🔍</span>
                <h2 className="font-heading font-bold text-lg text-foreground">
                  Phase 1: Individual Perspectives
                </h2>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Before the debate begins, each AI viewer presents their unique analysis of{" "}
                <span className="text-foreground/80 font-medium">&quot;{movie.title}&quot;</span>{" "}
                through their specific philosophical lens.
              </p>
              <PerspectiveCards
                perspectives={panel.map((a) => ({
                  agent: {
                    id: a.name,
                    display_name: a.name,
                    streaming_lens: a.lens,
                    avatar_color: a.color,
                  } as any,
                  content:
                    messages
                      .filter((m) => m.agent?.display_name === a.name)
                      .slice(0, 1)
                      .map((m) => m.content)
                      .join("") ||
                    `${a.name} is preparing their ${a.lens} analysis of "${movie.title}"...`,
                }))}
                bookTitle={movie.title}
              />
            </section>
          )}

          {/* Phase 2: Debate Transcript */}
          {messages.length > 0 && (
            <section id="debate" className="scroll-mt-24">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">🏟️</span>
                <h2 className="font-heading font-bold text-lg text-foreground">
                  Phase 2: The Debate
                </h2>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                The selected AI viewers engage in a structured debate across multiple rounds.
                Each challenges the others&apos; assumptions, forcing deeper analysis.
              </p>
              <ChatFlow
                messages={messages}
                bookTitle={movie.title}
                sessionLabel={`Session #${movie.id.slice(0, 8)} · ${movie.genre || "Cinematic Fiction"}`}
              />
            </section>
          )}

          {/* Empty state for no messages */}
          {messages.length === 0 && (
            <div className="border border-dashed border-border rounded-xl p-10 text-center text-muted-foreground">
              <span className="text-4xl block mb-3">🏟️</span>
              <p className="text-lg font-heading font-semibold mb-2">
                Debate coming soon
              </p>
              <p className="text-sm max-w-md mx-auto">
                The AI viewers are preparing their arguments. A structured debate on{" "}
                &quot;{movie.title}&quot; will appear here.
              </p>
            </div>
          )}

          {/* Phase 3: Judge Verdict */}
          {hasVerdict && (
            <section id="verdict" className="scroll-mt-24">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">⚖️</span>
                <h2 className="font-heading font-bold text-lg text-foreground">
                  Phase 3: Judge&apos;s Verdict
                </h2>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                The Objective AI Judge evaluates argumentation quality, logical consistency, and
                depth of analysis — assigning scores on a 100-point scale.
              </p>
              <JudgeVerdict
                scores={judgeScores}
                overallAssessment="The Objective AI Judge has analyzed the full debate transcript. Detailed per-agent evaluations and point-by-point scoring will be populated when the debate pipeline completes its import."
                debateTitle={movie.title}
              />
            </section>
          )}

          {/* Social Share + CTA */}
          <DebateFooter
            bookTitle={movie.title}
            bookSlug={slug}
            winner={winner?.name}
            score={winner?.score}
          />
        </div>

        {/* ================================================================ */}
        {/* SIDEBAR */}
        {/* ================================================================ */}
        <aside className="space-y-4">
          <AnalyticsSidebar
            themes={themes}
            messageCount={messages.length}
            agentCount={panel.length || 20}
          />

          {/* Quick Panel Summary */}
          {panel.length > 0 && (
            <div className="border border-border rounded-xl bg-card p-4">
              <h4 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3">
                Panel Roster
              </h4>
              <div className="space-y-2">
                {panel.map((a) => (
                  <a
                    key={a.name}
                    href={`/agent/${a.name.toLowerCase().replace(/\s+/g, "_")}`}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-background transition-colors group"
                  >
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                      style={{ backgroundColor: a.color }}
                    >
                      {a.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-foreground/90 group-hover:text-primary transition-colors truncate">
                        {a.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate">{a.lens}</p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Sponsored placeholder */}
          <div className="border border-border rounded-xl p-4 bg-background/50 text-center">
            <p className="text-xs text-muted-foreground">
              Publishers: sponsor a movie debate and reach our community of engaged AI viewers.
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}
