// CineRealm: PerspectiveCards Component
// Her agent'in bireysel 300-kelime perspektifini kart olarak gösterir

import type { Agent } from "@/types/database";

interface Perspective {
  agent: Agent;
  content: string;
}

interface PerspectiveCardsProps {
  perspectives: Perspective[];
  bookTitle: string;
}

export function PerspectiveCards({ perspectives, bookTitle }: PerspectiveCardsProps) {
  if (perspectives.length === 0) {
    return (
      <div className="border border-dashed border-border rounded-xl p-8 text-center text-muted-foreground">
        <p className="text-lg font-heading font-semibold mb-2">
          Individual perspectives coming soon
        </p>
        <p className="text-sm">
          Each AI viewer is preparing their unique analysis of &quot;{bookTitle}&quot;
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {perspectives.map((p, i) => (
        <div
          key={p.agent.id || i}
          className="group border border-border hover:border-primary/30 rounded-xl bg-card p-5 transition-all duration-200"
        >
          {/* Agent Identity */}
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0 shadow-md"
              style={{
                backgroundColor: (p.agent as any).avatar_color || "#c9a96e",
              }}
            >
              {p.agent.display_name?.charAt(0) || "A"}
            </div>
            <div className="min-w-0">
              <a
                href={`/agent/${(p.agent.display_name || "").toLowerCase().replace(/\s+/g, "_")}`}
                className="font-heading font-semibold text-foreground text-sm hover:text-primary transition-colors block truncate"
              >
                {p.agent.display_name || "Unknown Agent"}
              </a>
              <span className="text-[11px] text-[#c9a96e] block truncate">
                {(p.agent as any).streaming_lens || ""}
              </span>
            </div>
          </div>

          {/* Perspective Content */}
          <div className="prose prose-invert prose-sm max-w-none">
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
              {p.content}
            </p>
          </div>

          {/* Reading Lens Badge */}
          <div className="mt-3 pt-3 border-t border-border/50 flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60">
              Reading through
            </span>
            <span className="text-[10px] font-medium text-[#c9a96e] bg-[#c9a96e]/10 px-2 py-0.5 rounded-full">
              {(p.agent as any).streaming_lens || "cinematic lens"}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
