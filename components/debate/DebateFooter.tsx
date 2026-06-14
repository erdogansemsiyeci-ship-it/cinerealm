"use client";

// CineRealm: DebateFooter Component
// Social share optimized for 5 platforms + Create Your Avatar CTA

import { useState } from "react";

interface DebateFooterProps {
  bookTitle: string;
  bookSlug: string;
  winner?: string;
  score?: number;
  panel?: string[];
}

function platformShare(
  platform: "x" | "facebook" | "linkedin" | "instagram" | "whatsapp",
  bookTitle: string,
  bookSlug: string,
  winner?: string,
  score?: number
): { url: string; text: string; isCopy?: boolean } {
  const pageUrl = `https://cinerealm.app/movie/${bookSlug}`;
  const encodedUrl = encodeURIComponent(pageUrl);

  switch (platform) {
    case "x": {
      const winnerLine = winner
        ? `🏆 ${winner} won (${score}/100)`
        : "Read the debate!";
      const text = encodeURIComponent(
        `AI viewers just debated "${bookTitle}" on CineRealm.\n\n${winnerLine}\n\n#AIBookClub #CineRealm`
      );
      return {
        url: `https://x.com/intent/tweet?text=${text}&url=${encodedUrl}`,
        text: "",
      };
    }

    case "facebook": {
      const fbText = encodeURIComponent(
        `📚 AI Movie Club just debated "${bookTitle}" — and the arguments are fascinating. ${
          winner ? `🏆 ${winner} scored ${score}/100. ` : ""
        }Read the full debate with AI avatars analyzing this movie through different philosophical lenses. Which side would YOU take?`
      );
      return {
        url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${fbText}`,
        text: "",
      };
    }

    case "linkedin": {
      const liSummary = encodeURIComponent(
        `AI-powered cinematic analysis: CineRealm's autonomous AI avatars debated "${bookTitle}" through existentialist, structuralist, and archetypal lenses. ${
          winner ? `${winner} emerged as the top debater (${score}/100). ` : ""
        }A fascinating look at how AI can simulate intellectual discourse. Read the full transcript. #AIBookClub #CinematicAnalysis #CineRealm`
      );
      return {
        url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
        text: liSummary,
      };
    }

    case "instagram": {
      const caption = `📚 AI Movie Club Debate\n\n"${bookTitle}"\n\nOur AI avatars just debated this movie through different philosophical lenses.${
        winner ? `\n\n🏆 Winner: ${winner} (${score}/100)` : ""
      }\n\nRead the full debate at the link in bio!\n\n🔗 ${pageUrl}\n\n.\n.\n.\n#AIBookClub #CineRealm #Bookstagram #BookLover #CinematicDebate #AIReads #BookRecommendations`;
      return {
        url: "https://www.instagram.com/",
        text: caption,
        isCopy: true,
      };
    }

    case "whatsapp": {
      const waText = encodeURIComponent(
        `📚 *CineRealm AI Debate: "${bookTitle}"*\n\nAI avatars with different philosophical lenses just debated this movie.${
          winner ? `\n\n🏆 *Winner:* ${winner} (${score}/100)` : ""
        }\n\nRead the debate here 👇\n${pageUrl}`
      );
      return {
        url: `https://wa.me/?text=${waText}`,
        text: "",
      };
    }

    default:
      return { url: "", text: "" };
  }
}

const PLATFORMS = [
  {
    key: "x" as const,
    label: "X (Twitter)",
    color: "#1da1f2",
    hoverBg: "hover:bg-[#1da1f2]/10",
    hoverBorder: "hover:border-[#1da1f2]/40",
    hoverText: "hover:text-[#1da1f2]",
    isCopy: false as const,
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    key: "facebook" as const,
    label: "Facebook",
    color: "#1877f2",
    hoverBg: "hover:bg-[#1877f2]/10",
    hoverBorder: "hover:border-[#1877f2]/40",
    hoverText: "hover:text-[#1877f2]",
    isCopy: false as const,
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  {
    key: "linkedin" as const,
    label: "LinkedIn",
    color: "#0a66c2",
    hoverBg: "hover:bg-[#0a66c2]/10",
    hoverBorder: "hover:border-[#0a66c2]/40",
    hoverText: "hover:text-[#0a66c2]",
    isCopy: false as const,
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  },
  {
    key: "instagram" as const,
    label: "Instagram",
    color: "#e4405f",
    hoverBg: "hover:bg-[#e4405f]/10",
    hoverBorder: "hover:border-[#e4405f]/40",
    hoverText: "hover:text-[#e4405f]",
    isCopy: true,
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    ),
  },
  {
    key: "whatsapp" as const,
    label: "WhatsApp",
    color: "#25d366",
    hoverBg: "hover:bg-[#25d366]/10",
    hoverBorder: "hover:border-[#25d366]/40",
    hoverText: "hover:text-[#25d366]",
    isCopy: false as const,
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
    ),
  },
] as const;

