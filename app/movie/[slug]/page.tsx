// CineRealm: Stacked Movie Detail Page
// Top: Leo's Film Analysis Report (primary SEO content)
// Bottom: Behind the Scenes — the critics' debate
// ISR: regenerates hourly

import type { Metadata } from "next";
import Link from "next/link";
import { createPublicClient } from "@/lib/supabase/public";
import { JsonLd } from "@/components/seo/JsonLd";

export const revalidate = 3600;

// ── generateStaticParams ─────────────────────────────────────
export async function generateStaticParams() {
  const supabase = createPublicClient();
  const { data: movies } = await supabase
    .from("movies")
    .select("title, slug")
    .eq("is_published", true)
    .limit(50);
  return (movies || []).map((b: any) => ({
    slug: b.slug || b.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
  }));
}

// ── generateMetadata (dynamic from Supabase) ──────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createPublicClient();

  const { data: movie } = await supabase
    .from("movies")
    .select("title, director, year, genre, description, rating, poster_url")
    .or(`slug.eq.${slug},title.ilike.${slug.replace(/-/g, " ")}`)
    .limit(1)
    .single();

  const movieTitle = movie?.title || slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  // Try to get Leo's excerpt for description
  let description = movie?.description?.slice(0, 160) || "";
  try {
    const { data: leoAgent } = await supabase
      .from("agents").select("id").eq("category", "journalist").limit(1).single();
    if (leoAgent) {
      const { data: sessions } = await supabase
        .from("sessions").select("id").eq("status", "completed").limit(1);
      if (sessions?.length) {
        const { data: leoMsg } = await supabase
          .from("messages")
          .select("content")
          .eq("session_id", sessions[0].id)
          .eq("agent_id", (leoAgent as any).id)
          .limit(1).single();
        if (leoMsg?.content) {
          description = (leoMsg as any).content.replace(/[*_#\n]/g, " ").replace(/\s+/g, " ").trim().slice(0, 160);
        }
      }
    }
  } catch (_) {}

  const ogImage = movie?.poster_url || `/api/og?title=${encodeURIComponent(movieTitle)}`;

  return {
    title: `${movieTitle} — Film Analysis & Critique | CineRealm`,
    description: description || `Read the AI critics' debate on ${movieTitle}.`,
    keywords: [movieTitle, movie?.director || "", movie?.genre || "", "film analysis", "CineRealm"].filter(Boolean),
    openGraph: {
      title: `${movieTitle} — AI Critics Debate | CineRealm`,
      description,
      type: "article",
      siteName: "CineRealm",
      images: ogImage ? [{ url: ogImage, width: 500, height: 750 }] : [],
    },
    twitter: { card: "summary_large_image", title: `${movieTitle} — AI Critics Debate`, description, images: ogImage ? [ogImage] : [] },
    alternates: { canonical: `https://cinerealm.app/movie/${slug}` },
  };
}

// ── Types ────────────────────────────────────────────────────
interface DebateMessage {
  id: string;
  agentName: string;
  agentCategory: string;
  content: string;
  turnNumber: number;
  timestamp: string;
}

// ═══════════════════════════════════════════════════════════════
export default async function MoviePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = createPublicClient();

  // ── Fetch movie ──────────────────────────────────────────
  const title = slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  const { data: movies } = await supabase
    .from("movies")
    .select("*")
    .or(`slug.eq.${slug},title.ilike.${title}`)
    .limit(1);

  const movie = movies?.[0] as any;

  if (!movie) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-heading mb-2">Movie not found</h1>
        <p className="text-muted-foreground mb-6">We couldn't find a film matching this URL.</p>
        <Link href="/movies" className="text-[#c9a96e] hover:underline">← Browse all films</Link>
      </main>
    );
  }

  // ── Fetch session + messages ─────────────────────────────
  let leoReport: string | null = null;
  let debateMessages: DebateMessage[] = [];

  try {
    const { data: sessions } = await supabase
      .from("sessions")
      .select("id")
      .eq("movie_id", movie.id)
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(1);

    if (sessions?.length) {
      const { data: msgs } = await supabase
        .from("messages")
        .select("id, agent_id, content, turn_number, created_at, agents!messages_agent_id_fkey(display_name, category)")
        .eq("session_id", sessions[0].id)
        .order("turn_number", { ascending: true });

      if (msgs) {
        for (const msg of msgs as any[]) {
          const agent = msg.agents;
          const category = agent?.category || "";
          const name = agent?.display_name || "Unknown";

          if (category === "journalist") {
            leoReport = msg.content;
          } else {
            debateMessages.push({
              id: msg.id,
              agentName: name,
              agentCategory: category,
              content: msg.content,
              turnNumber: msg.turn_number || 0,
              timestamp: msg.created_at,
            });
          }
        }
      }
    }
  } catch (_) {}

  // ── Agent accent colors ──────────────────────────────────
  const agentColor: Record<string, string> = {
    auteur: "#d4a574",
    commercial: "#6ba3b8",
    performance: "#b87c9e",
  };

  return (
    <div className="min-h-screen bg-background">
      <JsonLd
        data={{
          "@type": "Article",
          headline: `${movie.title} — Film Analysis Report`,
          author: { "@type": "Person", name: "Leo" },
          datePublished: movie.created_at,
          description: movie.description?.slice(0, 200),
          image: movie.poster_url,
          publisher: { "@type": "Organization", name: "CineRealm" },
        }}
      />

      {/* ═══════════════════════════════════════════════════════
          HERO — Movie masthead
          ═══════════════════════════════════════════════════════ */}
      <header className="border-b border-border bg-card/30">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 md:py-16">
          <Link
            href="/reviews"
            className="text-xs text-[#c9a96e] hover:underline mb-4 inline-block"
          >
            ← Back to Reviews
          </Link>
          <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl text-foreground mb-3 leading-tight">
            {movie.title}
          </h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {movie.director && <span>Directed by <strong className="text-foreground">{movie.director}</strong></span>}
            {movie.year && <span>{movie.year}</span>}
            {movie.runtime && <span>{movie.runtime} min</span>}
            {movie.rating && (
              <span className="text-[#c9a96e] font-medium">★ {movie.rating}/10</span>
            )}
          </div>
          {movie.genre && (
            <div className="flex flex-wrap gap-2 mt-3">
              {movie.genre.split(",").map((g: string) => (
                <span key={g.trim()} className="text-[10px] px-2 py-0.5 rounded-full bg-[#c9a96e]/10 text-[#c9a96e] uppercase tracking-wide">
                  {g.trim()}
                </span>
              ))}
            </div>
          )}
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        {/* ═══════════════════════════════════════════════════════
            PRIMARY: Leo's Film Analysis Report
            ═══════════════════════════════════════════════════════ */}
        {leoReport ? (
          <section className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-full bg-[#c9a96e]/10 border border-[#c9a96e]/20 flex items-center justify-center text-[#c9a96e] font-heading text-lg">
                L
              </div>
              <div>
                <h2 className="font-heading text-xl text-foreground">
                  Leo's Film Analysis Report
                </h2>
                <p className="text-xs text-muted-foreground">
                  Editor-in-Chief, CineRealm
                </p>
              </div>
            </div>

            <article className="prose prose-invert prose-lg max-w-none
              prose-headings:font-heading prose-headings:text-foreground
              prose-p:text-muted-foreground prose-p:leading-relaxed
              prose-strong:text-foreground prose-strong:font-semibold
              prose-em:text-[#c9a96e]
              prose-a:text-[#c9a96e] prose-a:no-underline hover:prose-a:underline
              [&_p]:mb-5 [&_p]:text-[15px] sm:[&_p]:text-base
            ">
              {leoReport.split("\n").filter(Boolean).map((paragraph, i) => {
                // Bold headers
                if (/^\d+\.\s/.test(paragraph) || /^[A-Z][A-Z\s]+:/.test(paragraph)) {
                  return (
                    <p key={i} className="font-heading text-foreground text-lg mt-8 mb-3">
                      {paragraph}
                    </p>
                  );
                }
                return <p key={i}>{paragraph}</p>;
              })}
            </article>
          </section>
        ) : (
          <section className="mb-16 text-center py-12 border border-dashed border-border rounded-lg">
            <p className="text-muted-foreground">
              No analysis report has been published yet for this film.
            </p>
          </section>
        )}

        {/* ═══════════════════════════════════════════════════════
            SECONDARY: Behind the Scenes — The Critics' Debate
            ═══════════════════════════════════════════════════════ */}
        {debateMessages.length > 0 && (
          <section>
            <div className="border-t border-border pt-10 mb-8">
              <h2 className="font-heading text-2xl text-foreground mb-2">
                Behind the Scenes: The Critics' Debate
              </h2>
              <p className="text-sm text-muted-foreground">
                The raw, unfiltered exchange between Elias, Victor, and Clara
                that led to Leo's final report. Read the internal fight.
              </p>
            </div>

            <div className="space-y-6">
              {debateMessages.map((msg) => {
                const color = agentColor[msg.agentCategory] || "#c9a96e";
                const label =
                  msg.agentCategory === "auteur" ? "The Auteur" :
                  msg.agentCategory === "commercial" ? "Box Office" :
                  msg.agentCategory === "performance" ? "Performance" :
                  msg.agentCategory;

                return (
                  <div key={msg.id} className="group">
                    {/* Agent header */}
                    <div className="flex items-center gap-3 mb-2">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-heading text-white"
                        style={{ backgroundColor: color }}
                      >
                        {msg.agentName.charAt(0)}
                      </div>
                      <span className="text-sm font-medium text-foreground">
                        {msg.agentName}
                      </span>
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded-full uppercase tracking-wide font-medium"
                        style={{
                          backgroundColor: `${color}15`,
                          color,
                        }}
                      >
                        {label}
                      </span>
                      <span className="text-[10px] text-muted-foreground ml-auto">
                        Turn {msg.turnNumber}
                      </span>
                    </div>

                    {/* Message bubble */}
                    <div
                      className="ml-9 pl-4 border-l-2 text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap"
                      style={{ borderColor: `${color}30` }}
                    >
                      {msg.content}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Empty state — no debate yet */}
        {!leoReport && debateMessages.length === 0 && (
          <section className="text-center py-12 border border-dashed border-border rounded-lg">
            <p className="text-5xl mb-4 opacity-30">🎬</p>
            <h3 className="font-heading text-lg text-foreground mb-2">
              No debate yet for this film
            </h3>
            <p className="text-sm text-muted-foreground">
              The critics have not yet discussed {movie.title}.
              Check back after the next symposium run.
            </p>
          </section>
        )}

        {/* Film metadata footer */}
        {movie.description && (
          <section className="mt-16 pt-10 border-t border-border">
            <h3 className="font-heading text-sm text-muted-foreground uppercase tracking-wider mb-3">
              Synopsis
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {movie.description}
            </p>
          </section>
        )}
      </div>
    </div>
  );
}
