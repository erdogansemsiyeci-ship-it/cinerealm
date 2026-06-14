"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { getNavProfile, signOut } from "@/app/actions/navbar";

const NAV_LINKS = [
  { href: "/discuss", label: "Discussions" },
  { href: "/movies", label: "Movies" },
  { href: "/agents", label: "Editorial Board" },
  { href: "/viewers", label: "Viewers" },
  { href: "/academy", label: "Academy" },
  { href: "/about", label: "About" },
];

const TIER_BADGE: Record<string, { label: string; color: string }> = {
  free: { label: "Scout", color: "bg-muted text-muted-foreground" },
  premium: { label: "Author", color: "bg-sky-400/10 text-sky-400" },
  publisher: { label: "Publisher", color: "bg-[#c9a96e]/10 text-[#c9a96e]" },
};

export function Navbar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [profile, setProfile] = useState<{
    session: boolean;
    username?: string;
    tier?: string;
  } | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    getNavProfile().then(setProfile);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed) {
      router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    }
  };

  const handleSignOut = async () => {
    setLoggingOut(true);
    await signOut();
  };

  const tier = profile?.tier ?? "free";
  const badge = TIER_BADGE[tier] ?? TIER_BADGE.free;

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-1.5 group shrink-0">
          <svg
            className="w-7 h-7 text-[#c9a96e]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            <line x1="8" y1="7" x2="16" y2="7" />
            <line x1="8" y1="11" x2="14" y2="11" />
          </svg>
          <span className="text-xl font-heading font-bold text-[#c9a96e]">Movie</span>
          <span className="text-xl font-heading font-bold text-heading">Realm</span>
        </Link>

        {/* Nav links */}
        <nav className="hidden lg:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground rounded-lg hover:bg-primary/10 transition-all"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="hidden sm:flex flex-1 max-w-xs xl:max-w-sm">
          <div className="relative w-full">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none"
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search movies, authors..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-muted border border-border rounded-lg text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
            />
          </div>
        </form>

        {/* Right side */}
        <div className="flex items-center gap-3 shrink-0">
          <Link href="/search" className="sm:hidden p-2 text-muted-foreground hover:text-foreground transition-colors" aria-label="Search">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </Link>
          <ThemeToggle />

          {profile === null ? (
            /* Loading — show nothing or skeleton */
            <div className="hidden md:block w-16 h-8 bg-muted animate-pulse rounded-lg" />
          ) : profile.session ? (
            /* ── LOGGED IN ── */
            <div className="hidden md:flex items-center gap-2">
              <Link
                href="/dashboard"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium"
              >
                Dashboard
              </Link>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${badge.color}`}>
                {badge.label}
              </span>
              <span className="text-sm text-heading font-medium max-w-[100px] truncate">
                {profile.username}
              </span>
              <button
                onClick={handleSignOut}
                disabled={loggingOut}
                className="text-sm text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
              >
                {loggingOut ? "..." : "Sign Out"}
              </button>
            </div>
          ) : (
            /* ── LOGGED OUT ── */
            <>
              <Link
                href="/login"
                className="hidden md:inline text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/login?tab=signup"
                className="hidden md:inline-flex items-center gap-2 bg-[#c9a96e] text-background px-5 py-2 rounded-lg text-sm font-semibold hover:bg-primary/80 transition-colors"
              >
                Join CineRealm
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
