#!/usr/bin/env python3
"""
CineRealm TMDB Ingestion — Cold Start Script
=============================================
Fetches 1,000 movies across 5 cinematic categories from TMDB,
extracts director + cinematographer, and bulk inserts into Supabase.

Categories (200 each):
  1. Commercial Blockbusters — high revenue, wide appeal
  2. Auteur Masterpieces   — high ratings, acclaimed directors
  3. Cult Classics         — older niche films with devoted followings
  4. Box Office Flops      — high budget, low revenue
  5. Hidden Indie Gems     — low budget, high ratings, low vote count

Usage:  python3 tmdb_ingestion.py
Env:    TMDB_API_KEY, CINE_SUPABASE_URL, CINE_SUPABASE_KEY
"""

import os
import sys
import time
import json
import hashlib
from datetime import datetime
from typing import Optional

import requests
from dotenv import load_dotenv
from supabase import create_client, Client

# ── Load environment ──────────────────────────────────────────────
load_dotenv()

TMDB_API_KEY = os.getenv("TMDB_API_KEY", "6eefa43d625870fb1362f551873649cc")
SUPABASE_URL = os.getenv("CINE_SUPABASE_URL", "https://ucnylwlyfsbcfdntsgdq.supabase.co")
SUPABASE_KEY = os.getenv("CINE_SUPABASE_KEY",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9."
    "eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjbnlsd2x5ZnNiY2ZkbnRzZ2RxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTQ2ODU0OSwiZXhwIjoyMDk3MDQ0NTQ5fQ."
    "ApwvbKI1_sJ9B1sN5bmzQPhOgUr-f8o76ft9ySULN9Q"
)

TMDB_BASE = "https://api.themoviedb.org/3"
TMDB_IMAGE = "https://image.tmdb.org/t/p/w500"
REQUEST_DELAY = 0.26  # ~4 req/s to stay under TMDB rate limit (40/10s)
MAX_RETRIES = 5

# ── Supabase client ───────────────────────────────────────────────
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


# ═══════════════════════════════════════════════════════════════════
# CATEGORY DEFINITIONS
# ═══════════════════════════════════════════════════════════════════

CATEGORIES = [
    {
        "name": "Commercial Blockbusters",
        "count": 200,
        "params": {
            "sort_by": "revenue.desc",
            "vote_count.gte": 1000,
            "vote_average.gte": 5.0,
            "with_original_language": "en",
            "region": "US",
            "release_date.gte": "1990-01-01",
        },
    },
    {
        "name": "Auteur Masterpieces",
        "count": 200,
        "params": {
            "sort_by": "vote_average.desc",
            "vote_count.gte": 500,
            "vote_average.gte": 7.5,
            "with_original_language": "en",
            "release_date.gte": "1960-01-01",
        },
    },
    {
        "name": "Cult Classics",
        "count": 200,
        "params": {
            "sort_by": "popularity.desc",
            "vote_count.gte": 200,
            "vote_average.gte": 6.0,
            "release_date.lte": "2005-12-31",
            "release_date.gte": "1950-01-01",
            "with_genres": "27,53,9648,878",  # Horror, Thriller, Mystery, Sci-Fi
        },
    },
    {
        "name": "Box Office Flops",
        "count": 200,
        "params": {
            "sort_by": "revenue.asc",
            "vote_count.gte": 200,
            "with_original_language": "en",
            "release_date.gte": "1990-01-01",
            "with_runtime.gte": 80,
            "vote_average.lte": 6.0,
        },
    },
    {
        "name": "Hidden Indie Gems",
        "count": 200,
        "params": {
            "sort_by": "vote_average.desc",
            "vote_count.gte": 30,
            "vote_count.lte": 500,
            "vote_average.gte": 7.0,
            "with_original_language": "en",
            "release_date.gte": "1980-01-01",
            "with_runtime.gte": 70,
        },
    },
]


# ═══════════════════════════════════════════════════════════════════
# HELPERS
# ═══════════════════════════════════════════════════════════════════

