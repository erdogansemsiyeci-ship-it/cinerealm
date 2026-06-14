// CineRealm: Global Search Page
// Searches movies (title + author) with published sessions, using Supabase ilike
import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/seo/Breadcrumb";

export const dynamic = "force-dynamic";

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

export async function generateMetadata({
  searchParams,
}: SearchPageProps): Promise<Metadata> {
  const { q } = await searchParams;
  const query = q?.trim() || "";
  const title = query
    ? `Search: ${query} | CineRealm`
    : "Search Movies & Authors | CineRealm";
  const desc = query
    ? `Search results for "${query}" — movies debated by CineRealm's AI cinematic critics.`
    : "Search CineRealm's library. Find movies and authors debated by our AI cinematic critics.";
  return {
    title,
    description: desc.slice(0, 160),
    keywords: query ? [query, "movie search", "CineRealm"] : ["movie search", "cinematic search", "CineRealm"],
    openGraph: { title, description: desc.slice(0, 160), type: "website" },
    twitter: { card: "summary_large_image", title, description: desc.slice(0, 160) },
    alternates: { canonical: `https://cinerealm.app/search${query ? `?q=${encodeURIComponent(query)}` : ""}` },
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams;
  const query = q?.trim() || "";

  let movies: any[] = [];
  let error: string | null = null;

  if (query.length > 0) {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

      // Find movies matching title or author (case-insensitive), then check they have a published session
      const url = `${supabaseUrl}/rest/v1/movies?select=id,title,author,genre,cover_url,description,pages,sessions!inner(status)&or=(title.ilike.*${encodeURIComponent(query)}*,author.ilike.*${encodeURIComponent(query)}*)&sessions.status=eq.published&limit=50&order=title`;

      const res = await fetch(url, {
        headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
        next: { revalidate: 300 },
      });

      if (res.ok) {
        const raw = await res.json();
        // Deduplicate by movie id (inner join may return dupes per session)
        const seen = new Set<string>();
        movies = raw.filter((b: any) => {
          if (seen.has(b.id)) return false;
          seen.add(b.id);
          return true;
        });
      } else {
        error = `Search service unavailable (${res.status})`;
      }
    } catch (e: any) {
      error = e.message || "Search failed";
    }
  }

  const isEmpty = query.length > 0 && movies.length === 0 && !error;

  // JSON-LD search action
  const searchSchema = {
    "@context": "https://schema.org",
    "@type": "SearchResultsPage",
    name: query ? `Search: ${query}` : "Search",
    url: `https://cinerealm.app/search?q=${encodeURIComponent(query)}`,
    ...(movies.length > 0 && {
      mainEntity: movies.map((b: any) => ({
        "@type": "Movie",
        name: b.title,
        author: { "@type": "Person", name: b.author },
      })),
    }),
  };

  return (
    <div className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(searchSchema) }}
      /> {/* JSON-LD search action */}
      <Breadcrumb items={[{ label: "Search" }]} />

      {/* Header */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8">
        <h1 className="text-4xl md:text-5xl font-heading text-heading mb-4">
          {query ? (
            <>
              Search:{" "}
              <span className="text-[#c9a96e]">&ldquo;{query}&rdquo;</span>
            </>
          ) : (
            "Search the Library"
          )}
        </h1>
        {query ? (
          <p className="text-lg text-muted-foreground">
            {movies.length > 0
              ? `Found ${movies.length} movie${movies.length === 1 ? "" : "s"} matching your search.`
              : "Searching movies and authors debated by our AI cinematic critics."}
          </p>
        ) : (
          <p className="text-lg text-muted-foreground max-w-xl">
            Search by movie title or author name to find AI cinematic debates,
            perspectives, and discussions.
          </p>
        )}

        {/* Search bar for no-query / refine */}
        <form action="/search" method="GET" className="mt-6 max-w-lg">
          <div className="relative">
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder="Search movies, authors..."
              autoFocus={!query}
              className="w-full pl-12 pr-4 py-3 text-base bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all"
            />
          </div>
        </form>
      </section>

      {/* Error state */}
      {error && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-6 text-center">
            <p className="text-destructive font-medium mb-1">
              Something went wrong
            </p>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        </section>
      )}

      {/* Empty state */}
      {isEmpty && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
          <div className="text-center py-16">
            <span className="text-6xl mb-6 block">📭</span>
            <h2 className="text-2xl font-heading text-heading mb-3">
              No results found
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
              Unfortunately, a symposium hasn&apos;t been organized yet for this
              author or movie. Our library is growing daily — check back soon or
              try a different search.
            </p>
            <Link
              href="/movies"
              className="inline-block mt-6 text-[#c9a96e] hover:underline"
            >
              Browse all movies →
            </Link>
          </div>
        </section>
      )}

      {/* Results grid */}
      {movies.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {movies.map((movie: any) => (
              <Link
                key={movie.id}
                href={`/movie/${movie.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`}
                className="group bg-card rounded-xl overflow-hidden border border-white/5 hover:border-primary/30 transition-colors"
              >
                {/* Movie cover */}
                <div className="relative aspect-[2/3] bg-gradient-to-br from-slate-800 to-slate-900">
                  {movie.cover_url ? (
                    <img
                      src={movie.cover_url}
                      alt={movie.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-4">
                      <span className="text-4xl mb-2">📖</span>
                      <span className="text-xs text-center text-foreground/40 line-clamp-3 font-heading">
                        {movie.title}
                      </span>
                    </div>
                  )}
                </div>
                {/* Movie info */}
                <div className="p-5">
                  <h3 className="text-foreground font-medium group-hover:text-primary transition-colors mb-1 line-clamp-2">
                    {movie.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {movie.author}
                  </p>
                  {movie.genre && (
                    <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded bg-[#c9a96e]/10 text-[#c9a96e]">
                      {movie.genre}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Static no-query prompt */}
      {!query && !error && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              "George Orwell",
              "Toni Morrison",
              "Haruki Murakami",
              "Margaret Atwood",
              "Kazuo Ishiguro",
              "Ursula K. Le Guin",
              "James Baldwin",
              "Chimamanda Adichie",
            ].map((author) => (
              <Link
                key={author}
                href={`/search?q=${encodeURIComponent(author)}`}
                className="bg-card border border-border rounded-lg px-4 py-3 text-sm text-muted-foreground hover:text-foreground hover:border-primary/20 transition-all text-center"
              >
                {author}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
