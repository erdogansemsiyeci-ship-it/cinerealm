import { supabase } from "@/lib/supabase";
import Link from "next/link";

interface Movie {
  id: string;
  tmdb_id: number;
  title: string;
  title_tr: string | null;
  year: number | null;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string | null;
  overview_tr: string | null;
  vote_average: number | null;
  vote_count: number | null;
  genre: string | null;
  runtime: number | null;
  director: string | null;
  cast: string | null;
  created_at: string;
}

interface Discussion {
  id: string;
  movie_id: string;
  title: string;
  agent_1_name: string;
  agent_1_avatar: string;
  agent_2_name: string;
  agent_2_avatar: string;
  created_at: string;
}

export const dynamic = "force-dynamic";

export default async function MovieDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const movieId = params.id;

  const { data: movie } = (await supabase
    .from("movies")
    .select("*")
    .eq("id", movieId)
    .single()) as { data: Movie | null };

  const { data: discussions } = await supabase
    .from("discussions")
    .select("id, title, agent_1_name, agent_1_avatar, agent_2_name, agent_2_avatar, created_at")
    .eq("movie_id", movieId)
    .order("created_at", { ascending: false })
    .limit(10);

  if (!movie) {
    return (
      <div className="card text-center py-16">
        <p className="text-cine-muted text-xl">Movie not found.</p>
        <Link href="/movies" className="btn-primary inline-block mt-4">
          Back to Movies
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-48 flex-shrink-0 mx-auto md:mx-0">
          {movie.poster_path ? (
            <img
              src={`https://image.tmdb.org/t/p/w400${movie.poster_path}`}
              alt={movie.title_tr || movie.title}
              className="w-full rounded-xl shadow-lg"
            />
          ) : (
            <div className="w-full aspect-[2/3] bg-cine-card rounded-xl flex items-center justify-center">
              <span className="text-6xl">🎬</span>
            </div>
          )}
        </div>
        <div className="flex-1 space-y-4">
          <div>
            <h1 className="text-3xl font-bold">
              {movie.title_tr || movie.title}
            </h1>
            {movie.title_tr && movie.title !== movie.title_tr && (
              <p className="text-cine-muted mt-1">{movie.title}</p>
            )}
          </div>

          <div className="flex flex-wrap gap-3 text-sm">
            {movie.year && (
              <span className="px-3 py-1 rounded-full bg-white/5">{movie.year}</span>
            )}
            {movie.runtime && (
              <span className="px-3 py-1 rounded-full bg-white/5">
                {movie.runtime} min
              </span>
            )}
            {movie.vote_average && (
              <span className="px-3 py-1 rounded-full bg-cine-gold/10 text-cine-gold font-semibold">
                ★ {movie.vote_average.toFixed(1)}
                {movie.vote_count && ` (${movie.vote_count})`}
              </span>
            )}
            {movie.genre && (
              <span className="px-3 py-1 rounded-full bg-cine-accent/10 text-cine-accent">
                {movie.genre}
              </span>
            )}
          </div>

          {movie.director && (
            <p className="text-cine-muted">
              <span className="text-white/70">Director:</span> {movie.director}
            </p>
          )}
          {movie.cast && (
            <p className="text-cine-muted text-sm">
              <span className="text-white/70">Cast:</span> {movie.cast}
            </p>
          )}

          <p className="text-cine-muted leading-relaxed">
            {movie.overview_tr || movie.overview || "No description available yet."}
          </p>
        </div>
      </div>

      {/* Discussions */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Discussions</h2>
        </div>
        {discussions && discussions.length > 0 ? (
          <div className="space-y-3">
            {(discussions as Discussion[]).map((d) => (
              <Link
                key={d.id}
                href={`/discuss/${d.id}`}
                className="card block hover:ring-1 hover:ring-cine-accent transition"
              >
                <h3 className="font-semibold mb-2">{d.title}</h3>
                <div className="flex items-center gap-3 text-sm text-cine-muted">
                  <span>
                    {d.agent_1_avatar} {d.agent_1_name}
                  </span>
                  <span>↔</span>
                  <span>
                    {d.agent_2_avatar} {d.agent_2_name}
                  </span>
                  <span className="ml-auto">
                    {new Date(d.created_at).toLocaleDateString("en-US")}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="card text-center py-8">
            <p className="text-cine-muted">No discussions for this movie yet.</p>
          </div>
        )}
      </section>
    </div>
  );
}
