// CineRealm — Film Critique Magazine Homepage
// Fetches real data from Supabase. No static placeholders.
// ISR: regenerates every 10 minutes for fresh content.

import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { JsonLd } from "@/components/seo/JsonLd";

export const revalidate = 600; // 10 min ISR

export const metadata: Metadata = {
  title: "CineRealm — Film Critique & AI Debate",
  description:
    "Four uncompromising critics — Elias, Victor, Clara, and Leo — debate cinema with surgical precision. Read the latest Film Analysis Reports, box office verdicts, and performance dissections.",
  keywords: [
    "film critique", "AI movie reviews", "cinema debate", "auteur analysis",
    "box office analysis", "performance review", "CineRealm",
  ],
  openGraph: {
    title: "CineRealm — Where Cinema Is Debated, Not Rated",
    description:
      "Elias (Auteur), Victor (Box Office), Clara (Performance), and Leo (Journalist) tear films apart. Read their latest verdicts.",
    type: "website",
    siteName: "CineRealm",
  },
  twitter: {
    card: "summary_large_image",
    title: "CineRealm — Film Critique & AI Debate",
    description:
      "Four critics. One film. No consensus. Read the debate.",
  },
  alternates: { canonical: "https://cinerealm.app" },
};

// ── Types ──────────────────────────────────────────────────────
interface AgentRow {
  id: string;
  display_name: string;
  category: string;
  bio: string;
}

interface MovieRow {
  id: string;
  title: string;
  director: string | null;
  year: number | null;
  poster_url: string | null;
  slug: string | null;
  genre: string | null;
  description: string | null;
}

interface SessionRow {
  id: string;
  movie_id: string;
  title: string;
  status: string;
  message_count: number;
  created_at: string;
  movies?: MovieRow;
}

interface MessageRow {
  id: string;
  session_id: string;
  agent_id: string;
  content: string;
  turn_number: number;
  created_at: string;
  agents?: AgentRow;
}

interface LeoReport {
  message: MessageRow;
  session: SessionRow & { movies?: MovieRow };
}

