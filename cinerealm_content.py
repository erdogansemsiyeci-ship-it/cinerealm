#!/usr/bin/env python3
"""
CineRealm — Autonomous Cinema Content Curator
==============================================
Daily multi-channel content for Instagram, X/Twitter, YouTube.
Uses Gemini 2.5 Flash for cinematic editorial content.

Output: JSON → POST to cinerealm.app/api/content-webhook
Usage:  python3 cinerealm_content.py [--post] [--theme "..."]
Env:    GEMINI_API_KEY
"""

import os, sys, json, random, re, argparse
from datetime import datetime, timezone
import requests

GEMINI_KEY = os.environ.get("GEMINI_API_KEY", "")
GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions"
MODEL = "gemini-2.5-flash"
WEBHOOK_URL = os.environ.get("CINE_WEBHOOK_URL", "") or "https://cinerealm.app/api/content-webhook"

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

You will receive a THEME (Director — Film / Concept).
Generate multi-channel content in the EXACT JSON format specified.

CRITICAL RULES:
1. Instagram text: 3 paragraphs. Cinematic, philosophical, references specific scenes or visual choices.
2. X/Twitter: 3-tweet thread. Tweet 1 = hook, Tweet 2 = striking insight or quote, Tweet 3 = question to engage cinephiles.
3. YouTube Shorts: 10-15s voiceover. Evocative, mysterious tone. Pull the viewer into the film's world.
4. Visual prompt: Director's visual style, specific color palette, aspect ratio, lighting style. Must feel like the film.
5. NOT generic — reference specific techniques (dutch angles, long takes, color grading, practical effects).
6. Hashtags: max 4, cinema-focused.

CRITICAL: All string values on single line. Escape newlines as \\n. Return ONLY the JSON object, nothing else.

{
  "realm": "cine",
  "tema": "Director — Film / Theme",
  "instagram": {
    "gorsel_istemi": "Cinematic visual prompt...",
    "metin": "3 paragraphs of analysis...",
    "hashtags": ["#cinerealm", ...]
  },
  "x_twitter": {
    "tweet_zinciri": ["tweet 1", "tweet 2", "tweet 3"]
  },
  "youtube": {
    "video_turu": "shorts",
    "seslendirme_metni": "Voiceover text...",
    "video_basligi": "Title #shorts",
    "aciklama": "Description..."
  }
}"""


def call_gemini(system: str, prompt: str, max_tokens: int = 2000) -> str:
    resp = requests.post(GEMINI_URL, headers={
        "Authorization": f"Bearer {GEMINI_KEY}",
        "Content-Type": "application/json",
    }, json={
        "model": MODEL, "temperature": 0.9, "max_tokens": max_tokens,
        "messages": [{"role": "system", "content": system}, {"role": "user", "content": prompt}],
    }, timeout=90)
    resp.raise_for_status()
    return resp.json()["choices"][0]["message"]["content"]


def main():
    parser = argparse.ArgumentParser(description="CineRealm Content Curator")
    parser.add_argument("--post", action="store_true")
    parser.add_argument("--theme", type=str)
    args = parser.parse_args()

    theme = args.theme or random.choice(THEME_POOL)
    print(f"🎬 THEME: {theme}")

    raw = call_gemini(CONTENT_PROMPT, f"THEME: {theme}")
    raw = raw.strip()
    if raw.startswith("```"):
        raw = raw.split("\n", 1)[1] if "\n" in raw else raw[3:]
        if raw.rstrip().endswith("```"): raw = raw.rstrip()[:-3]
    raw = raw.strip()

    if "{" in raw and "}" in raw:
        raw = raw[raw.index("{"):raw.rindex("}") + 1]
    else:
        print("❌ No JSON in response"); sys.exit(1)

    raw = re.sub(r',\s*}', '}', raw)
    raw = re.sub(r',\s*]', ']', raw)
    raw = re.sub(r'(?<!\\)\n', '\\n', raw)

    content = json.loads(raw)
    content["tema"] = theme
    content["realm"] = "cine"
    content["generated_at"] = datetime.now(timezone.utc).isoformat()

    print(json.dumps(content, indent=2, ensure_ascii=False))

    if args.post:
        print(f"\n📤 POSTing to {WEBHOOK_URL}...")
        try:
            resp = requests.post(WEBHOOK_URL, json=content, timeout=30)
            print(f"   HTTP {resp.status_code} — {resp.text[:100]}")
        except Exception as e:
            print(f"   ❌ {e}")

    print(f"\n✅ {theme}")


if __name__ == "__main__":
    main()
