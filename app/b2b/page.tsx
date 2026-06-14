// ============================================================================
// CineRealm Predictive Oracle — B2B Dashboard
// Publisher-grade market prediction dashboard
// ISR: regenerate every 5 minutes
// ============================================================================

import Link from "next/link";
import type { Metadata } from "next";
import { createPublicClient } from "@/lib/supabase/public";
import { Breadcrumb } from "@/components/seo/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Predictive Oracle — CineRealm B2B",
    description:
      "AI-powered market prediction for publishers. Cosine similarity fingerprinting against 250+ reference movies. Data-driven acquisition intelligence.",
    keywords: ["movie market prediction", "publisher analytics", "cosine similarity", "acquisition intelligence", "CineRealm B2B"],
    openGraph: {
      title: "Predictive Oracle — CineRealm B2B",
      description:
        "AI-powered market prediction for publishers. Cosine similarity fingerprinting against 250+ reference movies. Data-driven acquisition intelligence.",
      type: "website",
      siteName: "CineRealm",
    },
    twitter: {
      card: "summary_large_image",
      title: "Predictive Oracle — CineRealm B2B",
      description:
        "AI-powered market prediction for publishers. Cosine similarity fingerprinting against 250+ reference movies. Data-driven acquisition intelligence.",
    },
    alternates: { canonical: "https://cinerealm.app/b2b" },
  };
}

