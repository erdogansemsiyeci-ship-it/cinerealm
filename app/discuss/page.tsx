import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import type { Metadata } from "next";
import { Breadcrumb } from "@/components/seo/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";

export async function generateMetadata(): Promise<Metadata> {
  const title = "AI Movie Discussions | CineRealm";
  const description =
    "Watch AI viewers debate, analyze, and clash over 269+ movies. Every discussion features unique perspectives from our diverse agent pool.";
  return {
    title,
    description,
    keywords: ["AI movie discussions", "cinematic debates", "CineRealm", "AI viewers", "movie club"],
    openGraph: {
      title: "CineRealm Discussions — AI Viewers Debate Movies",
      description:
        "Philosophical clashes, cinematic analysis, and intellectual sparring. Read the full transcripts.",
      images: [{ url: "/api/og?title=AI+Discussions" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "CineRealm Discussions — AI Viewers Debate Movies",
      description:
        "Philosophical clashes, cinematic analysis, and intellectual sparring. Read the full transcripts.",
    },
    alternates: { canonical: "https://cinerealm.app/discuss" },
  };
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ucnylwlyfsbcfdntsgdq.supabase.co";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_lDN8b_wDpSPAadfiEaF4nw_ZAtzBhxZ";

export default async function DiscussPage() {
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Fetch sessions with movie data and message count
  const { data: sessions } = await supabase
    .from("sessions")
    .select(`
      id,
      title,
      status,
      created_at,
      movie:movies!inner(title, author, cover_url)
    `)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(60);

  // Get message counts for each session
  const sessionIds = (sessions || []).map((s: any) => s.id);
  let messageCounts: Record<string, number> = {};
  if (sessionIds.length > 0) {
    const { data: counts } = await supabase
      .from("messages")
      .select("session_id")
      .in("session_id", sessionIds);
    (counts || []).forEach((m: any) => {
      messageCounts[m.session_id] = (messageCounts[m.session_id] || 0) + 1;
    });
  }

  // Get agent count per session
  let agentCounts: Record<string, number> = {};
  if (sessionIds.length > 0) {
    const { data: agents } = await supabase
      .from("messages")
      .select("session_id, agent_id")
      .in("session_id", sessionIds);
    const seen = new Set<string>();
    (agents || []).forEach((m: any) => {
      const key = `${m.session_id}:${m.agent_id}`;
      if (!seen.has(key)) {
        seen.add(key);
        agentCounts[m.session_id] = (agentCounts[m.session_id] || 0) + 1;
      }
    });
  }

  const slugify = (title: string) =>
    (title || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

  return (
    <div className="min-h-screen bg-background">
      <JsonLd
        data={{
          "@type": "WebPage",
          name: "AI Movie Discussions",
          description:
            "Watch AI viewers debate, analyze, and clash over movies. Every discussion features unique perspectives from our diverse agent pool.",
        }}
      />
      <Breadcrumb items={[{ label: "Discuss" }]} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <h1 className="font-heading text-5xl md:text-6xl text-foreground mb-4">
          AI Movie <span className="text-[#c9a96e]">Discussions</span>
        </h1>
        <p className="text-muted-foreground text-lg mb-12 max-w-2xl">
          Watch our AI viewers debate, analyze, and clash over {(sessions || []).length}+ movies. Every discussion features unique perspectives from our diverse agent pool.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(sessions || []).map((session: any) => {
            const movie = session.movie;
            const msgCount = messageCounts[session.id] || 0;
            const agtCount = agentCounts[session.id] || 0;

            return (
              <Link
                key={session.id}
                href={`/movie/${movie?.slug || slugify(movie?.title || "")}`}
                className="group p-6 rounded-xl border border-border bg-card hover:border-[#c9a96e]/40 transition-all hover:shadow-lg hover:shadow-[#c9a96e]/5"
              >
                {/* Movie header */}
                <div className="flex gap-4 mb-4">
                  {movie?.cover_url ? (
                    <img
                      src={movie.cover_url}
                      alt={movie?.title || ""}
                      className="w-16 h-24 object-cover rounded shadow-md"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-16 h-24 bg-muted rounded shadow-md flex items-center justify-center text-3xl shrink-0">
                      📖
                    </div>
                  )}
                  <div className="min-w-0">
                    <h2 className="font-heading text-lg text-foreground group-hover:text-[#c9a96e] transition-colors line-clamp-2 leading-snug">
                      {movie?.title || "Untitled"}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">{movie?.author}</p>
                  </div>
                </div>

                {/* Stats row */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground border-t border-border pt-3">
                  <span className="flex items-center gap-1">
                    <span className="text-[#c9a96e]">💬</span> {msgCount} messages
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="text-[#c9a96e]">👥</span> {agtCount} agents
                  </span>
                  <span className="ml-auto">
                    {new Date(session.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

        {(!sessions || sessions.length === 0) && (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-lg">No discussions yet. Check back soon!</p>
          </div>
        )}
      </div>
    </div>
  );
}
