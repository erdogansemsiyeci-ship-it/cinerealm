// B2B Fingerprint Library page
import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/seo/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Fingerprint Library — CineRealm B2B",
    description:
      "Browse the complete library of movie fingerprints. Compare cosine similarity scores across 250+ reference titles for market positioning.",
    keywords: ["movie fingerprints", "cosine similarity", "publisher data", "market analysis", "CineRealm B2B"],
    openGraph: {
      title: "Fingerprint Library — CineRealm B2B",
      description:
        "Browse the complete library of movie fingerprints. Compare cosine similarity scores across 250+ reference titles for market positioning.",
      type: "website",
      siteName: "CineRealm",
    },
    twitter: {
      card: "summary_large_image",
      title: "Fingerprint Library — CineRealm B2B",
      description:
        "Browse the complete library of movie fingerprints. Compare cosine similarity scores across 250+ reference titles for market positioning.",
    },
    alternates: { canonical: "https://cinerealm.app/b2b/library" },
  };
}

export default function LibraryPage() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-16">
      <Breadcrumb
        items={[
          { label: "Predictive Oracle", href: "/b2b" },
          { label: "Library" },
        ]}
      />
      <JsonLd
        data={{
          "@type": "WebPage",
          name: "Fingerprint Library",
          description:
            "Browse the complete library of movie fingerprints. Compare cosine similarity scores across 250+ reference titles for market positioning.",
        }}
      />
      <h1 className="text-4xl font-heading font-bold mb-4">
        Fingerprint Library
      </h1>
      <p className="text-muted-foreground text-lg mb-8">
        Browse the complete library of movie fingerprints. Compare cosine
        similarity scores across 250+ reference titles for market positioning.
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