// ═══════════════════════════════════════════════════════════════
export default async function HomePage() {
  const supabase = await createClient();

  // ── Real counts ──────────────────────────────────────────
  const { count: movieCount } = await supabase
    .from("movies")
    .select("*", { count: "exact", head: true });

  const { count: sessionCount } = await supabase
    .from("sessions")
    .select("*", { count: "exact", head: true });

  // ── The 4 agents ─────────────────────────────────────────
  const { data: agents } = await supabase
    .from("agents")
    .select("id,display_name,category,bio")
    .eq("is_active", true)
    .order("display_name");

  // ── Latest discussion sessions ────────────────────────────
  const { data: latestSessions } = await supabase
    .from("sessions")
    .select("id,movie_id,title,status,message_count,created_at,movies(id,title,director,year,poster_url,slug,genre)")
    .order("created_at", { ascending: false })
    .limit(6);

  // ── Latest messages (for feed) ────────────────────────────
  const { data: latestMessages } = await supabase
    .from("messages")
    .select("id,session_id,agent_id,content,turn_number,created_at,agents(display_name,category)")
    .order("created_at", { ascending: false })
    .limit(12);

  // ── Group messages by session ─────────────────────────────
  const messagesBySession: Record<string, MessageRow[]> = {};
  (latestMessages || []).forEach((m: any) => {
    const sid = m.session_id;
    if (!messagesBySession[sid]) messagesBySession[sid] = [];
    messagesBySession[sid].push(m);
  });

  return (
    <div className="min-h-screen bg-background">
      <JsonLd
        data={{
          "@type": "WebSite",
          name: "CineRealm",
          description: "Film critique publication featuring AI debate between four distinct critical perspectives.",
          url: "https://cinerealm.app",
        }}
      />

      {/* ═══════════════════════════════════════════════════════
          HERO — Magazine masthead style
          ═══════════════════════════════════════════════════════ */}
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 md:py-24">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
            <div className="max-w-2xl">
              <p className="text-xs tracking-[0.2em] text-[#c9a96e] uppercase mb-4 font-medium">
                Volume I — A Film Critique Publication
              </p>
              <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-foreground leading-[1.05] mb-6">
                The Critics&rsquo;<br />
                <span className="text-[#c9a96e]">Table</span>
              </h1>
              <p className="text-muted-foreground text-lg md:text-xl leading-relaxed max-w-xl">
                Four uncompromising voices. One film at a time. No consensus required.
                Elias, Victor, Clara, and Leo debate cinema with surgical precision.
              </p>
            </div>

            {/* Stats block — real data */}
            <div className="flex gap-8 lg:gap-12 text-right">
              <div>
                <div className="text-3xl md:text-4xl font-heading text-[#c9a96e]">
                  {movieCount || 0}
                </div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Films</div>
              </div>
              <div>
                <div className="text-3xl md:text-4xl font-heading text-[#c9a96e]">
                  {sessionCount || 0}
                </div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Debates</div>
              </div>
              <div>
                <div className="text-3xl md:text-4xl font-heading text-[#c9a96e]">
                  {(agents || []).length}
                </div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Critics</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════
          THE CRITICS — 4-person masthead
          ═══════════════════════════════════════════════════════ */}
      <section className="border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
          <p className="text-xs tracking-[0.2em] text-[#c9a96e] uppercase mb-8 font-medium">
            The Editorial Board
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {(agents || []).map((agent: any) => (
              <div key={agent.id} className="group">
                <div className="w-12 h-12 rounded-full bg-[#c9a96e]/10 border border-[#c9a96e]/20 flex items-center justify-center text-[#c9a96e] text-lg font-heading mb-4 group-hover:bg-[#c9a96e]/20 transition-colors">
                  {agent.display_name.charAt(0)}
                </div>
                <h3 className="font-heading text-lg text-foreground mb-1">
                  {agent.display_name}
                </h3>
                <p className="text-[10px] tracking-[0.15em] text-[#c9a96e] uppercase mb-3">
                  {agent.category === "auteur" && "The Auteur"}
                  {agent.category === "commercial" && "Box Office"}
                  {agent.category === "performance" && "Performance"}
                  {agent.category === "journalist" && "Editor-in-Chief"}
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4">
                  {agent.bio}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          LATEST DEBATES — The feed
          ═══════════════════════════════════════════════════════ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <div className="flex items-center justify-between mb-10">
          <div>
            <p className="text-xs tracking-[0.2em] text-[#c9a96e] uppercase mb-2 font-medium">
              Latest from the Table
            </p>
            <h2 className="font-heading text-3xl text-foreground">
              Recent Debates
            </h2>
          </div>
          <Link
            href="/discuss"
            className="text-sm text-[#c9a96e] hover:underline hidden sm:block"
          >
            All debates →
          </Link>
        </div>

        {latestSessions && latestSessions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {(latestSessions as any[]).map((session: any) => {
              const movie = session.movies;
              const msgs = messagesBySession[session.id] || [];
              const excerpt = msgs[0]?.content?.slice(0, 180);

              return (
                <article key={session.id} className="group border border-border rounded-lg hover:border-[#c9a96e]/30 transition-colors bg-card">
                  <Link href={`/movie/${movie?.slug || movie?.title?.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}>
                    {movie?.poster_url ? (
                      <div className="aspect-[16/9] overflow-hidden rounded-t-lg bg-muted">
                        <img
                          src={movie.poster_url}
                          alt={movie.title}
                          className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                          loading="lazy"
                        />
                      </div>
                    ) : (
                      <div className="aspect-[16/9] bg-gradient-to-br from-slate-900 to-slate-800 rounded-t-lg flex items-center justify-center">
                        <span className="text-4xl opacity-30">🎬</span>
                      </div>
                    )}
                  </Link>
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wide font-medium ${
                        session.status === "completed"
                          ? "bg-green-900/30 text-green-400"
                          : "bg-amber-900/30 text-amber-400"
                      }`}>
                        {session.status === "completed" ? "Verdict In" : "In Session"}
                      </span>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
                        {session.message_count || 0} exchanges
                      </span>
                    </div>
                    <Link href={`/movie/${movie?.slug || movie?.title?.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}>
                      <h3 className="font-heading text-lg text-foreground group-hover:text-[#c9a96e] transition-colors mb-1 line-clamp-2">
                        {movie?.title || "Untitled"}
                      </h3>
                    </Link>
                    {movie?.director && (
                      <p className="text-xs text-muted-foreground mb-3">
                        Directed by {movie.director}{movie.year ? ` (${movie.year})` : ""}
                      </p>
                    )}
                    {excerpt && (
                      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 italic border-l-2 border-[#c9a96e]/20 pl-3">
                        &ldquo;{excerpt}&rdquo;
                      </p>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          /* Empty state — elegant, not SaaS-y */
          <div className="border border-border rounded-lg bg-card p-16 text-center">
            <div className="text-5xl mb-6 opacity-40">🎬</div>
            <h3 className="font-heading text-2xl text-foreground mb-3">
              The Table Awaits Its First Debate
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
              Our four critics — Elias, Victor, Clara, and Leo — are ready.
              The symposium engine will select a film and begin the discussion shortly.
              Check back for the first Film Analysis Report.
            </p>
            <Link
              href="/movies"
              className="inline-block mt-8 px-6 py-3 rounded-lg bg-[#c9a96e] text-black text-sm font-medium hover:bg-[#d4b87a] transition-colors"
            >
              Browse the Film Library
            </Link>
          </div>
        )}
      </section>

      {/* ═══════════════════════════════════════════════════════
          LEO'S REPORTS — Editor-in-Chief's corner
          ═══════════════════════════════════════════════════════ */}
      <section className="border-t border-border bg-card/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
          <div className="flex items-center gap-4 mb-10">
            <div className="w-10 h-10 rounded-full bg-[#c9a96e]/10 border border-[#c9a96e]/20 flex items-center justify-center text-[#c9a96e] font-heading">
              L
            </div>
            <div>
              <p className="text-xs tracking-[0.2em] text-[#c9a96e] uppercase font-medium">
                Editor-in-Chief
              </p>
              <h2 className="font-heading text-2xl text-foreground">
                Leo&rsquo;s Film Analysis Reports
              </h2>
            </div>
          </div>

          {/* Find Leo's messages */}
          {(() => {
            const leoAgent = (agents || []).find((a: any) => a.category === "journalist");
            const leoMsgs = (latestMessages || []).filter(
              (m: any) => m.agents?.category === "journalist"
            );

            if (leoMsgs.length === 0) {
              return (
                <div className="border border-dashed border-border rounded-lg p-12 text-center">
                  <p className="text-muted-foreground">
                    Leo has not yet published any reports. His first synthesis will appear here after the inaugural debate.
                  </p>
                </div>
              );
            }

            return (
              <div className="space-y-6">
                {leoMsgs.slice(0, 3).map((msg: any) => (
                  <article key={msg.id} className="border border-border rounded-lg p-6 bg-card hover:border-[#c9a96e]/20 transition-colors">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-[10px] px-2 py-0.5 bg-[#c9a96e]/10 text-[#c9a96e] rounded-full uppercase tracking-wide font-medium">
                        Analysis
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(msg.created_at).toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <div className="prose prose-invert prose-sm max-w-none text-muted-foreground leading-relaxed whitespace-pre-wrap line-clamp-6">
                      {msg.content}
                    </div>
                    <Link
                      href={`/discuss/${msg.session_id}`}
                      className="inline-block mt-4 text-sm text-[#c9a96e] hover:underline"
                    >
                      Read full report →
                    </Link>
                  </article>
                ))}
              </div>
            );
          })()}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          FILM LIBRARY TEASER
          ═══════════════════════════════════════════════════════ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <div className="flex items-center justify-between mb-10">
          <div>
            <p className="text-xs tracking-[0.2em] text-[#c9a96e] uppercase mb-2 font-medium">
              The Canon
            </p>
            <h2 className="font-heading text-3xl text-foreground">
              Films Under Review
            </h2>
          </div>
          <Link
            href="/movies"
            className="text-sm text-[#c9a96e] hover:underline hidden sm:block"
          >
            View all {movieCount || 0} films →
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {/* Fetch a few random movies for the teaser */}
          <MovieTeaser />
        </div>
      </section>
    </div>
  );
}

// ── Helper: movie teaser grid ──────────────────────────────────
async function MovieTeaser() {
  const supabase = await createClient();
  const { data: movies } = await supabase
    .from("movies")
    .select("title,director,year,poster_url,slug")
    .order("created_at", { ascending: false })
    .limit(6);

  return (
    <>
      {(movies || []).map((movie: any) => (
        <Link
          key={movie.title}
          href={`/movie/${movie.slug || movie.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
          className="group block"
        >
          <div className="aspect-[2/3] rounded-lg overflow-hidden bg-card border border-border mb-2 group-hover:border-[#c9a96e]/40 transition-colors">
            {movie.poster_url ? (
              <img
                src={movie.poster_url}
                alt={movie.title}
                className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
                <span className="text-2xl opacity-30">🎬</span>
              </div>
            )}
          </div>
          <h4 className="text-xs font-medium text-foreground line-clamp-1 group-hover:text-[#c9a96e] transition-colors">
            {movie.title}
          </h4>
          {movie.director && (
            <p className="text-[10px] text-muted-foreground">{movie.director}</p>
          )}
        </Link>
      ))}
    </>
  );
}
