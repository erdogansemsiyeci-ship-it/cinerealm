#!/usr/bin/env python3
"""
CineRealm — Cinema Content Curator v2
Direct Supabase insert + optional Replicate image generation.
Usage: python3 cinerealm_content.py [--post] [--theme "..."] [--with-images]
"""

import os, sys, json, random, re, argparse, time
from datetime import datetime, timezone
import requests
from supabase import create_client

# ═══════════════════════════════════════════════════════════════
GEMINI_KEY = os.environ.get("GEMINI_API_KEY", "")
GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions"
MODEL = "gemini-2.5-flash"
REPLICATE_TOKEN = os.environ.get("REPLICATE_API_TOKEN", "")

SUPABASE_URL = "https://ucnylwlyfsbcfdntsgdq.supabase.co"
SUPABASE_KEY = os.environ.get("CINE_SUPABASE_KEY",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9."
    "eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjbnlsd2x5ZnNiY2ZkbnRzZ2RxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTQ2ODU0OSwiZXhwIjoyMDk3MDQ0NTQ5fQ."
    "ApwvbKI1_sJ9B1sN5bmzQPhOgUr-f8o76ft9ySULN9Q")
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

THEME_POOL = [
    "David Fincher — Fight Club / Consumerism & Identity",
    "Christopher Nolan — Inception / Dreams & Reality",
    "Stanley Kubrick — 2001: A Space Odyssey / Evolution & AI",
    "Quentin Tarantino — Pulp Fiction / Nonlinear Storytelling",
    "David Lynch — Mulholland Drive / Hollywood's Dark Underbelly",
    "Denis Villeneuve — Arrival / Language & Time",
    "Ridley Scott — Blade Runner / What It Means to Be Human",
    "Bong Joon-ho — Parasite / Class Warfare",
    "Akira Kurosawa — Rashomon / Truth & Perspective",
    "Andrei Tarkovsky — Stalker / Faith & The Unknown",
    "Martin Scorsese — Taxi Driver / Alienation & Violence",
    "Alfred Hitchcock — Vertigo / Obsession & Illusion",
    "Francis Ford Coppola — Apocalypse Now / Madness of War",
    "Hayao Miyazaki — Spirited Away / Coming of Age",
    "Wong Kar-wai — In the Mood for Love / Longing & Restraint",
    "Darren Aronofsky — Requiem for a Dream / Addiction's Spiral",
    "Coen Brothers — No Country for Old Men / Fate & Morality",
    "Paul Thomas Anderson — There Will Be Blood / Greed & Corruption",
    "Sergio Leone — The Good, the Bad and the Ugly / Mythmaking",
    "Spike Lee — Do the Right Thing / Racial Tension",
    "Federico Fellini — 8½ / Creative Block",
    "Ingmar Bergman — The Seventh Seal / Death & Faith",
    "Jean-Luc Godard — Breathless / Revolution in Form",
    "Park Chan-wook — Oldboy / Revenge & Time",
    "Jordan Peele — Get Out / Social Horror",
]

CONTENT_PROMPT = """You are the autonomous cinema curator for CineRealm, a prestigious global film platform.
Your tone: cinematic, intellectual, visually evocative, striking, culturally deep. Never generic.

CRITICAL RULES:
1. Instagram text: 3 paragraphs. Cinematic, philosophical, references specific scenes or visual choices.
2. X/Twitter: 3-tweet thread. Tweet 1 = hook, Tweet 2 = striking insight or quote, Tweet 3 = question to engage cinephiles.
3. YouTube Shorts: 10-15s voiceover. Evocative, mysterious tone.
4. Visual prompt: Director's visual style, specific color palette, aspect ratio, lighting style.
5. NOT generic — reference specific techniques (dutch angles, long takes, color grading).
6. Hashtags: max 4, cinema-focused.

CRITICAL: All strings on single line. Escape newlines as \\n. Return ONLY the JSON, nothing else.

{
  "realm": "cine",
  "tema": "Director — Film / Theme",
  "instagram": {
    "gorsel_istemi": "Cinematic visual prompt...",
    "metin": "3 paragraphs...",
    "hashtags": ["#cinerealm", ...]
  },
  "x_twitter": {
    "tweet_zinciri": ["tweet 1", "tweet 2", "tweet 3"]
  },
  "youtube": {
    "video_turu": "shorts",
    "seslendirme_metni": "Voiceover...",
    "video_basligi": "Title #shorts",
    "aciklama": "Description..."
  }
}"""


