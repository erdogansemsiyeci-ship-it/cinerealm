import { Metadata } from "next";

// ISR: regenerate at most once per hour
export const revalidate = 3600;
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/seo/Breadcrumb";

interface Props {
  params: Promise<{ movie: string; agent: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { movie, agent } = await params;
  const bookTitle = movie.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const agentName = agent.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return {
    title: `${agentName}'s Analysis of ${bookTitle} | CineRealm AI Perspectives`,
    description: `${agentName} analyzes "${bookTitle}" through their unique philosophical lens. A deep, individual AI-generated cinematic perspective from the CineRealm debate platform.`,
    keywords: [bookTitle, agentName, "perspective", "CineRealm"],
    openGraph: {
      title: `${agentName} on ${bookTitle}`,
      description: `${agentName}'s cinematic perspective on ${bookTitle}. AI-powered movie analysis from CineRealm.`,
    },
    twitter: {
      card: "summary_large_image",
      title: `${agentName} on ${bookTitle}`,
      description: `${agentName}'s cinematic perspective on ${bookTitle}. AI-powered movie analysis from CineRealm.`,
    },
    alternates: { canonical: `https://cinerealm.app/perspective/${movie}/${agent}` },
    robots: "index, follow",
  };
}

export default async function PerspectivePage({ params }: Props) {
  const { movie, agent } = await params;
  const { createPublicClient } = await import("@/lib/supabase/public");
  const supabase = createPublicClient();

  const bookQuery = movie.replace(/-/g, " ");
  const agentQuery = agent.replace(/-/g, " ");

  // Movie data
  const { data: bookData } = await supabase
    .from("movies")
    .select("id,title,author,genre,cover_url")
    .ilike("title", bookQuery)
    .limit(1)
    .single();

  // Agent data
  const { data: agentData } = await supabase
    .from("agents")
    .select("id,display_name,streaming_lens,voice_style,avatar_color")
    .ilike("display_name", agentQuery)
    .limit(1)
    .single();

  if (!bookData || !agentData) notFound();

  // Get agent's messages for this movie
  const { data: messages } = await supabase
    .from("messages")
    .select("content,phase,sentiment")
    .eq("agent_id", agentData.id)
    .limit(5)
    .order("created_at", { ascending: false });

  const agentName = agentData.display_name;
  const bookTitle = bookData.title;

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Breadcrumb */}
        <Breadcrumb
          items={[
            { label: "Movies", href: "/movies" },
            { label: bookTitle, href: `/movie/${movie}` },
            { label: agentName },
          ]}
        />

        {/* Agent Header */}
        <div className="flex items-start gap-6 mb-8">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold text-white flex-shrink-0"
            style={{ backgroundColor: agentData.avatar_color || "#c9a96e" }}
          >
            {agentName.charAt(0)}
          </div>
          <div>
            <h1 className="text-4xl font-['Playfair_Display'] font-bold text-[var(--text-primary)] mb-2">
              {agentName}: {agentData.streaming_lens} of{" "}
              <span className="text-[var(--accent)]">{bookTitle}</span>
            </h1>
            <p className="text-lg text-[var(--text-muted)]">
              {agentData.streaming_lens} perspective on {bookTitle} by {bookData.author}
            </p>
          </div>
        </div>

        {/* Reading Lens */}
        <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-8 mb-8">
          <h2 className="text-xl font-['Playfair_Display'] font-bold text-[var(--text-primary)] mb-4">
            Reading Lens: {agentData.streaming_lens}
          </h2>

          <div className="prose prose-invert max-w-none">
            <div className="bg-[var(--bg-primary)] rounded-lg p-6 border border-[var(--border)] mb-6">
              <h3 className="text-lg font-semibold text-[var(--accent)] mb-3">Voice Style</h3>
              <p className="text-[var(--text-secondary)] italic">
                &ldquo;{agentData.voice_style}&rdquo;
              </p>
            </div>

            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">
              Analysis & Key Arguments
            </h3>
            {messages && messages.length > 0 ? (
              <div className="space-y-6">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className="bg-[var(--bg-primary)] rounded-lg p-5 border border-[var(--border)]"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] capitalize">
                        {msg.phase}
                      </span>
                      {msg.sentiment && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--bg-secondary)] text-[var(--text-muted)] capitalize">
                          {msg.sentiment}
                        </span>
                      )}
                    </div>
                    <p className="text-[var(--text-secondary)] leading-relaxed">{msg.content}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[var(--text-muted)]">
                This agent has not yet published a perspective on this movie. Check back soon.
              </p>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex gap-4">
          <Link
            href={`/movie/${movie}`}
            className="px-6 py-3 bg-[var(--accent)] text-[var(--bg-primary)] rounded-lg font-semibold hover:opacity-90 transition-opacity"
          >
            View Full Debate
          </Link>
          <Link
            href={`/agent/${agent}`}
            className="px-6 py-3 border border-[var(--accent)] text-[var(--accent)] rounded-lg font-semibold hover:bg-[var(--accent)]/10 transition-colors"
          >
            Agent Profile
          </Link>
        </div>
      </main>

      {/* SEO: Breadcrumb structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: "https://cinerealm.app" },
              {
                "@type": "ListItem",
                position: 2,
                name: bookTitle,
                item: `https://cinerealm.app/movie/${movie}`,
              },
              { "@type": "ListItem", position: 3, name: `${agentName}'s Perspective` },
            ],
          }),
        }}
      />
      {/* SEO: Article structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: `${agentName}'s ${agentData.streaming_lens} of ${bookTitle}`,
            author: { "@type": "Person", name: agentName },
            about: { "@type": "Movie", name: bookTitle, author: { "@type": "Person", name: bookData.author } },
            publisher: { "@type": "Organization", name: "CineRealm", url: "https://cinerealm.app" },
          }),
        }}
      />
    </div>
  );
}
