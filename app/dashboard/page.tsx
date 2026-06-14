import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/seo/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: "Dashboard — CineRealm",
  description: "Your CineRealm dashboard — track reputation, manage credits, and evolve your editorial rank.",
  keywords: ["dashboard", "profile", "reputation", "CineRealm"],
  openGraph: {
    title: "Dashboard — CineRealm",
    description: "Your CineRealm dashboard — manage AI avatars and cinematic analysis credits.",
    type: "website", siteName: "CineRealm",
  },
  twitter: {
    card: "summary_large_image",
    title: "Dashboard — CineRealm",
    description: "Your CineRealm dashboard — manage AI avatars and cinematic analysis credits.",
  },
  alternates: { canonical: "https://cinerealm.app/dashboard" },
};

// ── Badge System ──────────────────────────────────────

const BADGES = [
  { min: 0,    max: 199,  icon: "✒️", title: "Çaylak Kalem",     color: "text-muted-foreground", bg: "bg-muted" },
  { min: 200,  max: 999,  icon: "🧩", title: "Kurgu Kalfası",    color: "text-sky-400",           bg: "bg-sky-400/10" },
  { min: 1000, max: 2999, icon: "👁️", title: "Sistemik Mimar",   color: "text-[#c9a96e]",         bg: "bg-[#c9a96e]/10" },
  { min: 3000, max: 999999, icon: "👑", title: "Elit Kurul Üyesi", color: "text-amber-300",        bg: "bg-amber-300/10" },
];

function getBadge(xp: number) {
  for (const b of BADGES) {
    if (xp >= b.min && xp <= b.max) return b;
  }
  return BADGES[0];
}

function getNextLevel(xp: number) {
  for (const b of BADGES) {
    if (xp < b.max) return { next: b.max + 1, progress: ((xp - b.min) / (b.max - b.min + 1)) * 100 };
  }
  return { next: 0, progress: 100 };
}

// ── Page ──────────────────────────────────────────────

interface Profile {
  username: string | null;
  membership_tier: string;
  reputation_score: number;
  analysis_credits_remaining: number;
  credits: number | null;
  synthetic_xp: number | null;
  organic_xp: number | null;
  created_at: string;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const p: Profile = profile ?? {
    username: user.email?.split("@")[0] ?? "viewer",
    membership_tier: "free",
    reputation_score: 0,
    analysis_credits_remaining: 1,
    credits: null,
    synthetic_xp: null,
    organic_xp: null,
    created_at: user.created_at ?? new Date().toISOString(),
  };

  // XP: use synthetic+organic if available, fallback to reputation_score
  const syntheticXp = p.synthetic_xp ?? 0;
  const organicXp = p.organic_xp ?? 0;
  const totalXp = (syntheticXp + organicXp) || p.reputation_score || 0;
  const badge = getBadge(totalXp);
  const { next, progress } = getNextLevel(totalXp);
  const credits = p.credits ?? p.analysis_credits_remaining;

  const tierStyle: Record<string, { label: string; color: string; bg: string }> = {
    free: { label: "Scout", color: "text-muted-foreground", bg: "bg-muted" },
    premium: { label: "Author", color: "text-sky-400", bg: "bg-sky-400/10" },
    publisher: { label: "Publisher", color: "text-[#c9a96e]", bg: "bg-[#c9a96e]/10" },
  };
  const tier = tierStyle[p.membership_tier] ?? tierStyle.free;

  return (
    <div className="min-h-[80vh]">
      <div className="max-w-3xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <Breadcrumb items={[{ label: "Dashboard" }]} />
        <JsonLd data={{ "@type": "WebPage", name: "Dashboard", description: "CineRealm user dashboard" }} />

        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-3xl font-heading font-bold text-heading sm:text-4xl">
            Welcome back,{" "}
            <span className="text-primary">{p.username || "Viewer"}</span>
          </h1>
          <p className="mt-2 text-muted-foreground">{user.email}</p>
        </div>

        {/* ── CYBERNETIC EVOLUTION BAR ── */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Akademi İlerlemesi
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-2xl">{badge.icon}</span>
                <span className={`text-lg font-heading font-bold ${badge.color}`}>
                  {badge.title}
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-3xl font-bold text-heading">{totalXp.toLocaleString()}</span>
              <span className="text-sm text-muted-foreground ml-1">XP</span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-muted rounded-full h-3 mb-2 overflow-hidden">
            <div
              className="h-3 rounded-full transition-all duration-700"
              style={{
                width: `${Math.min(100, Math.max(0, progress))}%`,
                background: "linear-gradient(90deg, #6b4e6d, #c9a96e)",
              }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>{badge.title}</span>
            {next > 0 && <span>{next - totalXp} XP to next rank</span>}
            {next === 0 && <span>MAX RANK</span>}
          </div>

          {/* XP breakdown */}
          <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-border">
            <div className="text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Synthetic XP</p>
              <p className="text-lg font-bold text-sky-400">{syntheticXp.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground">AI Etkileşim</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Organic XP</p>
              <p className="text-lg font-bold text-[#34d399]">{organicXp.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground">İnsan / Pazar</p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {/* Tier */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              Membership
            </p>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold ${tier.color} ${tier.bg}`}>
              {tier.label}
            </span>
            {p.membership_tier === "free" && (
              <Link href="/academy" className="block mt-3 text-xs text-primary hover:underline">
                Advance in Academy →
              </Link>
            )}
          </div>

          {/* Credits */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              Analysis Credits
            </p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-bold text-heading">{credits}</span>
              <span className="text-sm text-muted-foreground">remaining</span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Use credits to run AI-powered manuscript analysis.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link href="/train-avatar" className="group bg-card border border-border rounded-2xl p-5 hover:border-primary/30 transition-colors">
            <h3 className="font-heading font-bold text-heading group-hover:text-primary transition-colors">
              🧬 Train Proxy Avatar →
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Clone your editorial mind. Answer 4 questions and create a custom AI editor.
            </p>
          </Link>

          {p.membership_tier === "publisher" ? (
            <Link href="/b2b" className="group bg-card border border-border rounded-2xl p-5 hover:border-[#c9a96e]/30 transition-colors">
              <h3 className="font-heading font-bold text-[#c9a96e]">Predictive Oracle →</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Analyze manuscripts against 229 reference movies.
              </p>
            </Link>
          ) : (
            <div className="bg-card border border-border rounded-2xl p-5 opacity-60">
              <h3 className="font-heading font-bold text-heading">Predictive Oracle 🔒</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Advance to Publisher status in the Academy to unlock.
              </p>
            </div>
          )}

          <Link href="/marketplace" className="group bg-card border border-border rounded-2xl p-5 hover:border-primary/30 transition-colors">
            <h3 className="font-heading font-bold text-heading group-hover:text-primary transition-colors">
              📊 Editor Marketplace →
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Hire elite AI editors or browse community-trained proxy avatars.
            </p>
          </Link>

          <Link href="/audit" className="group bg-card border border-border rounded-2xl p-5 hover:border-primary/30 transition-colors">
            <h3 className="font-heading font-bold text-heading group-hover:text-primary transition-colors">
              📄 Submit Manuscript →
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Upload your manuscript for AI-powered editorial audit.
            </p>
          </Link>
        </div>

        <p className="mt-10 text-center text-xs text-muted-foreground">
          Member since{" "}
          {new Date(p.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long" })}
        </p>
      </div>
    </div>
  );
}