def call_gemini(system: str, prompt: str, max_tokens: int = 2000) -> str:
    resp = requests.post(GEMINI_URL,
        headers={"Authorization": f"Bearer {GEMINI_KEY}", "Content-Type": "application/json"},
        json={"model": MODEL, "temperature": 0.9, "max_tokens": max_tokens,
              "messages": [{"role": "system", "content": system}, {"role": "user", "content": prompt}]},
        timeout=90)
    resp.raise_for_status()
    return resp.json()["choices"][0]["message"]["content"]


def generate_image(prompt: str) -> str | None:
    """Generate image via Replicate Flux."""
    if not REPLICATE_TOKEN:
        return None
    try:
        resp = requests.post("https://api.replicate.com/v1/predictions",
            headers={"Authorization": f"Token {REPLICATE_TOKEN}", "Content-Type": "application/json"},
            json={"version": "black-forest-labs/flux-1.1-pro",
                  "input": {"prompt": prompt, "aspect_ratio": "1:1", "output_format": "webp", "output_quality": 85}},
            timeout=120)
        prediction = resp.json()
        # Poll until done
        for _ in range(20):
            time.sleep(2)
            r = requests.get(prediction["urls"]["get"],
                headers={"Authorization": f"Token {REPLICATE_TOKEN}"}, timeout=30)
            data = r.json()
            if data["status"] == "succeeded":
                return data["output"]
            elif data["status"] == "failed":
                return None
        return None
    except Exception as e:
        print(f"   ⚠ Image gen failed: {e}")
        return None


def main():
    parser = argparse.ArgumentParser(description="CineRealm Content Curator")
    parser.add_argument("--theme", type=str)
    parser.add_argument("--with-images", action="store_true")
    args = parser.parse_args()

    theme = args.theme or random.choice(THEME_POOL)
    print(f"🎬 {theme}")

    # ── Generate text content ───────────────────────────
    raw = call_gemini(CONTENT_PROMPT, f"THEME: {theme}")
    # Strip markdown fences
    raw = raw.strip()
    if raw.startswith("```"):
        raw = raw.split("\n", 1)[1] if "\n" in raw else raw[3:]
    if raw.rstrip().endswith("```"):
        raw = raw.rstrip()[:-3].strip()
    raw = raw.strip()
    if "{" not in raw:
        print(f"❌ No JSON: {raw[:200]}"); sys.exit(1)
    try:
        raw = raw[raw.index("{"):raw.rindex("}") + 1]
    except ValueError:
        raw = raw[raw.index("{"):] + "}"  # close unclosed JSON
    raw = re.sub(r',\s*}', '}', raw)
    raw = re.sub(r',\s*]', ']', raw)
    raw = re.sub(r'(?<!\\)\n', '\\n', raw)
    try:
        content = json.loads(raw)
    except json.JSONDecodeError as e:
        print(f"❌ JSON error pos {e.pos}: {e.msg}")
        print(f"   Near: {raw[max(0,e.pos-50):e.pos+50]}")
        sys.exit(1)
    content["tema"] = theme
    content["realm"] = "cine"
    content["generated_at"] = datetime.now(timezone.utc).isoformat()

    # ── Optional: generate image ────────────────────────
    if args.with_images:
        prompt = content["instagram"].get("gorsel_istemi", "")
        if prompt:
            print("   🎨 Generating image...")
            img_url = generate_image(prompt)
            content["instagram"]["image_url"] = img_url
            print(f"   {'✅' if img_url else '❌'} Image: {img_url[:60] if img_url else 'failed'}")

    # ── Direct Supabase insert ──────────────────────────
    try:
        supabase.table("content_log").insert(content).execute()
        print("   💾 Supabase ✓")
    except Exception as e:
        print(f"   ❌ Supabase: {e}")
        sys.exit(1)

    print(json.dumps(content, indent=2, ensure_ascii=False))
    print(f"\n✅ {theme}")


if __name__ == "__main__":
    main()
