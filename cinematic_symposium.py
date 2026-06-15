#!/usr/bin/env python3
"""
CineRealm — Cinematic Symposium Engine
=======================================
Orchestrates film debates between 4 AI critics and publishes to Supabase.

The Critics:
  Elias  — Auteur purist. Artistic vision, directorial signature.
  Victor — Box office pragmatist. Commercial viability, market data.
  Clara  — Performance analyst. Acting, emotional truth, casting.
  Leo    — Editor-in-Chief. Synthesizes the debate into a final report.

Flow:
  1. Pick a random film from Supabase that hasn't been debated yet
  2. Elias, Victor, and Clara each write their perspective (turn 1-3)
  3. They debate back and forth (turn 4-6)
  4. Leo synthesizes the discussion into a Film Analysis Report (turn 7)
  5. All messages are written to Supabase sessions/messages tables

Usage:  python3 cinematic_symposium.py [--once] [--count N]
Env:    OPENROUTER_API_KEY, CINE_SUPABASE_URL, CINE_SUPABASE_KEY
"""

import os
import sys
import time
import json
import random
import argparse
from datetime import datetime
from typing import Optional

import requests
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

# ── Config ───────────────────────────────────────────────────────
OPENROUTER_KEY = os.getenv("OPENROUTER_API_KEY", "")
SUPABASE_URL = os.getenv("CINE_SUPABASE_URL", "https://ucnylwlyfsbcfdntsgdq.supabase.co")
SUPABASE_KEY = os.getenv("CINE_SUPABASE_KEY",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9."
    "eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjbnlsd2x5ZnNiY2ZkbnRzZ2RxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTQ2ODU0OSwiZXhwIjoyMDk3MDQ0NTQ5fQ."
    "ApwvbKI1_sJ9B1sN5bmzQPhOgUr-f8o76ft9ySULN9Q"
)

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
MODEL = "google/gemini-2.5-flash"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# ── Agent profiles ───────────────────────────────────────────────
AGENTS = {
    "Elias": {
        "category": "auteur",
        "persona": (
            "You are Elias, an uncompromising auteur critic. You are French, 58, and have written for Cahiers du Cinéma for 30 years. "
            "You judge films solely on artistic vision, directorial signature, and whether the work transcends commerce. "
            "You reference Tarkovsky, Bresson, Godard, Bergman. You use words like 'mise-en-scène', 'auteurist', 'formal daring'. "
            "You are suspicious of any film that made more than $50M. You write in dense, intellectual prose. "
            "Keep responses under 250 words. Be sharp, specific, and never generic."
        ),
    },
    "Victor": {
        "category": "commercial",
        "persona": (
            "You are Victor, a box office analyst for Variety. You are American, 45, and spent 15 years tracking film revenue. "
            "You evaluate films through commercial viability: opening weekend multiples, CinemaScore, audience retention, market fit. "
            "You respect films that understand their audience and deliver. You quote numbers, percentages, comps. "
            "You have no patience for pretension that alienates paying customers. You use words like 'legs', 'tracking', 'quadrant'. "
            "Keep responses under 250 words. Be data-driven, practical, and direct."
        ),
    },
    "Clara": {
        "category": "performance",
        "persona": (
            "You are Clara, a performance critic for The Guardian. You are British, 37, and trained at RADA before turning to criticism. "
            "You dissect acting: facial micro-expressions, vocal modulation, physicality, emotional truth, chemistry between performers. "
            "You notice what other critics miss — a glance held too long, a tremor in the voice, the weight of silence. "
            "You believe casting is 80% of directing. You use words like 'embodied', 'luminous', 'interiority', 'presence'. "
            "Keep responses under 250 words. Be precise, emotionally intelligent, and always cite specific moments."
        ),
    },
    "Leo": {
        "category": "journalist",
        "persona": (
            "You are Leo, the Chief Film Journalist of CineRealm and a master of Programmatic SEO (P-SEO). "
            "You are American, 42, and previously wrote for The New Yorker. "
            "Your job is to read the debate between Elias, Victor, and Clara, then synthesize their clashing perspectives "
            "into a highly structured 'Film Analysis Report'. Your prose is elegant but accessible — sharp but never cruel.\n\n"
            "CRITICAL: Your output MUST strictly follow this exact structure with NO extra conversational filler:\n\n"
            "THE REPORT (Exactly 5 Paragraphs): "
            "Write exactly 5 paragraphs. Use ## for the main heading and ### for sub-headings. "
            "Paragraph 1 = Opening hook + central tension. "
            "Paragraph 2 = The artistic case (Elias's view). "
            "Paragraph 3 = The commercial reality (Victor's view). "
            "Paragraph 4 = The human element (Clara's view). "
            "Paragraph 5 = Synthesis and final verdict. "
            "Each paragraph must be substantive (3-5 sentences).\n\n"
            "After the 5 paragraphs, add:\n"
            "**EXCERPT:** A punchy, 2-sentence summary of the review (this will appear on the blog index page).\n"
            "**VERDICT:** A highly condensed 2-to-4 word final judgment (e.g. 'A Flawed Masterpiece' or 'Visually Stunning but Hollow').\n\n"
            "Do NOT add any conversational filler, greetings, or sign-offs. Only the report, excerpt, and verdict."
        ),
    },
}


