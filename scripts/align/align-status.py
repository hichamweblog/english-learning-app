#!/usr/bin/env python3
"""
Real-time Alignment Status & Progress Monitor
Displays completion metrics across Graded Readers, Courses, and Podcasts.
"""

import sys
import json
import re
import subprocess
from pathlib import Path

BASE_DIR = Path("/home/dzgeek/Projects/english-learning-app")
READERS_EXTRACTED = BASE_DIR / "public/data/extracted/readers"
READERS_ALIGN = BASE_DIR / "public/data/alignments/readers"
COURSES_EXTRACTED = BASE_DIR / "public/data/extracted/shyna-courses"
COURSES_ALIGN = BASE_DIR / "public/data/alignments/courses"
PODCASTS_ALIGN = BASE_DIR / "public/data/alignments/podcasts"
PODCAST_SOURCE_FILES = {
    "daily-english": BASE_DIR / "public/data/daily-english.json",
    "cultural-english": BASE_DIR / "public/data/cultural-english.json",
    "fluent-english": BASE_DIR / "public/data/fluent-english.json",
    "fluent-vip": BASE_DIR / "public/data/fluent-vip.json",
    "american-accent": BASE_DIR / "public/data/american-accent.json",
}


def read_json(path: Path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def source_count(path: Path) -> int:
    if not path.exists():
        return 0
    data = read_json(path)
    return len(data) if isinstance(data, list) else 0


def is_aligned(path: Path) -> bool:
    try:
        return read_json(path).get("engine") == "faster-whisper-base.en"
    except (OSError, json.JSONDecodeError, AttributeError):
        return False


def aligned_word_count(path: Path) -> int:
    try:
        data = read_json(path)
        return sum(len(paragraph.get("words", [])) for paragraph in data.get("paragraphs", []))
    except (OSError, json.JSONDecodeError, AttributeError, TypeError):
        return 0


def daemon_status() -> dict:
    state_file = BASE_DIR / "scripts/align/hybrid-daemon-state.json"
    state = {}
    if state_file.exists():
        try:
            state = read_json(state_file)
        except (OSError, json.JSONDecodeError):
            pass

    try:
        result = subprocess.run(
            ["pgrep", "-af", "scripts/align/align-hybrid-daemon.py"],
            capture_output=True,
            text=True,
            check=False,
        )
        running = bool(result.stdout.strip())
    except OSError:
        running = False

    return {"running": running, **state}


def get_reader_status():
    readers = []
    if READERS_EXTRACTED.exists():
        for path in READERS_EXTRACTED.glob("reader-*.json"):
            try:
                data = read_json(path)
                readers.append(data)
            except (OSError, json.JSONDecodeError):
                pass
    total_readers = len(readers)
    total_chapters = sum(len(reader.get("chapters", [])) for reader in readers)
    aligned_chapters = 0
    aligned_words = 0
    aligned_readers = set()

    if READERS_ALIGN.exists():
        for r_dir in READERS_ALIGN.iterdir():
            if not r_dir.is_dir():
                continue
            for ch_file in r_dir.glob("ch-*.json"):
                if is_aligned(ch_file):
                    aligned_chapters += 1
                    aligned_readers.add(r_dir.name)
                    aligned_words += aligned_word_count(ch_file)

    return {
        "total_readers": total_readers,
        "aligned_readers_count": len(aligned_readers),
        "total_chapters": total_chapters,
        "aligned_chapters": aligned_chapters,
        "percent": (aligned_chapters / total_chapters * 100) if total_chapters else 0,
        "aligned_words": aligned_words
    }

def get_courses_status():
    courses = []
    if COURSES_EXTRACTED.exists():
        for path in COURSES_EXTRACTED.glob("*.json"):
            try:
                data = read_json(path)
                lessons = data if isinstance(data, list) else data.get("lessons", [])
                courses.append((path.stem, lessons))
            except (OSError, json.JSONDecodeError):
                pass
    total_courses = len(courses)
    total_lessons = sum(len(lessons) for _, lessons in courses)
    aligned_lessons = 0
    aligned_words = 0
    aligned_courses = set()

    if COURSES_ALIGN.exists():
        for c_dir in COURSES_ALIGN.iterdir():
            if not c_dir.is_dir():
                continue
            for l_file in c_dir.glob("lesson-*.json"):
                if is_aligned(l_file):
                    aligned_lessons += 1
                    aligned_courses.add(c_dir.name)
                    aligned_words += aligned_word_count(l_file)

    return {
        "total_courses": total_courses,
        "aligned_courses_count": len(aligned_courses),
        "total_lessons": total_lessons,
        "aligned_lessons": aligned_lessons,
        "percent": (aligned_lessons / total_lessons * 100) if total_lessons else 0,
        "aligned_words": aligned_words
    }

def get_podcasts_status():
    totals_by_series = {
        series: source_count(path) for series, path in PODCAST_SOURCE_FILES.items()
    }
    total_episodes = sum(totals_by_series.values())
    aligned_keys = set()
    aligned_words = 0

    if PODCASTS_ALIGN.exists():
        for s_dir in PODCASTS_ALIGN.iterdir():
            if not s_dir.is_dir():
                continue
            for ep_file in s_dir.glob("*.json"):
                if not is_aligned(ep_file):
                    continue
                match = re.search(r"(\d+)$", ep_file.stem)
                key = (s_dir.name, int(match.group(1)) if match else ep_file.stem)
                if key in aligned_keys:
                    continue
                aligned_keys.add(key)
                aligned_words += aligned_word_count(ep_file)

    return {
        "total_episodes": total_episodes,
        "aligned_episodes": len(aligned_keys),
        "percent": (len(aligned_keys) / total_episodes * 100) if total_episodes else 0,
        "aligned_words": aligned_words,
        "totals_by_series": totals_by_series,
    }

def render_bar(pct: float, width: int = 28) -> str:
    filled = int(width * pct / 100.0)
    return "█" * filled + "░" * (width - filled)

def print_dashboard():
    r_stat = get_reader_status()
    c_stat = get_courses_status()
    p_stat = get_podcasts_status()
    d_stat = daemon_status()

    total_units = r_stat["total_chapters"] + c_stat["total_lessons"] + p_stat["total_episodes"]
    total_aligned = r_stat["aligned_chapters"] + c_stat["aligned_lessons"] + p_stat["aligned_episodes"]
    total_words = r_stat["aligned_words"] + c_stat["aligned_words"] + p_stat["aligned_words"]
    overall_pct = (total_aligned / total_units * 100) if total_units else 0

    print("=========================================================================")
    print("      🎙️ UNIVERSAL ACOUSTIC ALIGNMENT DASHBOARD (Whisper Ground Truth)    ")
    print("=========================================================================")
    print(f"Overall Progress: [{render_bar(overall_pct)}] {overall_pct:.2f}% ({total_aligned}/{total_units} audio tracks)")
    print(f"Total Verbatim Spoken Words Aligned: {total_words:,} words\n")

    print(f"📚 Graded Readers ({r_stat['total_readers']} Books):")
    print(f"   Chapters: [{render_bar(r_stat['percent'])}] {r_stat['percent']:.2f}% ({r_stat['aligned_chapters']}/{r_stat['total_chapters']} chapters)")
    print(f"   Books fully/partially aligned: {r_stat['aligned_readers_count']}/{r_stat['total_readers']} readers")
    print(f"   Acoustic words: {r_stat['aligned_words']:,} words\n")

    print(f"🎓 Espresso English Courses ({c_stat['total_courses']} Courses):")
    print(f"   Lessons:  [{render_bar(c_stat['percent'])}] {c_stat['percent']:.2f}% ({c_stat['aligned_lessons']}/{c_stat['total_lessons']} lessons)")
    print(f"   Courses aligned: {c_stat['aligned_courses_count']}/{c_stat['total_courses']} courses\n")

    print(f"📻 ESL Podcasts (Daily, Cultural, Fluent, VIP):")
    print(f"   Episodes: [{render_bar(p_stat['percent'])}] {p_stat['percent']:.2f}% ({p_stat['aligned_episodes']}/{p_stat['total_episodes']} episodes)\n")
    print(f"⚙️ Hybrid daemon: {'RUNNING' if d_stat['running'] else 'NOT RUNNING'}")
    if d_stat.get("last_updated"):
        print(
            f"   Checkpoint: cycle {d_stat.get('cycle', '?')}, "
            f"course index {d_stat.get('course_index', '?')}, "
            f"lesson {d_stat.get('next_lesson', '?')}, "
            f"reader index {d_stat.get('next_reader_idx', '?')}, "
            f"Daily English episode {d_stat.get('next_podcast_num', '?')} "
            f"(saved {d_stat['last_updated']})"
        )
    print("=========================================================================")

if __name__ == "__main__":
    print_dashboard()