def tmdb_request(endpoint: str, params: dict) -> dict:
    """Make a rate-limited, retried TMDB API v3 request."""
    url = f"{TMDB_BASE}{endpoint}"
    params["api_key"] = TMDB_API_KEY
    params["language"] = "en-US"

    for attempt in range(MAX_RETRIES):
        try:
            resp = requests.get(url, params=params, timeout=15)
            if resp.status_code == 429:
                retry_after = int(resp.headers.get("Retry-After", 2))
                print(f"  ⚠ Rate limited. Waiting {retry_after}s...")
                time.sleep(retry_after + 1)
                continue
            if resp.status_code == 404:
                return {}
            resp.raise_for_status()
            time.sleep(REQUEST_DELAY)
            return resp.json()
        except requests.RequestException as e:
            wait = 2 ** attempt
            print(f"  ⚠ Request error (attempt {attempt+1}/{MAX_RETRIES}): {e}. Retrying in {wait}s...")
            time.sleep(wait)
    print(f"  ✗ Failed after {MAX_RETRIES} attempts: {endpoint}")
    return {}


def fetch_movie_ids(category: dict, existing_ids: set) -> list[int]:
    """Discover movie IDs for a category, skipping duplicates."""
    ids = []
    page = 1
    max_pages = 20  # 20 movies/page * 20 pages = 400 max

    while len(ids) < category["count"] and page <= max_pages:
        params = dict(category["params"])
        params["page"] = page
        data = tmdb_request("/discover/movie", params)
        results = data.get("results", [])

        if not results:
            print(f"    No more results at page {page}")
            break

        new_count = 0
        for movie in results:
            tid = movie["id"]
            if tid not in existing_ids:
                ids.append(tid)
                existing_ids.add(tid)
                new_count += 1
                if len(ids) >= category["count"]:
                    break

        print(f"    Page {page}: +{new_count} new  (total: {len(ids)}/{category['count']})")
        page += 1

    return ids


def fetch_credits(movie_id: int) -> tuple[Optional[str], Optional[str]]:
    """Fetch director and cinematographer from /movie/{id}/credits."""
    data = tmdb_request(f"/movie/{movie_id}/credits", {})
    crew = data.get("crew", [])

    director = None
    cinematographer = None

    for member in crew:
        job = member.get("job", "")
        if job == "Director" and director is None:
            director = member.get("name")
        elif job in ("Director of Photography", "Cinematographer") and cinematographer is None:
            cinematographer = member.get("name")
        if director and cinematographer:
            break

    return director, cinematographer


def safe_get(obj: dict, *keys, default=None):
    """Safely get nested keys from a dict."""
    for key in keys:
        if isinstance(obj, dict):
            obj = obj.get(key, default)
        else:
            return default
    return obj if obj is not None else default


def build_slug(title: str, year: Optional[int]) -> str:
    """Build URL-friendly slug from title + year."""
    import re
    base = title.lower().strip()
    base = re.sub(r'[^a-z0-9\s-]', '', base)
    base = re.sub(r'[\s]+', '-', base)
    base = base[:80].strip('-')
    if year:
        return f"{base}-{year}"
    return base


def get_existing_tmdb_ids() -> set:
    """Fetch all existing tmdb_ids from Supabase as a dedup set."""
    ids = set()
    offset = 0
    limit = 1000
    while True:
        resp = supabase.table("movies").select("tmdb_id").range(offset, offset + limit - 1).execute()
        rows = resp.data or []
        if not rows:
            break
        for row in rows:
            if row.get("tmdb_id"):
                ids.add(int(row["tmdb_id"]))
        offset += limit
        if len(rows) < limit:
            break
    return ids


# ═══════════════════════════════════════════════════════════════════
# MAIN INGESTION
# ═══════════════════════════════════════════════════════════════════

