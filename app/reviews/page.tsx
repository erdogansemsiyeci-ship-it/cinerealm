// CineRealm — Reviews Index (Magazine Blog Feed)
// Lists all completed film debates with Leo's synthesis excerpts.
// ISR: regenerates every 10 minutes.

import Link from "next/link";
import type { Metadata } from "next";
import { createPublicClient } from "@/lib/supabase/public";
import { JsonLd } from "@/components/seo/JsonLd";

export const revalidate = 600;

export const metadata: Metadata = {
  title: "Film Reviews — CineRealm Critics' Table",
  description:
    "Every film debated by our four critics: Elias (Auteur), Victor (Box Office), Clara (Performance), and Leo (Editor-in-Chief). Read the latest Film Analysis Reports.",
  keywords: ["film reviews", "movie analysis", "AI critics", "CineRealm"],
  openGraph: {
    title: "CineRealm Film Reviews — The Critics' Table",
    description:
      "Elias, Victor, Clara, and Leo debate cinema. Read their verdicts.",
    type: "website",
    siteName: "CineRealm",
  },
  alternates: { canonical: "https://cinerealm.app/reviews" },
};

// ── Types ──────────────────────────────────────────────────────
interface MovieRow {
  id: string;
  title: string;
  director: string | null;
  year: number | null;
  poster_url: string | null;
  slug: string | null;
  genre: string | null;
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
  created_at: string;
  agents?: { display_name: string; category: string } | null;
}

interface ReviewCard {
  session: SessionRow;
  movie: MovieRow | null;
  leoExcerpt: string | null;
  leoDate: string | null;
}

// ═══════════════════════════════════════════════════════════════
export default async function ReviewsPage() {
  const supabase = createPublicClient();

  // Fetch all completed sessions with movie data
  const { data: sessions } = await supabase
    .from("sessions")
    .select("id, movie_id, status, message_count, created_at, movies(id,title,director,year,poster_url,slug,genre)")
    .eq("status", "completed")
    .order("created_at", { ascending: false })
    .limit(100);

  // Get Leo's agent ID
  const { data: leoAgent } = await supabase
    .from("agents")
    .select("id")
    .eq("category", "journalist")
    .limit(1)
    .single();

  const leoId = (leoAgent as any)?.id;

  // For each session, fetch Leo's message
  const reviews: ReviewCard[] = [];
  if (sessions) {
    for (const sess of sessions as any[]) {
      let leoExcerpt: string | null = null;
      let leoDate: string | null = null;

      if (leoId) {
        try {
          const { data: leoMsg } = await supabase
            .from("messages")
            .select("content, created_at")
            .eq("session_id", sess.id)
            .eq("agent_id", leoId)
            .limit(1)
            .single();

          if (leoMsg) {
            leoExcerpt = (leoMsg as any).content
              ?.replace(/[*_#]/g, "")
              .replace(/\n{2,}/g, "¶ ")
              .replace(/\n/g, " ")
              .replace(/\s+/g, " ")
              .trim()
              .slice(0, 250) || null;
            leoDate = (leoMsg as any).created_at || null;
          }
        } catch (_) {}
      }

      reviews.push({
        session: sess,
        movie: sess.movies || null,
        leoExcerpt,
        leoDate,
      });
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <JsonLd
        data={{
          "@type": "CollectionPage",
          name: "CineRealm Film Reviews",
          description: "Film analysis reports by the CineRealm critics.",
          url: "https://cinerealm.app/reviews",
        }}
      />

      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 md:py-20">
          <p className="text-xs tracking-[0.2em] text-[#c9a96e] uppercase mb-4 font-medium">
            The Critics' Table
          </p>
          <h1 className="font-heading text-4xl sm:text-5xl text-foreground mb-4">
            Film Reviews
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Every film debated by Elias, Victor, Clara, and Leo.
            Sorted by most recent verdict.
          </p>
        </div>
      </header>

      {/* Reviews feed */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        {reviews.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-6 opacity-30">🎬</p>
            <h2 className="font-heading text-2xl text-foreground mb-3">
              No Reviews Yet
            </h2>
            <p className="text-muted-foreground">
              The critics have not yet published their first review.
              Check back soon.
            </p>
          </div>
        ) : (
          <div className="space-y-10">
            {reviews.map((review) => {
              const movie = review.movie;
              const slug = movie?.slug
                || movie?.title?.toLowerCase().replace(/[^a-z0-9]+/g, "-");
              const date = review.leoDate
                ? new Date(review.leoDate).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })
                : null;

              return (
                <article
                  key={review.session.id}
                  className="group border-b border-border pb-10 last:border-b-0"
                >
                  <div className="flex gap-5">
                    {/* Poster thumbnail */}
                    {movie?.poster_url && (
                      <Link
                        href={`/movie/${slug}`}
                        className="flex-shrink-0 hidden sm:block"
                      >
                        <div className="w-20 rounded overflow-hidden border border-border group-hover:border-[#c9a96e]/30 transition-colors">
                          <img
                            src={movie.poster_url}
                            alt={movie.title}
                            className="w-full"
                            loading="lazy"
                          />
                        </div>
                      </Link>
                    )}

                    <div className="flex-1 min-w-0">
                      {/* Meta line */}
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-[10px] px-2 py-0.5 bg-[#c9a96e]/10 text-[#c9a96e] rounded-full uppercase tracking-wide font-medium">
                          Verdict
                        </span>
                        {date && (
                          <span className="text-xs text-muted-foreground">
                            {date}
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {review.session.message_count || 0} exchanges
                        </span>
                      </div>

                      {/* Title */}
                      <Link href={`/movie/${slug}`}>
                        <h2 className="font-heading text-xl sm:text-2xl text-foreground group-hover:text-[#c9a96e] transition-colors mb-1">
                          {movie?.title || "Untitled"}
                        </h2>
                      </Link>

                      {/* Director + year */}
                      {(movie?.director || movie?.year) && (
                        <p className="text-sm text-muted-foreground mb-3">
                          {movie.director && `Directed by ${movie.director}`}
                          {movie.director && movie.year && " · "}
                          {movie.year && movie.year}
                        </p>
                      )}

                      {/* Leo's excerpt */}
                      {review.leoExcerpt ? (
                        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4">
                          {review.leoExcerpt}
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">
                          Analysis pending.
                        </p>
                      )}

                      <Link
                        href={`/movie/${slug}`}
                        className="inline-block mt-3 text-sm text-[#c9a96e] hover:underline"
                      >
                        Read full report →
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
