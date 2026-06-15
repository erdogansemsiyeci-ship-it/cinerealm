import type { MetadataRoute } from "next";
import { createPublicClient } from "@/lib/supabase/public";

export const dynamic = "force-dynamic";
export const revalidate = 3600; // rebuild hourly

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createPublicClient();
  const baseUrl = "https://cinerealm.app";
  const now = new Date();

  const entries: MetadataRoute.Sitemap = [];

  // ── HIGH-PRIORITY STATIC ──────────────────────────────────────────
  const staticHigh = [
    { path: "", changefreq: "hourly" as const, priority: 1.0 },
    { path: "/movies", changefreq: "hourly" as const, priority: 0.9 },
    { path: "/discuss", changefreq: "hourly" as const, priority: 0.9 },
    { path: "/agents", changefreq: "daily" as const, priority: 0.7 },
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
  ];
  for (const s of staticMid) {
    entries.push({
      url: `${baseUrl}${s.path}`,
      lastModified: now,
      changeFrequency: s.changefreq,
      priority: s.priority,
    });
  }

  // ── MOVIES (highest crawl budget) ─────────────────────────────────
  try {
    const { data: movies } = await supabase
      .from("movies")
      .select("title, slug, updated_at")
      .eq("is_published", true)
      .limit(2000);

    if (movies) {
      for (const movie of movies) {
        const urlSlug = movie.slug || slugify(movie.title);
        entries.push({
          url: `${baseUrl}/movie/${urlSlug}`,
          lastModified: movie.updated_at
            ? new Date(movie.updated_at)
            : now,
          changeFrequency: "weekly" as const,
          priority: 0.9,
        });
      }
    }
  } catch (_) {}

  // ── AGENTS — the 4 critics ────────────────────────────────────────
  try {
    const { data: agents } = await supabase
      .from("agents")
      .select("display_name, updated_at")
      .eq("is_active", true)
      .limit(50);

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

  // ── GENRES (split comma-separated) ────────────────────────────────
  try {
    const { data: genreRows } = await supabase
      .from("movies")
      .select("genre");

    if (genreRows) {
      const raw = genreRows
        .map((g: any) => g.genre)
        .filter(Boolean)
        .flatMap((g: string) => g.split(",").map((t: string) => t.trim()))
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

  // ── COMPLETED DEBATES (highest P-SEO value) ───────────────────────
  try {
    const { data: completedSessions } = await supabase
      .from("sessions")
      .select("id, movie_id, updated_at")
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(500);

    if (completedSessions) {
      for (const sess of completedSessions) {
        entries.push({
          url: `${baseUrl}/articles/${sess.id}`,
          lastModified: sess.updated_at
            ? new Date(sess.updated_at)
            : now,
          changeFrequency: "weekly" as const,
          priority: 0.85,
        });
      }
    }
  } catch (_) {}

  return entries;
}