def main():
    print("=" * 60)
    print("  CineRealm TMDB Ingestion — Cold Start")
    print(f"  Started: {datetime.now().isoformat()}")
    print("=" * 60)

    # ── Load existing IDs (blacklist) ─────────────────────────
    print("\n📡 Fetching existing tmdb_ids from Supabase...")
    existing_ids = get_existing_tmdb_ids()
    print(f"   Already in DB: {len(existing_ids)} movies")

    total_inserted = 0
    all_movies = []  # batch buffer

    for cat in CATEGORIES:
        print(f"\n{'─'*50}")
        print(f"🎬 {cat['name']} — target: {cat['count']}")
        print(f"{'─'*50}")

        movie_ids = fetch_movie_ids(cat, existing_ids)
        print(f"  → Discovered {len(movie_ids)} new movie IDs")

        for i, mid in enumerate(movie_ids):
            details = tmdb_request(f"/movie/{mid}", {})
            if not details:
                continue

            # Skip adult content
            if details.get("adult"):
                continue

            director, cinematographer = fetch_credits(mid)

            # Extract genre list
            genres = details.get("genres", [])
            genre_str = ", ".join(g["name"] for g in genres) if genres else None

            # Extract country
            countries = details.get("production_countries", [])
            country = countries[0]["iso_3166_1"] if countries else None

            # Build poster/backdrop URLs
            poster = None
            if details.get("poster_path"):
                poster = f"{TMDB_IMAGE}{details['poster_path']}"
            backdrop = None
            if details.get("backdrop_path"):
                backdrop = f"{TMDB_IMAGE}{details['backdrop_path']}"

            year = None
            release_date = details.get("release_date", "")
            if release_date and len(release_date) >= 4:
                year = int(release_date[:4])

            movie_row = {
                "title": details.get("title", "Unknown"),
                "director": director,
                "year": year,
                "genre": genre_str,
                "description": details.get("overview"),
                "poster_url": poster,
                "backdrop_url": backdrop,
                "tmdb_id": mid,
                "imdb_id": details.get("imdb_id"),
                "runtime": details.get("runtime"),
                "language": details.get("original_language", "en"),
                "country": country,
                "rating": safe_get(details, "vote_average"),
                "tagline": details.get("tagline"),
                "is_published": True,
                "slug": build_slug(details.get("title", ""), year),
            }

            all_movies.append(movie_row)

            # Insert in batches of 50
            if len(all_movies) >= 50:
                inserted = bulk_insert(all_movies)
                total_inserted += inserted
                all_movies = []
                print(f"    📦 Batch insert: {inserted} rows  (total: {total_inserted})")

            if (i + 1) % 25 == 0:
                print(f"    ... {i+1}/{len(movie_ids)} processed")

    # ── Final batch ───────────────────────────────────────────
    if all_movies:
        inserted = bulk_insert(all_movies)
        total_inserted += inserted
        print(f"    📦 Final batch: {inserted} rows  (total: {total_inserted})")

    print(f"\n{'='*60}")
    print(f"  ✅ Ingestion complete!")
    print(f"  Total inserted: {total_inserted} movies")
    print(f"  Finished: {datetime.now().isoformat()}")
    print(f"{'='*60}")


def bulk_insert(movies: list[dict]) -> int:
    """Insert movies into Supabase, skip on slug conflict."""
    try:
        # Filter out records with duplicate slugs in the batch itself
        seen_slugs = set()
        unique = []
        for m in movies:
            slug = m.get("slug", "")
            if slug and slug not in seen_slugs:
                seen_slugs.add(slug)
                unique.append(m)

        if not unique:
            return 0

        resp = supabase.table("movies").upsert(
            unique,
            on_conflict="slug",
            ignore_duplicates=True,
        ).execute()

        if hasattr(resp, 'error') and resp.error:
            print(f"    ⚠ Upsert error: {resp.error}")
            return 0

        return len(resp.data or [])
    except Exception as e:
        print(f"    ⚠ Bulk insert exception: {e}")
        # Fall back to individual inserts
        inserted = 0
        for m in movies:
            try:
                supabase.table("movies").upsert(
                    m, on_conflict="slug", ignore_duplicates=True
                ).execute()
                inserted += 1
            except Exception:
                pass
        return inserted


if __name__ == "__main__":
    main()