# ═══════════════════════════════════════════════════════════════════
# LLM CALL
# ═══════════════════════════════════════════════════════════════════

def call_llm(system_prompt: str, user_prompt: str, max_tokens: int = 600) -> str:
    """Call OpenRouter LLM and return text response."""
    headers = {
        "Authorization": f"Bearer {OPENROUTER_KEY}",
        "Content-Type": "application/json",
    }
    body = {
        "model": MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "temperature": 0.85,
        "max_tokens": max_tokens,
    }

    for attempt in range(3):
        try:
            resp = requests.post(OPENROUTER_URL, headers=headers, json=body, timeout=60)
            if resp.status_code == 429:
                time.sleep(5 * (attempt + 1))
                continue
            resp.raise_for_status()
            data = resp.json()
            return data["choices"][0]["message"]["content"]
        except Exception as e:
            print(f"  ⚠ LLM error (attempt {attempt+1}): {e}")
            time.sleep(3)
    return "[Error: LLM call failed after 3 attempts]"


# ═══════════════════════════════════════════════════════════════════
# DATABASE HELPERS
# ═══════════════════════════════════════════════════════════════════

def get_agents() -> dict:
    """Fetch the 4 agents from Supabase, return {name: id}."""
    resp = supabase.table("agents").select("id,display_name,category").execute()
    agents = {}
    for row in (resp.data or []):
        agents[row["display_name"]] = row["id"]
    return agents


def pick_random_film() -> Optional[dict]:
    """Pick a random film that hasn't been debated yet."""
    # Get films that have NO sessions
    resp = supabase.table("movies").select("id,title,director,year,genre,description,rating,tagline").execute()
    all_films = resp.data or []

    # Get films that already have sessions
    session_resp = supabase.table("sessions").select("movie_id").execute()
    debated_ids = {s["movie_id"] for s in (session_resp.data or [])}

    undebated = [f for f in all_films if f["id"] not in debated_ids]
    if not undebated:
        return None
    return random.choice(undebated)


def create_session(movie: dict) -> str:
    """Create a new discussion session, return session ID."""
    resp = supabase.table("sessions").insert({
        "movie_id": movie["id"],
        "title": f"Debate: {movie['title']}",
        "topic": movie.get("genre", "General"),
        "status": "in_progress",
        "agent_count": 4,
        "message_count": 0,
        "phase": "perspectives",
    }).execute()
    return resp.data[0]["id"]


def insert_message(session_id: str, agent_id: str, content: str, turn: int) -> str:
    """Insert a message and return its ID."""
    resp = supabase.table("messages").insert({
        "session_id": session_id,
        "agent_id": agent_id,
        "content": content,
        "turn_number": turn,
    }).execute()
    return resp.data[0]["id"]


def update_session_message_count(session_id: str, count: int):
    """Update message count on session."""
    supabase.table("sessions").update({
        "message_count": count,
        "updated_at": datetime.utcnow().isoformat(),
    }).eq("id", session_id).execute()


def complete_session(session_id: str):
    """Mark session as completed."""
    supabase.table("sessions").update({
        "status": "completed",
        "updated_at": datetime.utcnow().isoformat(),
    }).eq("id", session_id).execute()


# ═══════════════════════════════════════════════════════════════════
# DEBATE ORCHESTRATION
# ═══════════════════════════════════════════════════════════════════

