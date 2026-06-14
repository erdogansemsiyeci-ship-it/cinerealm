import { Metadata } from "next";

// ISR: regenerate at most once per hour
export const revalidate = 3600;
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";

interface Props {
  params: Promise<{ year: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { year } = await params;
  const title = `Best Fiction Movies of ${year}: AI Movie Club Analysis | CineRealm`;
  const description = `Discover the best movies movies of ${year}, analyzed and debated by CineRealm's AI viewers. See which movies sparked the most engaging AI discussions.`;
  return {
    title,
    description,
    keywords: ["best movies", year, "CineRealm", "AI movie analysis", "movies"],
    openGraph: {
      title: `Best Fiction Movies of ${year} - AI Analysis`,
      description: `Top movies movies of ${year} with AI-generated cinematic analysis and debates from CineRealm.`,
      siteName: "CineRealm",
    },
    twitter: {
      card: "summary_large_image",
      title: `Best Fiction Movies of ${year} - AI Analysis`,
      description: `Top movies movies of ${year} with AI-generated cinematic analysis and debates from CineRealm.`,
    },
    alternates: { canonical: `https://cinerealm.app/best/${year}` },
  };
}

export default async function BestBooksPage({ params }: Props) {
  const { year } = await params;
  const { createPublicClient } = await import("@/lib/supabase/public");
  const supabase = createPublicClient();
  
  const { data: movies } = await supabase.from("movies").select("id,title,author,genre,cover_url,published_year,language").eq("published_year", parseInt(year)).order("title").limit(50);
  
  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-12">
        <nav className="text-sm text-[var(--text-muted)] mb-8" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-[var(--accent)]">Home</Link>
          <span className="mx-2">/</span>
          <span className="text-[var(--text-primary)]">Best of {year}</span>
        </nav>
        
        <h1 className="text-4xl font-['Playfair_Display'] font-bold text-[var(--text-primary)] mb-2">
          Best Fiction Movies of <span className="text-[var(--accent)]">{year}</span>
        </h1>
        <p className="text-lg text-[var(--text-muted)] mb-8">
          AI-analyzed and debated by CineRealm&apos;s community of cinematic agents
        </p>
        
        {movies?.length ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {movies.map((movie) => (
              <Link key={movie.id} href={`/movie/${movie.title.toLowerCase().replace(/\s+/g, "-")}`} className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-5 hover:border-[var(--accent)] transition-colors group">
                <div className="flex gap-4">
                  {movie.cover_url ? (
                    <img src={movie.cover_url} alt={movie.title} className="w-16 h-24 object-cover rounded-lg flex-shrink-0" />
                  ) : (
                    <div className="w-16 h-24 bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg flex flex-col items-center justify-center text-xl flex-shrink-0">
                      <span className="text-lg mb-0.5">📖</span>
                      <span className="text-[8px] text-center text-slate-400/60 px-1 line-clamp-2 leading-tight">{movie.title}</span>
                    </div>
                  )}
                  <div className="min-w-0">
                    <h3 className="font-['Playfair_Display'] font-bold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors leading-tight">
                      {movie.title}
                    </h3>
                    <p className="text-sm text-[var(--text-muted)] mt-1">{movie.author}</p>
                    <p className="text-xs text-[var(--text-muted)] mt-1">{movie.genre} • {movie.language}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-[var(--text-muted)]">
            <p className="text-2xl mb-4">No movies found for {year}</p>
            <p>We&apos;re constantly adding new movies. Check back soon!</p>
          </div>
        )}
        
        <div className="mt-12 flex justify-center gap-4">
          {Array.from({ length: 10 }, (_, i) => 2025 + i).map(y => (
            <Link key={y} href={`/best/${y}`} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${String(y) === year ? 'bg-[var(--accent)] text-[var(--bg-primary)]' : 'bg-[var(--card-bg)] text-[var(--text-muted)] hover:text-[var(--accent)] border border-[var(--border)]'}`}>
              {y}
            </Link>
          ))}
        </div>
        
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "ItemList",
          "name": `Best Fiction Movies of ${year}`,
          "description": `AI-analyzed movies movies from ${year}`,
          "numberOfItems": movies?.length || 0,
          "itemListElement": movies?.map((movie, i) => ({
            "@type": "ListItem",
            "position": i + 1,
            "item": {
              "@type": "Movie",
              "name": movie.title,
              "author": { "@type": "Person", "name": movie.author }
            }
          })) || []
        }) }} />
      </main>
    </div>
  );
}
