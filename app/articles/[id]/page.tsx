import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Breadcrumb } from "@/components/seo/Breadcrumb";

// ── Types ────────────────────────────────────────────────

interface ArticlePageProps {
  params: Promise<{ id: string }>;
}

interface SessionRow {
  id: string;
  title: string;
  transcript: string | null;
  created_at: string;
  book_id: string;
}

interface BookRow {
  id: string;
  title: string;
  author: string;
  cover_url: string | null;
}

interface ArticleMessage {
  content: string; // Leo's markdown article body
}

// ── Metadata (P-SEO) ────────────────────────────────────

export async function generateMetadata({
  params,
}: ArticlePageProps): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();

  const { data: session } = await supabase
    .from("sessions")
    .select("id, title, book_id")
    .eq("id", id)
    .single();

  if (!session) return { title: "Article — CineRealm" };

  const { data: movie } = await supabase
    .from("movies")
    .select("title, author")
    .eq("id", session.book_id)
    .single();

  // Extract meta description from Leo's article (first 160 chars of
  // meaningful text after the title heading).
  const { data: leoMessage } = await supabase
    .from("messages")
    .select("content")
    .eq("session_id", id)
    .eq("role", "assistant")
    .order("sequence_num", { ascending: false })
    .limit(1)
    .single();

  let description = `A multi-lens cinematic analysis of ${movie?.title ?? "this movie"} by CineRealm's expert viewers.`;
  if (leoMessage?.content) {
    const plain = leoMessage.content
      .replace(/^# .*\n/, "") // remove h1
      .replace(/[#*`>\[\]!\-|]/g, "")
      .replace(/\n+/g, " ")
      .trim();
    description = plain.slice(0, 155).trim() + (plain.length > 155 ? "…" : "");
  }

  const title = movie
    ? `${movie.title}: ${session.title} — CineRealm`
    : `${session.title} — CineRealm`;

  return {
    title,
    description,
    keywords: [movie?.title ?? "", movie?.author ?? "", "cinematic analysis", "movie club", "movie discussion", "CineRealm"],
    openGraph: {
      title,
      description,
      type: "article",
      siteName: "CineRealm",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    alternates: { canonical: `https://cinerealm.app/articles/${id}` },
  };
}

// ── Data Fetching ────────────────────────────────────────

async function getArticleData(id: string) {
  const supabase = await createClient();

  // Session + movie join
  const { data: session } = await supabase
    .from("sessions")
    .select("*, movies(*)")
    .eq("id", id)
    .single<SessionRow & { movies: BookRow }>();

  if (!session) return null;

  // Leo's synthesis article (last assistant message in the session)
  const { data: leoMessages } = await supabase
    .from("messages")
    .select("content")
    .eq("session_id", id)
    .eq("role", "assistant")
    .order("sequence_num", { ascending: false })
    .limit(1);

  const articleContent = leoMessages?.[0]?.content ?? null;

  // SEO keywords from the article's own frontmatter-like structure, or fallback
  const keywords = extractKeywords(articleContent, session.movies);

  // Expert agents participating (distinct agent_id in messages, excluding meta)
  const { data: participantIds } = await supabase
    .from("messages")
    .select("agent_id")
    .eq("session_id", id)
    .neq("agent_id", null);

  const uniqueAgentIds = [
    ...new Set(participantIds?.map((m: { agent_id: string }) => m.agent_id)),
  ];

  const { data: agents } =
    uniqueAgentIds.length > 0
      ? await supabase.from("agents").select("id, display_name, avatar_color").in("id", uniqueAgentIds)
      : { data: [] };

  return {
    session: session as SessionRow & { movies: BookRow },
    articleContent,
    keywords,
    agents: (agents as { id: string; display_name: string; avatar_color: string }[]) ?? [],
    wordCount: articleContent?.split(/\s+/).filter(Boolean).length ?? 0,
  };
}

function extractKeywords(
  article: string | null,
  movie: BookRow,
): string[] {
  const fallback = [movie.title, movie.author, "cinematic analysis", "CineRealm"];
  if (!article) return fallback;

  // Leo's articles include a ## SEO Keywords section
  const kwMatch = article.match(/SEO Keywords[:\s]*\n([\s\S]*?)(\n##|\n---|$)/i);
  if (kwMatch) {
    return kwMatch[1]
      .split(/[,;\n]/)
      .map((k) => k.replace(/^[-*\s]+/, "").trim())
      .filter((k) => k.length > 1);
  }

  return fallback;
}

// ── Page Component ───────────────────────────────────────

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { id } = await params;
  const data = await getArticleData(id);

  if (!data || !data.articleContent) notFound();

  const { session, articleContent, keywords, agents, wordCount } = data;
  const movie = session.movies;

  return (
    <>
      {/* JSON-LD structured data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: session.title,
            description: articleContent.slice(0, 160),
            datePublished: session.created_at,
            author: agents.map((a) => ({
              "@type": "Person",
              name: a.display_name,
            })),
            wordCount,
            keywords: keywords.join(", "),
          }),
        }}
      />

      <Breadcrumb
        items={[{ label: "Articles", href: "/articles" }, { label: session.title }]}
      />

      <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="mb-10 border-b border-border pb-8">
          <p className="mb-2 text-sm font-medium uppercase tracking-wide text-primary">
            Symposium Analysis
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-heading sm:text-4xl">
            {session.title}
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <a
              href={`/movie/${movie.id}`}
              className="font-medium text-primary hover:text-primary/80 transition-colors"
            >
              {movie.title} — {movie.author}
            </a>
            <span aria-hidden="true">·</span>
            <time dateTime={session.created_at}>
              {new Date(session.created_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </time>
            <span aria-hidden="true">·</span>
            <span>{wordCount.toLocaleString()} words</span>
          </div>
        </header>

        {/* Expert panel */}
        {agents.length > 0 && (
          <div className="mb-10 flex flex-wrap gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground self-center mr-1">
              Expert Panel
            </span>
            {agents.map((agent) => (
              <a
                key={agent.id}
                href={`/agent/${agent.id}`}
                className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium text-white hover:opacity-80 transition-opacity"
                style={{ backgroundColor: agent.avatar_color ?? "#6b7280" }}
              >
                {agent.display_name}
              </a>
            ))}
          </div>
        )}

        {/* Article body — Tailwind Typography prose */}
        <div className="prose prose-lg dark:prose-invert max-w-none
          prose-headings:font-bold prose-headings:tracking-tight
          prose-h2:mt-10 prose-h2:border-b prose-h2:border-border prose-h2:pb-2 prose-h2:text-2xl
          prose-h3:text-xl prose-h3:mt-8
          prose-p:leading-relaxed
          prose-blockquote:border-l-primary prose-blockquote:bg-primary/5 prose-blockquote:py-1 prose-blockquote:px-4
          prose-a:text-primary prose-a:no-underline hover:prose-a:underline
          prose-strong:text-foreground
          prose-li:marker:text-primary">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {articleContent}
          </ReactMarkdown>
        </div>

        {/* Footer metadata */}
        <footer className="mt-12 border-t border-border pt-6">
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span className="font-semibold uppercase tracking-wide text-muted-foreground text-xs">
              Keywords
            </span>
            {keywords.map((kw) => (
              <span
                key={kw}
                className="rounded-md bg-muted px-2 py-0.5 text-xs text-foreground/70"
              >
                {kw}
              </span>
            ))}
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Generated by CineRealm&apos;s AI symposium engine. Analysis
            produced by Leo &quot;The Hook&quot; Vance from a multi-expert
            roundtable discussion.
          </p>
        </footer>
      </article>
    </>
  );
}
