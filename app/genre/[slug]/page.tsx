// CineRealm P-SEO: Genre Pages
// Long-tail keyword: "[genre] movies with AI cinematic debates"
import type { Metadata } from "next";

// ISR: regenerate at most once per hour
export const revalidate = 3600;
import Link from "next/link";

// ============================================================================
// GENRE DEFINITIONS
// ============================================================================
const GENRES = [
  { slug: "movies", name: "Fiction", description: "The best movies movies debated by our AI cinematic critics", key: "movies" },
  { slug: "cinematic-movies", name: "Cinematic Fiction", description: "Cinematic movies analyzed through multiple philosophical lenses", key: "cinematic_movies" },
  { slug: "science-movies", name: "Science Fiction", description: "Science movies novels dissected by structuralists, existentialists, and more", key: "science_movies" },
  { slug: "fantasy", name: "Fantasy", description: "Fantasy movies examined through mythological and archetypal analysis", key: "fantasy" },
  { slug: "historical-movies", name: "Historical Fiction", description: "Historical movies debated with context from new historicists", key: "historical_movies" },
  { slug: "mystery", name: "Mystery", description: "Mystery novels scrutinized by our most analytical AI agents", key: "mystery" },
  { slug: "dystopian", name: "Dystopian", description: "Dystopian movies examined through class critique and existential lenses", key: "dystopian" },
  { slug: "romance", name: "Romance", description: "Romance novels debated by romantics, feminists, and pragmatists", key: "romance" },
  { slug: "philosophical-movies", name: "Philosophical Fiction", description: "Philosophical movies analyzed by existentialists, stoics, and nihilists", key: "philosophical_movies" },
  { slug: "psychological-thriller", name: "Psychological Thriller", description: "Psychological thrillers dissected by psychoanalysts and phenomenologists", key: "psychological_thriller" },
  { slug: "magical-realism", name: "Magical Realism", description: "Magical realism debated between structuralists and mythologists", key: "magical_realism" },
  { slug: "classics", name: "Classics", description: "Classic cinema analyzed through every critical lens in our arsenal", key: "classics" },
  { slug: "philosophy", name: "Philosophy Movies", description: "Philosophy movies debated by our AI agents trained in specific schools", key: "philosophy" },
  { slug: "history", name: "History Movies", description: "History movies examined through postcolonial, Marxist, and historicist lenses", key: "history" },
  { slug: "science", name: "Science Movies", description: "Science movies debated between pragmatists and systemic thinkers", key: "science" },
  { slug: "biography", name: "Biography", description: "Biographies analyzed through psychoanalytic and archetypal perspectives", key: "biography" },
  { slug: "psychology", name: "Psychology Movies", description: "Psychology movies scrutinized by our AI psychoanalysts and phenomenologists", key: "psychology" },
  { slug: "economics", name: "Economics Movies", description: "Economics movies debated between Marxists, utilitarians, and pragmatists", key: "economics" },
  { slug: "self-help", name: "Self-Help", description: "Self-help movies evaluated by pragmatists and stoic philosophers", key: "self_help" },
  { slug: "poetry", name: "Poetry", description: "Poetry collections analyzed through formalist, romantic, and deconstructionist lenses", key: "poetry" },
];

const GENRE_MAP = Object.fromEntries(GENRES.map((g) => [g.slug, g]));

// ============================================================================
// STATIC PARAMS
// ============================================================================
export function generateStaticParams() {
  return GENRES.map((g) => ({ slug: g.slug }));
}

// ============================================================================
// P-SEO METADATA
// ============================================================================
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const genre = GENRE_MAP[slug];

  if (!genre) return { title: "Genre not found | CineRealm" };

  const title = `${genre.name} Movies with AI Cinematic Debates | CineRealm`;
  const description = `${genre.description}. Read AI-generated cinematic debates on ${genre.name.toLowerCase()} movies from multiple philosophical perspectives.`;

  return {
    title,
    description: description.slice(0, 160),
    keywords: [genre.name.toLowerCase(), genre.name, "movies", "AI cinematic debates", "CineRealm"],
    openGraph: {
      title,
      description: description.slice(0, 160),
      type: "website",
      siteName: "CineRealm",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: description.slice(0, 160),
    },
    alternates: { canonical: `https://cinerealm.app/genre/${slug}` },
  };
}

// ============================================================================
// SERVER COMPONENT
// ============================================================================
export default async function GenrePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const genre = GENRE_MAP[slug];

  if (!genre) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-playfair text-foreground mb-4">
            Genre not found
          </h1>
          <Link href="/" className="text-[#c9a96e] hover:underline">
            Back to CineRealm
          </Link>
        </div>
      </div>
    );
  }

  // Fetch movies by genre from Supabase
  let movies: any[] = [];
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const url = `${supabaseUrl}/rest/v1/movies?select=id,title,author,genre,cover_url,description,pages&limit=50&order=title`;
    const res = await fetch(url, {
      headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const allBooks = await res.json();
      // Filter by genre (case-insensitive partial match)
      const key = genre.key.toLowerCase().replace(/_/g, " ");
      movies = allBooks.filter((b: any) => {
        const g = (b.genre || "").toLowerCase();
        return g.includes(key) || key.includes(g);
      });
    }
  } catch {
    movies = [];
  }

  // JSON-LD
  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${genre.name} Movies | CineRealm`,
    description: genre.description,
    numberOfItems: movies.length,
    itemListElement: movies.map((movie: any, i: number) => ({
      "@type": "Movie",
      position: i + 1,
      name: movie.title,
      author: { "@type": "Person", name: movie.author },
    })),
  };

  return (
    <div className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />

      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-4">
        <nav className="flex text-sm text-foreground/60 space-x-2">
          <Link href="/" className="hover:text-primary">
            CineRealm
          </Link>
          <span>/</span>
          <span className="text-[#c9a96e]">{genre.name}</span>
        </nav>
      </div>

      {/* Header */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <h1 className="text-4xl md:text-5xl font-playfair text-foreground mb-4">
          {genre.name}
        </h1>
        <p className="text-lg text-foreground/70 max-w-2xl">
          {genre.description}. Each movie features an AI-powered debate between
          cinematic critics with distinct philosophical perspectives.
        </p>
        <div className="mt-4 text-sm text-[#c9a96e]">
          {movies.length} movies in this genre
        </div>
      </section>

      {/* Movies Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        {movies.length > 0 ? (
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
                  <h3 className="text-foreground font-medium group-hover:text-primary transition-colors mb-1">
                    {movie.title}
                  </h3>
                  <p className="text-sm text-foreground/50">{movie.author}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-[#c9a96e]/70">
                      {movie.genre || genre.name}
                    </span>
                    {movie.pages && (
                      <span className="text-xs text-foreground/30">
                        {movie.pages} pages
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-24">
            <p className="text-foreground/50">
              No movies found in {genre.name}. Check back soon — our library is
              growing daily.
            </p>
            <Link
              href="/"
              className="inline-block mt-4 text-[#c9a96e] hover:underline"
            >
              Explore all movies
            </Link>
          </div>
        )}
      </section>

      {/* Sub-genres & SEO footer */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <h2 className="text-2xl font-playfair text-foreground mb-6">
          Explore Other Genres
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {GENRES.filter((g) => g.slug !== slug).map((g) => (
            <Link
              key={g.slug}
              href={`/genre/${g.slug}`}
              className="bg-card border border-white/5 rounded-lg px-4 py-3 text-sm text-foreground/60 hover:text-primary hover:border-primary/20 transition-all"
            >
              {g.name}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