export default async function B2BPage() {
  const supabase = createPublicClient();

  // Fetch fingerprint stats
  const { count: totalFingerprinted } = await supabase
    .from("book_fingerprints")
    .select("*", { count: "exact", head: true });

  const { count: totalBooks } = await supabase
    .from("movies")
    .select("*", { count: "exact", head: true })
    .eq("is_published", true);

  const { data: byCategory } = await supabase
    .from("book_fingerprints")
    .select("category");

  const catCount: Record<string, number> = { commercial_bestseller: 0, cinematic_masterpiece: 0, viral_controversial: 0 };
  for (const fp of byCategory || []) {
    const c = fp.category || "uncategorized";
    catCount[c] = (catCount[c] || 0) + 1;
  }

  // Top 5 most similar pairs
  const { data: topFps } = await supabase
    .from("book_fingerprints")
    .select("book_id, book_title, book_author, category, pragmatist_score, empath_score, formalist_score, moralist_score, nihilist_score, computed_at")
    .order("computed_at", { ascending: false })
    .limit(24);

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 24px", color: "#e8e6e3", fontFamily: "Georgia, serif" }}>
      <Breadcrumb items={[{ label: "Predictive Oracle" }]} />
      <JsonLd
        data={{
          "@type": "WebPage",
          name: "Predictive Oracle",
          description:
            "AI-powered market prediction for publishers. Cosine similarity fingerprinting against 250+ reference movies.",
        }}
      />
      {/* Hero */}
      <div style={{ textAlign: "center", marginBottom: 60 }}>
        <h1 style={{
          fontSize: "clamp(2rem, 5vw, 3.5rem)",
          fontFamily: "'Playfair Display', Georgia, serif",
          color: "#c9a96e",
          marginBottom: 16,
          fontWeight: 700,
        }}>
          Predictive Oracle
        </h1>
        <p style={{
          fontSize: "1.2rem",
          color: "#a9a29d",
          maxWidth: 700,
          margin: "0 auto 32px",
          lineHeight: 1.7,
        }}>
          Upload an unpublished manuscript. Our 20 Pro AI Agents stream it, score it across 5 cinematic
          dimensions, and compare it against <strong>{totalFingerprinted || "..."} reference movies</strong> using
          cosine similarity fingerprinting to predict market performance.
        </p>
        <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/b2b/analyze"
            style={{
              background: "#c9a96e", color: "#1a1a2e", padding: "14px 36px",
              borderRadius: 8, fontWeight: 700, fontSize: "1.1rem", textDecoration: "none",
            }}>
            Analyze a Manuscript
          </Link>
          <Link href="/b2b/library"
            style={{
              border: "2px solid #c9a96e", color: "#c9a96e", padding: "14px 36px",
              borderRadius: 8, fontWeight: 700, fontSize: "1.1rem", textDecoration: "none",
            }}>
            Browse Reference Library
          </Link>
        </div>
      </div>

      {/* Stats grid */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
        gap: 20, marginBottom: 60,
      }}>
        <StatCard value={(totalFingerprinted || 0).toString()} label="Fingerprinted Movies" sub={`of ${totalBooks || "..."} total`} />
        <StatCard value={catCount.commercial_bestseller.toString()} label="Commercial Bestsellers" sub="High Pragmatist + Empath" />
        <StatCard value={catCount.cinematic_masterpiece.toString()} label="Cinematic Masterpieces" sub="High Systemic + Formalist" />
        <StatCard value={catCount.viral_controversial.toString()} label="Viral / Controversial" sub="High polarity" />
      </div>

      {/* How It Works */}
      <div style={{
        background: "#1e1e2f", borderRadius: 12, padding: "32px 40px",
        marginBottom: 60, border: "1px solid #2d2d44",
      }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", color: "#c9a96e", fontSize: "1.8rem", marginBottom: 24 }}>
          How the Predictive Oracle Works
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
          <StepCard num="1" title="Agent Analysis"
            text="20 Pro AI Agents stream the manuscript across 5 dimensions: Pragmatist, Empath, Formalist, Moralist, Nihilist. Each produces a score from 0-10." />
          <StepCard num="2" title="Fingerprint Vector"
            text="Scores are compiled into a 20-dimensional vector. This is the movie's unique cinematic fingerprint." />
          <StepCard num="3" title="Cosine Similarity"
            text="The vector is compared against our reference library of 250+ movies using cosine similarity to find the closest matches." />
          <StepCard num="4" title="Market Prediction"
            text="Similarity scores map to market tiers (S/A/B/C/D) with estimated sales ranges, risk levels, and confidence scores." />
        </div>
      </div>

      {/* Reference Library */}
      <h2 style={{ fontFamily: "'Playfair Display', serif", color: "#c9a96e", fontSize: "1.8rem", marginBottom: 24 }}>
        Reference Library
      </h2>
      <p style={{ color: "#a9a29d", marginBottom: 32 }}>
        All fingerprinted movies, categorized by market type. New movies are auto-fingerprinted when analyzed.
      </p>

      <div style={{
        display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
        gap: 16, marginBottom: 60,
      }}>
        {(topFps || []).map(fp => (
          <div key={fp.book_id} style={{
            background: "#1e1e2f", borderRadius: 8, padding: "16px 20px",
            border: "1px solid #2d2d44", transition: "border-color 0.2s",
          }}>
            <div style={{ fontSize: "0.75rem", color: "#c9a96e", marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>
              {fp.category?.replace(/_/g, " ") || "Uncategorized"}
            </div>
            <Link href={`/movie/${fp.book_id}`} style={{
              fontWeight: 700, fontSize: "0.95rem", color: "#e8e6e3",
              textDecoration: "none", display: "block", marginBottom: 4,
            }}>
              {fp.book_title}
            </Link>
            <div style={{ fontSize: "0.8rem", color: "#a9a29d" }}>{fp.book_author}</div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div style={{ textAlign: "center", padding: "60px 0 40px", borderTop: "1px solid #2d2d44" }}>
        <p style={{ color: "#a9a29d", fontSize: "1.1rem", marginBottom: 24 }}>
          Ready to predict your next bestseller?
        </p>
        <Link href="/b2b/analyze"
          style={{
            background: "#c9a96e", color: "#1a1a2e", padding: "16px 48px",
            borderRadius: 8, fontWeight: 700, fontSize: "1.2rem", textDecoration: "none",
          }}>
          Analyze a Manuscript →
        </Link>
      </div>
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────────

function StatCard({ value, label, sub }: { value: string; label: string; sub?: string }) {
  return (
    <div style={{
      background: "#1e1e2f", borderRadius: 12, padding: "28px 24px",
      border: "1px solid #2d2d44", textAlign: "center",
    }}>
      <div style={{ fontSize: "2.5rem", fontWeight: 700, color: "#c9a96e", fontFamily: "Georgia, serif" }}>
        {value}
      </div>
      <div style={{ fontSize: "1rem", color: "#e8e6e3", marginTop: 8, fontWeight: 600 }}>
        {label}
      </div>
      {sub && <div style={{ fontSize: "0.8rem", color: "#a9a29d", marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function StepCard({ num, title, text }: { num: string; title: string; text: string }) {
  return (
    <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
      <div style={{
        width: 40, height: 40, minWidth: 40, borderRadius: "50%",
        background: "#c9a96e", color: "#1a1a2e", display: "flex",
        alignItems: "center", justifyContent: "center",
        fontWeight: 700, fontSize: "1.2rem",
      }}>
        {num}
      </div>
      <div>
        <h4 style={{ margin: "0 0 6px", color: "#e8e6e3", fontSize: "1rem" }}>{title}</h4>
        <p style={{ margin: 0, color: "#a9a29d", fontSize: "0.9rem", lineHeight: 1.6 }}>{text}</p>
      </div>
    </div>
  );
}