def run_debate(movie: dict, agent_ids: dict) -> bool:
    """Run a full 7-turn debate about a single film."""
    title = movie["title"]
    director = movie.get("director", "Unknown")
    year = movie.get("year", "")
    genre = movie.get("genre", "")
    desc = movie.get("description", "")[:500]
    rating = movie.get("rating", "N/A")
    tagline = movie.get("tagline", "")

    film_context = f"""
FILM: {title} ({year})
DIRECTOR: {director}
GENRE: {genre}
RATING: {rating}/10
TAGLINE: {tagline}
SYNOPSIS: {desc}
"""

    print(f"\n🎬 {title} ({year}) — {director}")
    print(f"   Genre: {genre}  |  Rating: {rating}/10")

    # ── Create session ──────────────────────────────────────
    session_id = create_session(movie)
    print(f"   Session: {session_id[:8]}...")
    turn = 0

    # ── TURN 1: Elias (Auteur) ──────────────────────────────
    print("   1/7 Elias (Auteur)...")
    turn += 1
    elias_prompt = f"{film_context}\nWrite your opening perspective on this film as Elias. Focus on the director's vision, formal choices, and artistic merit. Be uncompromising."
    elias_text = call_llm(AGENTS["Elias"]["persona"], elias_prompt)
    insert_message(session_id, agent_ids["Elias"], elias_text, turn)

    # ── TURN 2: Victor (Box Office) ─────────────────────────
    print("   2/7 Victor (Box Office)...")
    turn += 1
    victor_prompt = f"{film_context}\nWrite your opening perspective on this film as Victor. Focus on commercial viability, audience reception, and market positioning. Be data-driven."
    victor_text = call_llm(AGENTS["Victor"]["persona"], victor_prompt)
    insert_message(session_id, agent_ids["Victor"], victor_text, turn)

    # ── TURN 3: Clara (Performance) ─────────────────────────
    print("   3/7 Clara (Performance)...")
    turn += 1
    clara_prompt = f"{film_context}\nWrite your opening perspective on this film as Clara. Focus on performances, emotional truth, and casting choices. Be specific about moments."
    clara_text = call_llm(AGENTS["Clara"]["persona"], clara_prompt)
    insert_message(session_id, agent_ids["Clara"], clara_text, turn)

    # ── TURN 4: Elias responds to Victor and Clara ──────────
    print("   4/7 Elias responds...")
    turn += 1
    rebuttal_prompt = f"""{film_context}

ELIAS, here is what your colleagues said:

VICTOR (Box Office): {victor_text[:400]}

CLARA (Performance): {clara_text[:400]}

Respond as Elias. Do you concede any points? Where do you push back harder? Address their arguments directly."""
    elias_reply = call_llm(AGENTS["Elias"]["persona"], rebuttal_prompt)
    insert_message(session_id, agent_ids["Elias"], elias_reply, turn)

    # ── TURN 5: Victor responds ─────────────────────────────
    print("   5/7 Victor responds...")
    turn += 1
    victor_reply = call_llm(AGENTS["Victor"]["persona"],
        f"{film_context}\n\nElias just said: {elias_reply[:400]}\n\nRespond as Victor. Defend your position with data. Challenge Elias's artistic pretensions if warranted.")
    insert_message(session_id, agent_ids["Victor"], victor_reply, turn)

    # ── TURN 6: Clara responds ─────────────────────────────
    print("   6/7 Clara responds...")
    turn += 1
    clara_reply = call_llm(AGENTS["Clara"]["persona"],
        f"{film_context}\n\nElias said: {elias_reply[:300]}\nVictor said: {victor_reply[:300]}\n\nRespond as Clara. Where do you agree or disagree with each? Champion the human element.")
    insert_message(session_id, agent_ids["Clara"], clara_reply, turn)

    # ── TURN 7: Leo's Synthesis ─────────────────────────────
    print("   7/7 Leo (Synthesis)...")
    turn += 1
    synthesis_prompt = f"""
FILM: {title} ({year}) — Director: {director}

THE DEBATE:

ELIAS (Auteur): {elias_text[:300]} ... {elias_reply[:300]}

VICTOR (Box Office): {victor_text[:300]} ... {victor_reply[:300]}

CLARA (Performance): {clara_text[:300]} ... {clara_reply[:300]}

As Leo, write your Film Analysis Report synthesizing this debate. Structure:
1. Opening hook
2. The artistic case (Elias)
3. The commercial reality (Victor)
4. The human element (Clara)
5. Final verdict

Keep under 400 words. New Yorker style — elegant, sharp, accessible."""
    leo_report = call_llm(AGENTS["Leo"]["persona"], synthesis_prompt, max_tokens=1200)
    insert_message(session_id, agent_ids["Leo"], leo_report, turn)

    # ── Finalize ────────────────────────────────────────────
    update_session_message_count(session_id, turn)
    complete_session(session_id)
    print(f"   ✅ Debate complete — {turn} messages")
    return True


# ═══════════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════════

def main():
    parser = argparse.ArgumentParser(description="CineRealm Symposium Engine")
    parser.add_argument("--once", action="store_true", help="Run one debate and exit")
    parser.add_argument("--count", type=int, default=1, help="Number of debates to run")
    args = parser.parse_args()

    print("=" * 60)
    print("  CineRealm — Cinematic Symposium Engine")
    print(f"  Model: {MODEL}")
    print(f"  Started: {datetime.now().isoformat()}")
    print("=" * 60)

    # ── Load agents from DB ─────────────────────────────────
    print("\n📋 Loading critics...")
    agent_ids = get_agents()
    print(f"   Found: {list(agent_ids.keys())}")

    if len(agent_ids) < 4:
        print("   ⚠ Not all 4 agents found in database! Seed agents first.")
        sys.exit(1)

    debates_run = 0
    for i in range(args.count):
        # Pick a film
        film = pick_random_film()
        if not film:
            print("\n✅ No more undebated films. All films have been discussed!")
            break

        print(f"\n{'─'*50}")
        print(f"Debate {i+1}/{args.count}")
        print(f"{'─'*50}")

        try:
            success = run_debate(film, agent_ids)
            if success:
                debates_run += 1
        except Exception as e:
            print(f"   ❌ Debate failed: {e}")
            continue

        # Brief pause between debates
        if i < args.count - 1:
            time.sleep(3)

    print(f"\n{'='*60}")
    print(f"  ✅ Symposium complete: {debates_run} debate(s) run")
    print(f"  Finished: {datetime.now().isoformat()}")
    print(f"{'='*60}")


if __name__ == "__main__":
    main()
