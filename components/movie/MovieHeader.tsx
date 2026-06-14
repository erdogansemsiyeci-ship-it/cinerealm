// CineRealm: Debate Room — Movie Header
// Büyük kapak, meta bilgiler, paneldeki agent'lar

import Image from "next/image";
import type { Movie } from "@/types/database";

interface PanelAgent {
  name: string;
  lens: string;
  color: string;
  score?: number;
}

interface MovieHeaderProps {
  movie: Movie;
  panel: PanelAgent[];
  messageCount: number;
  phaseCount: number;
  aiScore?: number | null;
  winner?: string;
}

export function MovieHeader({
  movie,
  panel,
  messageCount,
  phaseCount,
  aiScore,
  winner,
}: MovieHeaderProps) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-border bg-card mb-8">
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#c9a96e]/5 via-transparent to-[#c9a96e]/5 pointer-events-none" />

      <div className="relative p-6 sm:p-8">
        {/* Breadcrumb */}
        <nav className="text-xs text-muted-foreground mb-4" aria-label="Breadcrumb">
          <a href="/" className="hover:text-primary transition-colors">CineRealm</a>
          <span className="mx-2">/</span>
          <span className="text-foreground/80">{movie.title}</span>
        </nav>

        <div className="flex flex-col md:flex-row gap-8 items-start">
          {/* Movie Cover — large */}
          <div className="w-44 sm:w-52 h-64 sm:h-72 bg-background rounded-xl overflow-hidden flex-shrink-0 border border-border shadow-xl">
            {movie.cover_url ? (
              <Image
                src={movie.cover_url}
                alt={movie.title}
                width={208}
                height={288}
                className="object-cover w-full h-full"
                priority
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground p-4">
                <span className="text-4xl mb-2">📖</span>
                <span className="text-sm text-center leading-tight font-heading">
                  {movie.title}
                </span>
              </div>
            )}
          </div>

          {/* Movie Info */}
          <div className="flex-1 min-w-0">
            {/* Genre tag */}
            {movie.genre && (
              <span className="inline-block text-[11px] uppercase tracking-widest text-[#c9a96e] font-semibold mb-2">
                {movie.genre}
              </span>
            )}

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-bold text-foreground leading-tight">
              {movie.title}
            </h1>

            <p className="text-muted-foreground text-lg mt-1">
              by <span className="text-foreground/80 font-medium">{movie.author}</span>
              {movie.published_year && (
                <span className="text-muted-foreground/60"> · {movie.published_year}</span>
              )}
              {movie.pages && (
                <span className="text-muted-foreground/60"> · {movie.pages} pages</span>
              )}
            </p>

            {movie.description && (
              <p className="text-muted-foreground mt-3 text-sm leading-relaxed line-clamp-3 max-w-prose">
                {movie.description}
              </p>
            )}

            {/* Stats row */}
            <div className="flex flex-wrap gap-2 mt-4">
              {aiScore != null && (
                <div className="inline-flex items-center gap-1.5 bg-[#c9a96e]/10 text-[#c9a96e] px-3 py-1 rounded-full text-sm font-semibold">
                  <span className="text-base">★</span>
                  AI Score: {aiScore}/10
                </div>
              )}
              <div className="inline-flex items-center gap-1.5 bg-background text-muted-foreground px-3 py-1 rounded-full text-sm border border-border">
                {messageCount} messages
              </div>
              <div className="inline-flex items-center gap-1.5 bg-background text-muted-foreground px-3 py-1 rounded-full text-sm border border-border">
                {phaseCount} phases
              </div>
              {winner && (
                <div className="inline-flex items-center gap-1.5 bg-[#c9a96e]/10 text-[#c9a96e] px-3 py-1 rounded-full text-sm font-medium">
                  🏆 {winner}
                </div>
              )}
            </div>

            {/* Panel roster */}
            <div className="mt-5">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
                Debate Panel
              </p>
              <div className="flex flex-wrap gap-2">
                {panel.map((agent, i) => (
                  <a
                    key={agent.name}
                    href={`/agent/${agent.name.toLowerCase().replace(/\s+/g, "_")}`}
                    className="group inline-flex items-center gap-2 bg-background border border-border hover:border-primary/40 rounded-lg px-3 py-1.5 transition-all"
                  >
                    <span
                      className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0"
                      style={{ backgroundColor: agent.color || "#c9a96e" }}
                    >
                      {agent.name.charAt(0)}
                    </span>
                    <div className="min-w-0">
                      <span className="text-xs font-medium text-foreground/90 group-hover:text-primary transition-colors block truncate">
                        {agent.name}
                      </span>
                      <span className="text-[10px] text-muted-foreground block truncate">
                        {agent.lens}
                      </span>
                    </div>
                    {agent.score != null && (
                      <span className="text-xs font-bold text-[#c9a96e] ml-auto">
                        {agent.score}
                      </span>
                    )}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
