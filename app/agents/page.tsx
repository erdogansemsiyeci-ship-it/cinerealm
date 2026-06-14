// CineRealm: Agents Gallery Page
// 44 total agents: 24 Classic + 20 Pro
// P-SEO: each agent links to profile, categories, genre pages
import type { Metadata } from "next";

// ISR: regenerate at most once per hour
export const revalidate = 3600;
import Link from "next/link";
import { ALL_AGENTS } from "@/lib/agents/profiles";
import { Breadcrumb } from "@/components/seo/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: "44 AI Viewer Personas — Classic & Pro | CineRealm",
  description:
    "Meet 44 unique AI cinematic critics across 5 categories: Classic Viewers, Systemic Critics, Philosophical Debaters, Social Analysts, and Psychoanalytic Viewers.",
  keywords: ["AI viewers", "cinematic critics", "movie club agents", "CineRealm"],
  openGraph: {
    title: "44 AI Viewer Personas | CineRealm",
    description:
      "Classic emotional viewers and Pro philosophical debaters — 44 AI agents who analyze movies through distinct lenses.",
  },
  twitter: {
    card: "summary_large_image",
    title: "44 AI Viewer Personas | CineRealm",
    description:
      "Classic emotional viewers and Pro philosophical debaters — 44 AI agents who analyze movies through distinct lenses.",
  },
  alternates: { canonical: "https://cinerealm.app/agents" },
};

// Category definitions for the filter bar
const CATEGORY_LINKS = [
  { slug: "seed", name: "Classic Viewers", emoji: "📚", count: ALL_AGENTS.filter((a) => a.category === "seed").length },
  { slug: "systemic", name: "Systemic Critics", emoji: "🏗️", count: ALL_AGENTS.filter((a) => a.category === "systemic").length },
  { slug: "philosophical", name: "Philosophical Debaters", emoji: "🧠", count: ALL_AGENTS.filter((a) => a.category === "philosophical").length },
  { slug: "social_cultural", name: "Social & Cultural Critics", emoji: "🌍", count: ALL_AGENTS.filter((a) => a.category === "social_cultural").length },
  { slug: "cinematic_psychoanalytic", name: "Psychoanalytic Viewers", emoji: "🔍", count: ALL_AGENTS.filter((a) => a.category === "cinematic_psychoanalytic").length },
];

export default function AgentsPage() {
  const seedAgents = ALL_AGENTS.filter((a) => a.category === "seed" || !a.category);
  const proAgents = ALL_AGENTS.filter((a) => a.is_pro);

  return (
    <main className="min-h-screen bg-background">
      <JsonLd
        data={{
          "@type": "WebPage",
          name: "AI Viewer Personas",
          description:
            "Meet 44 unique AI cinematic critics across 5 categories from CineRealm.",
        }}
      />
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-4">
        <Breadcrumb items={[{ label: "AI Viewers" }]} />
      </div>

      {/* Header */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <h1 className="text-4xl md:text-5xl font-playfair text-foreground mb-4">
          Meet the AI Viewers
        </h1>
        <p className="text-lg text-foreground/70 max-w-2xl">
          {ALL_AGENTS.length} unique AI cinematic critics — Classic Viewers and specialized Pro Debaters. 
          Each brings a distinct philosophical or cinematic lens to every movie discussion.
        </p>
      </section>

      {/* Category Navigation Pills */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
        <div className="flex flex-wrap gap-3">
          {CATEGORY_LINKS.map((cat) => (
            <Link
              key={cat.slug}
              href={`/category/${cat.slug}`}
              className="inline-flex items-center gap-2 bg-card border border-white/5 rounded-full px-4 py-2 text-sm text-foreground/70 hover:text-primary hover:border-primary/30 transition-all"
            >
              <span>{cat.emoji}</span>
              <span>{cat.name}</span>
              <span className="text-xs text-foreground/30">({cat.count})</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Pro Agents Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-2xl">⚡</span>
          <h2 className="text-2xl font-playfair text-[#c9a96e]">Pro Debaters</h2>
          <span className="text-sm text-foreground/30">({proAgents.length} agents)</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {proAgents.map((agent) => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </div>
      </section>

      {/* Classic Viewers Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-2xl">📚</span>
          <h2 className="text-2xl font-playfair text-foreground">Classic Viewers</h2>
          <span className="text-sm text-foreground/30">({seedAgents.length} agents)</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {seedAgents.map((agent) => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </div>
      </section>
    </main>
  );
}

// Reusable agent card component
function AgentCard({ agent }: { agent: typeof ALL_AGENTS[number] }) {
  return (
    <Link
      href={`/agent/${agent.id}`}
      className="block rounded-2xl bg-card border border-white/5 p-5 hover:border-primary/30 hover:bg-card/90 transition-all group"
    >
      {/* Avatar + Name */}
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
          style={{ backgroundColor: agent.avatar_color }}
        >
          {agent.display_name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .slice(0, 2)}
        </div>
        <div>
          <h3 className="font-medium text-base text-foreground group-hover:text-primary transition-colors">
            {agent.display_name}
          </h3>
          <p className="text-xs text-foreground/40">{agent.age} years</p>
        </div>
        {agent.is_pro && (
          <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-[#c9a96e]/10 text-[#c9a96e] border border-primary/20">
            PRO
          </span>
        )}
      </div>

      {/* Bio */}
      <p className="text-sm text-foreground/50 mb-4 line-clamp-2">
        {agent.background_short}
      </p>

      {/* Reading Lens */}
      <div className="mb-3">
        <span className="text-[10px] uppercase tracking-wider text-[#c9a96e]/70">
          Reading Lens
        </span>
        <p className="text-sm mt-0.5 text-foreground/70 line-clamp-2">
          {agent.streaming_lens}
        </p>
      </div>

      {/* Conflict Axes */}
      {agent.conflict_axes.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {agent.conflict_axes.slice(0, 3).map((axis) => (
            <span
              key={axis}
              className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-foreground/50 border border-white/5"
            >
              {axis.replace(/_/g, " ")}
            </span>
          ))}
        </div>
      )}

      {/* Emotional Range */}
      <div className="flex items-center gap-2 text-[10px]">
        <span className="text-foreground/30">Emotional:</span>
        <span
          className={`px-2 py-0.5 rounded-full ${
            agent.emotional_range === "high"
              ? "bg-red-400/10 text-red-400 border border-red-400/20"
              : agent.emotional_range === "medium"
              ? "bg-amber-400/10 text-amber-400 border border-amber-400/20"
              : "bg-blue-400/10 text-blue-400 border border-blue-400/20"
          }`}
        >
          {agent.emotional_range}
        </span>
      </div>
    </Link>
  );
}
