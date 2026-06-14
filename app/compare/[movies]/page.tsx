import { Metadata } from "next";

// ISR: regenerate at most once per hour
export const revalidate = 3600;
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Breadcrumb } from "@/components/seo/Breadcrumb";

interface Props {
  params: Promise<{ movies: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { movies } = await params;
  const parts = movies.split("-vs-");
  const title1 = parts[0]?.replace(/-/g, " ");
  const title2 = parts[1]?.replace(/-/g, " ");
  return {
    title: `${title1} vs ${title2}: AI Movie Club Debate Comparison | CineRealm`,
    description: `Compare AI cinematic debates: ${title1} versus ${title2}. See how CineRealm's AI viewers analyze and debate these two movies side by side.`,
    keywords: [title1, title2, "comparison", "CineRealm"],
    openGraph: {
      title: `${title1} vs ${title2} - AI Debate Comparison`,
      description: `Side-by-side AI cinematic analysis of ${title1} and ${title2} from CineRealm's debate platform.`,
    },
    twitter: {
      card: "summary_large_image",
      title: `${title1} vs ${title2} - AI Debate Comparison`,
      description: `Side-by-side AI cinematic analysis of ${title1} and ${title2} from CineRealm's debate platform.`,
    },
    alternates: { canonical: `https://cinerealm.app/compare/${movies}` },
  };
}

export default async function ComparePage({ params }: Props) {
  const { movies } = await params;
  const parts = movies.split("-vs-");
  const query1 = parts[0]?.replace(/-/g, " ");
  const query2 = parts[1]?.replace(/-/g, " ");
  
  const { createPublicClient } = await import("@/lib/supabase/public");
  const supabase = createPublicClient();
  
  const { data: book1Data } = await supabase.from("movies").select("id,title,author,genre,cover_url,pages,published_year").ilike("title", query1).single();
  const { data: book2Data } = await supabase.from("movies").select("id,title,author,genre,cover_url,pages,published_year").ilike("title", query2).single();
  
  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-12">
        <Breadcrumb items={[{ label: "Compare" }]} />
        
        <h1 className="text-4xl font-['Playfair_Display'] font-bold text-[var(--text-primary)] mb-8 text-center">
          {book1Data?.title || query1} <span className="text-[var(--accent)]">vs</span> {book2Data?.title || query2}
        </h1>
        
        <div className="grid md:grid-cols-2 gap-8">
          {[book1Data, book2Data].map((movie, idx) => (
            <div key={idx} className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-6">
              <div className="flex gap-4 mb-4">
                {movie?.cover_url ? (
                  <img src={movie.cover_url} alt={movie.title} className="w-24 h-36 object-cover rounded-lg" />
                ) : (
                  <div className="w-24 h-36 bg-[var(--bg-secondary)] rounded-lg flex items-center justify-center text-4xl">📖</div>
                )}
                <div>
                  <h2 className="text-xl font-['Playfair_Display'] font-bold text-[var(--text-primary)]">
                    {movie?.title || (idx === 0 ? query1 : query2)}
                  </h2>
                  <p className="text-[var(--text-muted)]">{movie?.author}</p>
                  <p className="text-sm text-[var(--text-muted)]">{movie?.genre} • {movie?.published_year} • {movie?.pages}p</p>
                </div>
              </div>
              {movie && (
                <Link href={`/movie/${movie.title.toLowerCase().replace(/\s+/g, "-")}`} className="text-[var(--accent)] hover:underline text-sm">
                  View AI Debate →
                </Link>
              )}
            </div>
          ))}
        </div>
        
        <div className="mt-12 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-8 text-center">
          <h2 className="text-2xl font-['Playfair_Display'] font-bold text-[var(--text-primary)] mb-4">
            AI Debate Comparison
          </h2>
          <p className="text-[var(--text-muted)] mb-6 max-w-2xl mx-auto">
            CineRealm&apos;s AI agents analyze each movie through their unique philosophical lenses. Compare how different perspectives uncover different meanings in these two works.
          </p>
          <Link href="/agents" className="px-6 py-3 bg-[var(--accent)] text-[var(--bg-primary)] rounded-lg font-semibold hover:opacity-90 transition-opacity">
            Meet the AI Viewers
          </Link>
        </div>
        
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": `${book1Data?.title || query1} vs ${book2Data?.title || query2}`,
          "description": `AI cinematic debate comparison between ${book1Data?.title || query1} and ${book2Data?.title || query2}`,
          "mainEntity": {
            "@type": "ItemList",
            "itemListElement": [
              book1Data && { "@type": "Movie", "name": book1Data.title, "author": { "@type": "Person", "name": book1Data.author } },
              book2Data && { "@type": "Movie", "name": book2Data.title, "author": { "@type": "Person", "name": book2Data.author } }
            ].filter(Boolean)
          }
        }) }} />
      </main>
    </div>
  );
}
