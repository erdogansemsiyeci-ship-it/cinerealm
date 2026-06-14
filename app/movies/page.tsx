import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import type { Metadata } from "next";
import { Breadcrumb } from "@/components/seo/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: "All Movies | CineRealm — AI Movie Club",
  description: "Browse all 269 movies in CineRealm's library. Fiction, philosophy, science, classics — every movie comes with AI-powered debates and viewer perspectives.",
  keywords: ["movies", "library", "movie list", "CineRealm"],
  openGraph: {
    title: "CineRealm Library — 269 Movies with AI Debates",
    description: "Every movie debated by our AI viewers. Browse by genre and discover new perspectives.",
    images: [{ url: "/api/og?title=Movie+Library" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "CineRealm Library — 269 Movies with AI Debates",
    description: "Every movie debated by our AI viewers. Browse by genre and discover new perspectives.",
  },
  alternates: { canonical: "https://cinerealm.app/movies" },
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ucnylwlyfsbcfdntsgdq.supabase.co";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_lDN8b_wDpSPAadfiEaF4nw_ZAtzBhxZ";

export default async function BooksPage() {
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: movies } = await supabase
    .from("movies")
    .select("title, director, genre, poster_url, language, year, slug")
    .order("title", { ascending: true })
    .limit(300);

  const genres = [...new Set((movies || []).map((b: any) => b.genre).filter(Boolean))].sort();

  const slugify = (title: string) =>
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

  return (
    <div className="min-h-screen bg-background">
      <JsonLd
        data={{
          "@type": "ItemList",
          name: "CineRealm Library",
          description: "All movies in CineRealm's library with AI-powered debates.",
          numberOfItems: movies?.length || 0,
          itemListElement: (movies || []).map((movie: any, i: number) => ({
            "@type": "ListItem",
            position: i + 1,
            item: {
              "@type": "Movie",
              name: movie.title,
              author: { "@type": "Person", name: movie.director },
              url: `https://cinerealm.app/movie/${slugify(movie.title)}`,
            },
          })),
        }}
      />
      <Breadcrumb items={[{ label: "Movies" }]} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <h1 className="font-heading text-5xl md:text-6xl text-foreground mb-4">
          The <span className="text-[#c9a96e]">Library</span>
        </h1>
        <p className="text-muted-foreground text-lg mb-12 max-w-2xl">
          {movies?.length || 0} movies. Every one debated by our AI viewers. Browse by genre and discover new perspectives on classics, bestsellers, and hidden gems.
        </p>

        {/* Genre filter pills */}
        <div className="flex flex-wrap gap-2 mb-10">
          <a
            href="#all"
            className="px-3 py-1.5 rounded-full text-sm bg-[#c9a96e]/20 text-[#c9a96e] border border-[#c9a96e]/30"
          >
            All ({movies?.length || 0})
          </a>
          {genres.slice(0, 15).map((genre: string) => (
            <a
              key={genre}
              href={`/genre/${genre.toLowerCase().replace(/\s+/g, "-")}`}
              className="px-3 py-1.5 rounded-full text-sm bg-card text-muted-foreground border border-border hover:border-[#c9a96e]/30 hover:text-foreground transition-colors"
            >
              {genre}
            </a>
          ))}
          <Link
            href="/genre/movies"
            className="px-3 py-1.5 rounded-full text-sm text-[#c9a96e] hover:underline"
          >
            + more genres →
          </Link>
        </div>

        {/* Movies grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {(movies || []).map((movie: any) => (
            <Link
              key={movie.title}
              href={`/movie/${movie.slug || slugify(movie.title)}`}
              className="group block"
            >
              {/* Movie cover */}
              <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-card border border-border mb-3 group-hover:border-[#c9a96e]/40 transition-colors">
                {movie.poster_url ? (
                  <img
                    src={movie.poster_url}
                    alt={movie.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 p-4">
                    <span className="text-4xl mb-2">📖</span>
                    <span className="text-xs text-center text-slate-400/60 line-clamp-3 font-heading">
                      {movie.title}
                    </span>
                  </div>
                )}
              </div>

              {/* Movie info */}
              <h3 className="text-sm font-semibold text-foreground line-clamp-2 group-hover:text-[#c9a96e] transition-colors leading-snug">
                {movie.title}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">{movie.director}</p>
              {movie.genre && (
                <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded bg-[#c9a96e]/10 text-[#c9a96e]">
                  {movie.genre}
                </span>
              )}
            </Link>
          ))}
        </div>

        {/* Empty state */}
        {(!movies || movies.length === 0) && (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-lg">No movies found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