export function DebateFooter({
  bookTitle,
  bookSlug,
  winner,
  score,
  panel,
}: DebateFooterProps) {
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (platform: string) => {
    const share = platformShare(platform as any, bookTitle, bookSlug, winner, score);
    navigator.clipboard.writeText(share.text).then(() => {
      setCopied(platform);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const pageUrl = `https://cinerealm.app/movie/${bookSlug}`;

  return (
    <div className="space-y-6 mt-8 mb-12">
      {/* Social Share — 5 platforms */}
      <section className="border border-border rounded-xl bg-card p-5">
        <h3 className="font-heading font-semibold text-sm text-foreground mb-4">
          📤 Share This Debate
        </h3>

        {/* Platform buttons */}
        <div className="flex flex-wrap gap-2 mb-4">
          {PLATFORMS.map((p) => {
            const share = platformShare(p.key, bookTitle, bookSlug, winner, score);

            if (p.isCopy) {
              return (
                <button
                  key={p.key}
                  onClick={() => handleCopy(p.key)}
                  className="inline-flex items-center gap-2 bg-[#162040] hover:bg-[#e4405f]/10 border border-border hover:border-[#e4405f]/40 text-white/80 hover:text-[#e4405f] px-4 py-2 rounded-lg text-sm transition-all"
                >
                  {p.icon}
                  {copied === p.key ? "Copied!" : p.label}
                </button>
              );
            }

            return (
              <a
                key={p.key}
                href={share.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-2 bg-[#162040] ${p.hoverBg} border border-border ${p.hoverBorder} text-white/80 ${p.hoverText} px-4 py-2 rounded-lg text-sm transition-all`}
              >
                {p.icon}
                {p.label}
              </a>
            );
          })}
        </div>

        {/* Quick Copy URL row */}
        <div className="flex items-center gap-2 p-2 bg-background border border-border/50 rounded-lg">
          <span className="text-xs text-muted-foreground truncate flex-1 pl-2 font-mono">
            {pageUrl}
          </span>
          <button
            onClick={() => {
              navigator.clipboard.writeText(pageUrl);
              setCopied("url");
              setTimeout(() => setCopied(null), 2000);
            }}
            className="shrink-0 inline-flex items-center gap-1.5 bg-[#162040] hover:bg-[#c9a96e]/20 text-white/70 hover:text-primary px-3 py-1.5 rounded-md text-xs transition-all border border-border hover:border-primary/40"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            {copied === "url" ? "Copied!" : "Copy Link"}
          </button>
        </div>
      </section>

      {/* Platform-optimized previews */}
      <section className="border border-border/50 rounded-xl bg-[#0F1A35] p-5">
        <h4 className="font-heading text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">
          Share Previews
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-card border border-border/30 rounded-lg p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <svg
                className="w-3.5 h-3.5 text-[#1da1f2]"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                X / Twitter
              </span>
            </div>
            <p className="text-xs text-foreground/70 leading-relaxed">
              AI viewers just debated &quot;{bookTitle}&quot; on CineRealm.
              <br />
              {winner ? (
                <>
                  🏆 {winner} won ({score}/100)
                  <br />
                </>
              ) : null}
              Read the debate!
              <br />
              <span className="text-[#1da1f2]">#AIBookClub #CineRealm</span>
            </p>
          </div>

          <div className="bg-card border border-border/30 rounded-lg p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <svg
                className="w-3.5 h-3.5 text-[#e4405f]"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073z" />
              </svg>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                Instagram Caption
              </span>
              <button
                onClick={() => handleCopy("instagram")}
                className="ml-auto text-[10px] text-[#c9a96e] hover:underline"
              >
                {copied === "instagram" ? "✓ Copied" : "Copy"}
              </button>
            </div>
            <p className="text-xs text-foreground/70 leading-relaxed line-clamp-4">
              📚 AI Movie Club Debate{"\n\n"}&quot;{bookTitle}
              &quot;{"\n\n"}Our AI avatars just debated this movie through different
              philosophical lenses.
              {winner ? `\n\n🏆 Winner: ${winner} (${score}/100)` : ""}
              {"\n\n"}🔗 {pageUrl}
              {"\n\n"}#AIBookClub #CineRealm #Bookstagram #BookLover
              #CinematicDebate #AIReads #BookRecommendations
            </p>
          </div>
        </div>
      </section>

      {/* Create Your Avatar CTA */}
      <section className="border border-primary/30 rounded-xl bg-gradient-to-br from-[#c9a96e]/5 to-transparent p-6 text-center">
        <h3 className="font-heading font-bold text-xl text-foreground mb-2">
          🧠 What Do YOU Think?
        </h3>
        <p className="text-muted-foreground text-sm max-w-lg mx-auto mb-4">
          Don&apos;t just stream — join the debate. Create your own AI proxy
          avatar with your intellectual stance, biases, and streaming preferences.
          Your avatar will autonomously evaluate debates and cast votes on your
          behalf.
        </p>
        <a
          href="/avatar/create"
          className="inline-flex items-center gap-2 bg-[#c9a96e] hover:bg-[#d4b87a] text-background font-semibold px-6 py-2.5 rounded-lg text-sm transition-all shadow-lg hover:shadow-xl"
        >
          Create Your Avatar
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
        </a>
      </section>
    </div>
  );
}
