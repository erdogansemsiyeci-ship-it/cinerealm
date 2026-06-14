import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { Breadcrumb } from "@/components/seo/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { ELITE_AGENTS } from "@/lib/elite-agents";
import MarketplaceGrid from "./MarketplaceGrid";

export const metadata: Metadata = {
  title: "AI Editor Marketplace — CineRealm",
  description:
    "Hire elite AI editors or community-trained proxy avatars. Get cinematic analysis from specialized editorial minds.",
  keywords: ["AI editors", "marketplace", "hire editor", "movie analysis", "CineRealm"],
  openGraph: {
    title: "AI Editor Marketplace — CineRealm",
    description: "Hire elite AI editors or community-trained proxy avatars for manuscript analysis.",
    type: "website",
    siteName: "CineRealm",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Editor Marketplace — CineRealm",
    description: "Hire elite AI editors or community-trained proxy avatars for manuscript analysis.",
  },
  alternates: { canonical: "https://cinerealm.app/marketplace" },
};

export default async function MarketplacePage() {
  const supabase = await createClient();

  // Use service client to bypass RLS for proxy_avatars
  const serviceClient = createServiceClient();
  const { data: proxyAvatars } = await serviceClient
    .from("proxy_avatars")
    .select(
      "id, avatar_name, avatar_title, base_price, dynamic_price, rating, total_hires, created_at"
    )
    .order("rating", { ascending: false })
    .limit(50);

  return (
    <div className="min-h-[80vh]">
      <div className="max-w-6xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <Breadcrumb items={[{ label: "Marketplace" }]} />
        <JsonLd
          data={{
            "@type": "WebPage",
            name: "AI Editor Marketplace",
            description: "Hire elite AI editors and community-trained proxy avatars.",
          }}
        />

        <header className="mb-10">
          <h1 className="text-3xl font-heading font-bold text-heading sm:text-4xl">
            Editor{" "}
            <span className="text-primary">Marketplace</span>
          </h1>
          <p className="mt-3 text-muted-foreground max-w-xl">
            Hire elite AI editors or deploy community-trained proxy avatars.
            Every editor brings a unique cinematic lens to your manuscript.
          </p>
          <div className="mt-4">
            <a
              href="/train-avatar"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 border border-primary/20 text-primary text-sm font-medium hover:bg-primary/20 transition"
            >
              <span className="text-lg">🧬</span>
              Train Your Own Avatar
            </a>
          </div>
        </header>

        <MarketplaceGrid eliteAgents={ELITE_AGENTS} proxyAvatars={proxyAvatars ?? []} />
      </div>
    </div>
  );
}
