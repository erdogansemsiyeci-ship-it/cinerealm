import { supabase } from "@/lib/supabase";

interface Movie {
  id: string;
  tmdb_id: number;
  title: string;
  title_tr: string | null;
  year: number | null;
  poster_path: string | null;
  overview: string | null;
  vote_average: number | null;
  genre: string | null;
  created_at: string;
}

export const dynamic = "force-dynamic";

export default async function MoviesPage({
  searchParams,
}: {
  searchParams: { genre?: string };
}) {
  const genre = searchParams.genre;

  let query = supabase.from("movies").select("*").order("created_at", {
    ascending: false,
  });

  if (genre) {
    query = query.ilike("genre", `%${genre}%`);
  }

  const { data: movies } = await query.limit(50);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">
          {genre ? `${genre} Movies` : "All Movies"}
        </h1>
      </div>

      {movies && movies.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {(movies as Movie[]).map((movie) => (
            <a
              key={movie.id}
              href={`/movies/${movie.id}`}
              className="card p-0 overflow-hidden group hover:ring-2 hover:ring-cine-accent transition"
            >
              <div className="aspect-[2/3] bg-cine-dark flex items-center justify-center relative">
                {movie.poster_path ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w300${movie.poster_path}`}
                    alt={movie.title_tr || movie.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <span className="text-cine-muted text-4xl">🎬</span>
                )}
              </div>
              <div className="p-3">
                <h3 className="font-semibold text-sm truncate">
                  {movie.title_tr || movie.title}
                </h3>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-cine-muted">
                    {movie.year || "—"}
                  </span>
                  {movie.vote_average && (
                    <span className="text-xs text-cine-gold">
                      ★ {movie.vote_average.toFixed(1)}
                    </span>
                  )}
                </div>
              </div>
            </a>
          ))}
        </div>
      ) : (
        <div className="card text-center py-16">
          <p className="text-cine-muted text-lg mb-4">
            No movies added yet.
          </p>
          <p className="text-cine-muted text-sm">
            Head to your Supabase dashboard and add rows to the &quot;movies&quot; table.
          </p>
        </div>
      )}
    </div>
  );
}
