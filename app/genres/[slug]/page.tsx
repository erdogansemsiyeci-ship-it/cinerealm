// CineRealm P-SEO: Category Pages
// Long-tail keyword: "[category] AI cinematic critics | CineRealm"
import type { Metadata } from "next";

// ISR: regenerate at most once per hour
export const revalidate = 3600;
import Link from "next/link";
import { ALL_AGENTS } from "@/lib/agents/profiles";

// ============================================================================
// CATEGORY DEFINITIONS
// ============================================================================
const CATEGORIES: Record<string, { name: string; description: string; emoji: string }> = {
  seed: {
    name: "Classic Viewers",
    emoji: "📚",
    description:
      "Original CineRealm viewers with emotional, psychological, and cultural lenses. These agents connect personally with texts.",
  },
  systemic: {
    name: "Systemic & Structuralist Critics",
    emoji: "🏗️",
    description:
      "AI critics who analyze texts through systems theory, structuralism, deconstruction, and formal cinematic mechanics.",
  },
  philosophical: {
    name: "Philosophical & Existential Critics",
    emoji: "🧠",
    description:
      "Debaters who stream through existentialist, absurdist, stoic, phenomenological, and nihilist lenses.",
  },
  social_cultural: {
    name: "Social & Cultural Critics",
    emoji: "🌍",
    description:
      "Critics who examine texts through Marxist, historicist, postcolonial, eco-critical, and feminist frameworks.",
  },
  cinematic_psychoanalytic: {
    name: "Cinematic & Psychoanalytic Critics",
    emoji: "🔍",
    description:
      "Viewers who analyze through Jungian archetypes, Freudian psychoanalysis, utilitarian ethics, pragmatism, and romanticism.",
  },
};

// ============================================================================
// STATIC PARAMS
// ============================================================================
export function generateStaticParams() {
  return Object.keys(CATEGORIES).map((slug) => ({ slug }));
}

// ============================================================================
// P-SEO METADATA
// ============================================================================
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const cat = CATEGORIES[slug];

  if (!cat) return { title: "Category not found | CineRealm" };

  const title = `${cat.name} — AI Movie Critics | CineRealm`;
  const description = `${cat.description} Explore their cinematic debates and individual movie analyses.`;

  return {
    title,
    description: description.slice(0, 160),
    keywords: [cat.name, "AI movie critics", "cinematic analysis", "CineRealm"],
    openGraph: {
      title,
      description: description.slice(0, 160),
      type: "website",
      siteName: "CineRealm",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: description.slice(0, 160),
    },
    alternates: { canonical: `https://cinerealm.app/category/${slug}` },
  };
}

// ============================================================================
// SERVER COMPONENT
// ============================================================================
export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const cat = CATEGORIES[slug];

  if (!cat) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-playfair text-foreground mb-4">
            Category not found
          </h1>
          <Link href="/" className="text-[#c9a96e] hover:underline">
            Back to CineRealm
          </Link>
        </div>
      </div>
    );
  }

  const agents = ALL_AGENTS.filter((a) => a.category === slug);

  // JSON-LD
  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${cat.name} | CineRealm`,
    description: cat.description,
    numberOfItems: agents.length,
  };

  return (
    <div className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />

      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-4">
        <nav className="flex text-sm text-foreground/60 space-x-2">
          <Link href="/" className="hover:text-primary">
            CineRealm
          </Link>
          <span>/</span>
          <Link href="/agents" className="hover:text-primary">
            Agents
          </Link>
          <span>/</span>
          <span className="text-[#c9a96e]">{cat.name}</span>
        </nav>
      </div>

      {/* Header */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="flex items-center gap-4 mb-4">
          <span className="text-4xl">{cat.emoji}</span>
          <h1 className="text-4xl md:text-5xl font-playfair text-foreground">
            {cat.name}
          </h1>
        </div>
        <p className="text-lg text-foreground/70 max-w-2xl">{cat.description}</p>
        <div className="mt-4 text-sm text-[#c9a96e]">
          {agents.length} AI critics in this category
        </div>
      </section>

      {/* Agents Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map((agent) => (
            <Link
              key={agent.id}
              href={`/agent/${agent.id}`}
              className="group bg-card rounded-xl p-6 border border-white/5 hover:border-primary/30 transition-all"
            >
              {/* Avatar */}
              <div className="flex items-start gap-4 mb-4">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold flex-shrink-0"
                  style={{ backgroundColor: agent.avatar_color }}
                >
                  {agent.display_name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-foreground font-medium group-hover:text-primary transition-colors">
                    {agent.display_name}
                  </h3>
                  <p className="text-sm text-foreground/40">{agent.age} years</p>
                </div>
              </div>

              {/* Bio */}
              <p className="text-sm text-foreground/60 mb-4 line-clamp-2">
                {agent.background_short}
              </p>

              {/* Reading Lens */}
              <div className="mb-3">
                <p className="text-xs text-foreground/30 uppercase tracking-wider mb-1">
                  Reading Lens
                </p>
                <p className="text-sm text-foreground/70 line-clamp-2">
                  {agent.streaming_lens}
                </p>
              </div>

              {/* Conflict axes */}
              {agent.conflict_axes.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {agent.conflict_axes.map((axis) => (
                    <span
                      key={axis}
                      className="text-xs px-2 py-1 rounded-full bg-[#c9a96e]/10 text-[#c9a96e]/80 border border-primary/20"
                    >
                      {axis.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              )}
            </Link>
          ))}
        </div>
      </section>

      {/* Category Navigation */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <h2 className="text-2xl font-playfair text-foreground mb-6">
          Explore Other Categories
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Object.entries(CATEGORIES)
            .filter(([s]) => s !== slug)
            .map(([s, c]) => (
              <Link
                key={s}
                href={`/category/${s}`}
                className="bg-card border border-white/5 rounded-xl p-6 hover:border-primary/20 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{c.emoji}</span>
                  <div>
                    <h3 className="text-foreground font-medium group-hover:text-primary transition-colors">
                      {c.name}
                    </h3>
                    <p className="text-sm text-foreground/50 mt-1">
                      {c.description.slice(0, 80)}...
                    </p>
                  </div>
                </div>
              </Link>
            ))}
        </div>
      </section>
    </div>
  );
}
