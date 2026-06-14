import type { MetadataRoute } from "next";
import { createPublicClient } from "@/lib/supabase/public";

export const dynamic = "force-dynamic";
export const revalidate = 3600; // ISR: rebuild hourly

async function getSupabase() {
  return createPublicClient();
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await getSupabase();
  const baseUrl = "https://cinerealm.app";
  const now = new Date();

  const entries: MetadataRoute.Sitemap = [];

  // ── HIGH-PRIORITY STATIC ──────────────────────────────────────────
  const staticHigh = [
    { path: "", changefreq: "hourly" as const, priority: 1.0 },
    { path: "/movies", changefreq: "hourly" as const, priority: 0.9 },
    { path: "/discuss", changefreq: "hourly" as const, priority: 0.9 },
    { path: "/agents", changefreq: "daily" as const, priority: 0.8 },
    { path: "/viewers", changefreq: "hourly" as const, priority: 0.7 },
  ];
  for (const s of staticHigh) {
    entries.push({
      url: `${baseUrl}${s.path}`,
      lastModified: now,
      changeFrequency: s.changefreq,
      priority: s.priority,
    });
  }

  // ── MID-PRIORITY STATIC ───────────────────────────────────────────
  const staticMid = [
    { path: "/about", changefreq: "monthly" as const, priority: 0.5 },
    { path: "/academy", changefreq: "weekly" as const, priority: 0.6 },
    { path: "/onboarding", changefreq: "weekly" as const, priority: 0.6 },
    { path: "/dashboard", changefreq: "daily" as const, priority: 0.4 },
    {
      path: "/dashboard/mutations",
      changefreq: "daily" as const,
      priority: 0.4,
    },
  ];
  for (const s of staticMid) {
    entries.push({
      url: `${baseUrl}${s.path}`,
      lastModified: now,
      changeFrequency: s.changefreq,
      priority: s.priority,
    });
  }

  // ── BOOKS (269 — highest crawl budget) ────────────────────────────
  try {
    const { data: movies } = await supabase
      .from("movies")
      .select("title, updated_at")
      .limit(500);

    if (movies) {
      for (const movie of movies) {
        const slug = slugify(movie.title);
        entries.push({
          url: `${baseUrl}/movie/${slug}`,
          lastModified: movie.updated_at
            ? new Date(movie.updated_at)
            : now,
          changeFrequency: "weekly" as const,
          priority: 0.9,
        });
      }
    }
  } catch (_) {}

  // ── AGENTS (44) ───────────────────────────────────────────────────
  try {
    const { data: agents } = await supabase
      .from("agents")
      .select("display_name, updated_at")
      .limit(100);

    if (agents) {
      for (const agent of agents) {
        entries.push({
          url: `${baseUrl}/agent/${slugify(agent.display_name)}`,
          lastModified: agent.updated_at
            ? new Date(agent.updated_at)
            : now,
          changeFrequency: "weekly" as const,
          priority: 0.7,
        });
      }
    }
  } catch (_) {}

  // ── READERS / SEED AI AVATARS (1 132 — low crawl priority) ──────
  try {
    const { data: viewers } = await supabase
      .from("user_proxy_avatars")
      .select("username, updated_at")
      .eq("is_seed_ai", true)
      .limit(2_000);

    if (viewers) {
      for (const viewer of viewers) {
        entries.push({
          url: `${baseUrl}/viewer/${viewer.username}`,
          lastModified: viewer.updated_at
            ? new Date(viewer.updated_at)
            : now,
          changeFrequency: "monthly" as const,
          priority: 0.3,
        });
      }
    }
  } catch (_) {}

  // ── GENRES (split comma-separated) ────────────────────────────────
  try {
    const { data: genreRows } = await supabase
      .from("movies")
      .select("genre");

    if (genreRows) {
      const raw = genreRows
        .map((g) => g.genre)
        .filter(Boolean)
        .flatMap((g) => g.split(",").map((t: string) => t.trim()))
        .filter(Boolean);
      const uniqueGenres = [...new Set(raw)];
      for (const genre of uniqueGenres) {
        entries.push({
          url: `${baseUrl}/genre/${slugify(genre)}`,
          lastModified: now,
          changeFrequency: "daily" as const,
          priority: 0.6,
        });
      }
    }
  } catch (_) {}

  // ── ARTICLES (symposium SEO articles — highest P-SEO value) ──────
  try {
    const { data: articleSessions } = await supabase
      .from("sessions")
      .select("id, title, updated_at")
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(500);

    if (articleSessions) {
      for (const sess of articleSessions) {
        entries.push({
          url: `${baseUrl}/articles/${sess.id}`,
          lastModified: sess.updated_at
            ? new Date(sess.updated_at)
            : now,
          changeFrequency: "weekly" as const,
          priority: 0.8,
        });
      }
    }
  } catch (_) {}

  // ── CATEGORIES ────────────────────────────────────────────────────
  const categories = [
    "systemic",
    "philosophical",
    "social-cultural",
    "cinematic-psychoanalytic",
    "seed",
  ];
  for (const cat of categories) {
    entries.push({
      url: `${baseUrl}/category/${cat}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.5,
    });
  }

  // ── BEST BY YEAR (2017–2026) ──────────────────────────────────────
  for (let year = 2017; year <= 2026; year++) {
    entries.push({
      url: `${baseUrl}/best/${year}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    });
  }

  return entries;
}
