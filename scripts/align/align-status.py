#!/usr/bin/env python3
"""
Real-time Alignment Status & Progress Monitor
Displays completion metrics across Graded Readers, Courses, and Podcasts.
"""

import sys
import os
import json
from pathlib import Path

BASE_DIR = Path("/home/dzgeek/Projects/english-learning-app")
READERS_EXTRACTED = BASE_DIR / "public/data/extracted/readers"
READERS_ALIGN = BASE_DIR / "public/data/alignments/readers"
COURSES_EXTRACTED = BASE_DIR / "public/data/extracted/shyna-courses"
COURSES_ALIGN = BASE_DIR / "public/data/alignments/courses"
PODCASTS_ALIGN = BASE_DIR / "public/data/alignments/podcasts"

def get_reader_status():
    total_chapters = 2736
    total_readers = 218
    aligned_chapters = 0
    aligned_words = 0
    aligned_readers = set()

    if READERS_ALIGN.exists():
        for r_dir in READERS_ALIGN.iterdir():
            if not r_dir.is_dir():
                continue
            for ch_file in r_dir.glob("ch-*.json"):
                try:
                    with open(ch_file, "r", encoding="utf-8") as f:
                        d = json.load(f)
                    if d.get("engine") == "faster-whisper-base.en":
                        aligned_chapters += 1
                        aligned_readers.add(r_dir.name)
                        for p in d.get("paragraphs", []):
                            aligned_words += len(p.get("words", []))
                except Exception:
                    pass

    return {
        "total_readers": total_readers,
        "aligned_readers_count": len(aligned_readers),
        "total_chapters": total_chapters,
        "aligned_chapters": aligned_chapters,
        "percent": (aligned_chapters / total_chapters * 100) if total_chapters else 0,
        "aligned_words": aligned_words
    }

def get_courses_status():
    total_lessons = 722
    total_courses = 16
    aligned_lessons = 0
    aligned_words = 0
    aligned_courses = set()

    if COURSES_ALIGN.exists():
        for c_dir in COURSES_ALIGN.iterdir():
            if not c_dir.is_dir():
                continue
            for l_file in c_dir.glob("lesson-*.json"):
                try:
                    with open(l_file, "r", encoding="utf-8") as f:
                        d = json.load(f)
                    if d.get("engine") == "faster-whisper-base.en":
                        aligned_lessons += 1
                        aligned_courses.add(c_dir.name)
                        for p in d.get("paragraphs", []):
                            aligned_words += len(p.get("words", []))
                except Exception:
                    pass

    return {
        "total_courses": total_courses,
        "aligned_courses_count": len(aligned_courses),
        "total_lessons": total_lessons,
        "aligned_lessons": aligned_lessons,
        "percent": (aligned_lessons / total_lessons * 100) if total_lessons else 0,
        "aligned_words": aligned_words
    }

def get_podcasts_status():
    total_episodes = 2279
    aligned_episodes = 0
    aligned_words = 0

    if PODCASTS_ALIGN.exists():
        for s_dir in PODCASTS_ALIGN.iterdir():
            if not s_dir.is_dir():
                continue
            for ep_file in s_dir.glob("*.json"):
                try:
                    with open(ep_file, "r", encoding="utf-8") as f:
                        d = json.load(f)
                    if d.get("engine") == "faster-whisper-base.en":
                        aligned_episodes += 1
                        for p in d.get("paragraphs", []):
                            aligned_words += len(p.get("words", []))
                except Exception:
                    pass

    return {
        "total_episodes": total_episodes,
        "aligned_episodes": aligned_episodes,
        "percent": (aligned_episodes / total_episodes * 100) if total_episodes else 0,
        "aligned_words": aligned_words
    }

def render_bar(pct: float, width: int = 28) -> str:
    filled = int(width * pct / 100.0)
    return "█" * filled + "░" * (width - filled)

def print_dashboard():
    r_stat = get_reader_status()
    c_stat = get_courses_status()
    p_stat = get_podcasts_status()

    total_units = r_stat["total_chapters"] + c_stat["total_lessons"] + p_stat["total_episodes"]
    total_aligned = r_stat["aligned_chapters"] + c_stat["aligned_lessons"] + p_stat["aligned_episodes"]
    total_words = r_stat["aligned_words"] + c_stat["aligned_words"] + p_stat["aligned_words"]
    overall_pct = (total_aligned / total_units * 100) if total_units else 0

    print("=========================================================================")
    print("      🎙️ UNIVERSAL ACOUSTIC ALIGNMENT DASHBOARD (Whisper Ground Truth)    ")
    print("=========================================================================")
    print(f"Overall Progress: [{render_bar(overall_pct)}] {overall_pct:.2f}% ({total_aligned}/{total_units} audio tracks)")
    print(f"Total Verbatim Spoken Words Aligned: {total_words:,} words\n")

    print(f"📚 Graded Readers (218 Books):")
    print(f"   Chapters: [{render_bar(r_stat['percent'])}] {r_stat['percent']:.2f}% ({r_stat['aligned_chapters']}/{r_stat['total_chapters']} chapters)")
    print(f"   Books fully/partially aligned: {r_stat['aligned_readers_count']}/{r_stat['total_readers']} readers")
    print(f"   Acoustic words: {r_stat['aligned_words']:,} words\n")

    print(f"🎓 Espresso English Courses (16 Courses):")
    print(f"   Lessons:  [{render_bar(c_stat['percent'])}] {c_stat['percent']:.2f}% ({c_stat['aligned_lessons']}/{c_stat['total_lessons']} lessons)")
    print(f"   Courses aligned: {c_stat['aligned_courses_count']}/{c_stat['total_courses']} courses\n")

    print(f"📻 ESL Podcasts (Daily, Cultural, Fluent, VIP):")
    print(f"   Episodes: [{render_bar(p_stat['percent'])}] {p_stat['percent']:.2f}% ({p_stat['aligned_episodes']}/{p_stat['total_episodes']} episodes)\n")
    print("=========================================================================")

if __name__ == "__main__":
    print_dashboard()
