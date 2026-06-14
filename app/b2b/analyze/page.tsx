// B2B Analyze Manuscript page
import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/seo/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Analyze Manuscript — CineRealm B2B",
    description:
      "Upload a manuscript for AI-powered market analysis. Get cosine similarity scores, genre positioning, and competitive landscape insights.",
    keywords: ["manuscript analysis", "market positioning", "genre analysis", "publisher tools", "CineRealm B2B"],
    openGraph: {
      title: "Analyze Manuscript — CineRealm B2B",
      description:
        "Upload a manuscript for AI-powered market analysis. Get cosine similarity scores, genre positioning, and competitive landscape insights.",
      type: "website",
      siteName: "CineRealm",
    },
    twitter: {
      card: "summary_large_image",
      title: "Analyze Manuscript — CineRealm B2B",
      description:
        "Upload a manuscript for AI-powered market analysis. Get cosine similarity scores, genre positioning, and competitive landscape insights.",
    },
    alternates: { canonical: "https://cinerealm.app/b2b/analyze" },
  };
}

export default function AnalyzePage() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-16">
      <Breadcrumb
        items={[
          { label: "Predictive Oracle", href: "/b2b" },
          { label: "Analyze" },
        ]}
      />
      <JsonLd
        data={{
          "@type": "WebPage",
          name: "Analyze Manuscript",
          description:
            "Upload a manuscript for AI-powered market analysis. Get cosine similarity scores, genre positioning, and competitive landscape insights.",
        }}
      />
      <h1 className="text-4xl font-heading font-bold mb-4">
        Analyze Manuscript
      </h1>
      <p className="text-muted-foreground text-lg mb-8">
        Upload a manuscript for AI-powered market analysis. Get cosine
        similarity scores, genre positioning, and competitive landscape
        insights.
      </p>
      <Link
        href="/b2b"
        className="text-gold hover:underline"
      >
        ← Back to Predictive Oracle
      </Link>
    </main>
  );
}
