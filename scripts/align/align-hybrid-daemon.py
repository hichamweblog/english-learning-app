#!/usr/bin/env python3
"""
Perpetual 24/7 Hybrid Daily Pack Alignment Daemon
Processes alternating batches of:
  1. Courses (5 lessons)
  2. Graded Readers (2 complete books)
  3. Podcasts (5 episodes)
Saves alignment JSONs and ground-truth text immediately per track so the
green "Synced Audio Reading" badge activates in real-time in the browser.
Persists state to hybrid-daemon-state.json for seamless crash recovery & resume.
"""

import sys
import os
import re
import json
import time
from pathlib import Path

# Adjust process priority so it doesn't freeze user desktop
try:
    os.nice(10)
except Exception:
    pass

sys.path.insert(0, str(Path(__file__).parent))
from align_reader import process_reader, READERS_EXTRACTED_DIR
from align_course import process_course, COURSES_EXTRACTED_DIR
from align_podcast import process_series_episode

BASE_DIR = Path("/home/dzgeek/Projects/english-learning-app")
STATE_FILE = BASE_DIR / "scripts/align/hybrid-daemon-state.json"
LOG_FILE = BASE_DIR / "scripts/align/daemon-hybrid.log"
ERR_LOG = BASE_DIR / "scripts/align/daemon-errors.log"

def log_msg(msg: str):
    ts = time.strftime("%Y-%m-%d %H:%M:%S")
    formatted = f"[{ts}] {msg}"
    print(formatted, flush=True)
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(formatted + "\n")

def log_err(msg: str):
    ts = time.strftime("%Y-%m-%d %H:%M:%S")
    formatted = f"[{ts}] ERROR: {msg}"
    print(formatted, flush=True)
    with open(ERR_LOG, "a", encoding="utf-8") as f:
        f.write(formatted + "\n")

def natural_sort_key(path: Path):
    m = re.search(r"reader-(\d+)", path.name)
    return int(m.group(1)) if m else 999999

def load_state():
    if STATE_FILE.exists():
        try:
            with open(STATE_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {
        "cycle": 1,
        "course_index": 0,
        "next_lesson": 6,
        "next_reader_idx": 3, # 0-indexed: reader-1, reader-2, reader-3 are done, reader-4 is idx 3
        "next_podcast_num": 4
    }

def save_state(state):
    state["last_updated"] = time.strftime("%Y-%m-%d %H:%M:%S")
    with open(STATE_FILE, "w", encoding="utf-8") as f:
        json.dump(state, f, indent=2)

def get_ordered_courses():
    courses_order = [
        "shyna-everyday-speaking-1",
        "shyna-everyday-speaking-2",
        "shyna-300-idioms",
        "shyna-business-english",
        "shyna-500-phrases",
        "shyna-slang",
        "shyna-collocations",
        "shyna-confusing-words",
        "shyna-reading-course",
        "shyna-listening-course",
        "shyna-grammar-basic",
        "shyna-grammar-intermediate",
        "shyna-grammar-advanced",
        "shyna-phrasal-verbs",
        "shyna-vocabulary-builder-1",
        "shyna-vocabulary-builder-2"
    ]
    return courses_order

def get_ordered_readers():
    readers = sorted(READERS_EXTRACTED_DIR.glob("reader-*.json"), key=natural_sort_key)
    return [r.stem for r in readers]

def run_perpetual_hybrid():
    log_msg("=========================================================================")
    log_msg("   🚀 24/7 PERPETUAL HYBRID ALIGNMENT DAEMON STARTED (WHISPER GROUND TRUTH) ")
    log_msg("=========================================================================")

    all_courses = get_ordered_courses()
    all_readers = get_ordered_readers()
    total_podcast_eps = 1305

    state = load_state()
    log_msg(f"Loaded checkpoint state: Cycle #{state.get('cycle', 1)} | Course={all_courses[state['course_index']]} (L#{state['next_lesson']}) | Reader={all_readers[state['next_reader_idx']]} | Daily English #{state['next_podcast_num']}")

    while True:
        cycle_num = state.get("cycle", 1)
        log_msg(f"\n>>>>>>>>>>>> STARTING HYBRID PACK #{cycle_num} <<<<<<<<<<<<")

        # ----------------------------------------------------
        # 1. COURSES BATCH: 5 Lessons
        # ----------------------------------------------------
        curr_course_id = all_courses[state["course_index"]]
        course_file = COURSES_EXTRACTED_DIR / f"{curr_course_id}.json"
        total_course_lessons = 47
        if course_file.exists():
            try:
                with open(course_file, "r", encoding="utf-8") as f:
                    c_data = json.load(f)
                total_course_lessons = len(c_data.get("lessons", []))
            except Exception:
                pass

        log_msg(f"--- [Pack #{cycle_num} Part 1/3] Aligning 5 Course Lessons: {curr_course_id} ---")
        lessons_processed = 0
        while lessons_processed < 5:
            l_num = state["next_lesson"]
            if l_num > total_course_lessons:
                # Move to next course
                state["course_index"] = (state["course_index"] + 1) % len(all_courses)
                state["next_lesson"] = 1
                curr_course_id = all_courses[state["course_index"]]
                log_msg(f"Course completed! Advancing to next course: {curr_course_id}")
                save_state(state)
                break

            log_msg(f"  -> Course [{curr_course_id}] Lesson #{l_num}...")
            try:
                process_course(curr_course_id, lesson_filter=l_num, force=False)
            except Exception as e:
                log_err(f"Course {curr_course_id} lesson {l_num} error: {e}")

            state["next_lesson"] += 1
            lessons_processed += 1
            save_state(state)

        # ----------------------------------------------------
        # 2. GRADED READERS BATCH: 2 Complete Books
        # ----------------------------------------------------
        log_msg(f"\n--- [Pack #{cycle_num} Part 2/3] Aligning 2 Complete Graded Readers ---")
        readers_processed = 0
        while readers_processed < 2:
            r_idx = state["next_reader_idx"]
            if r_idx >= len(all_readers):
                log_msg("All 218 Graded Readers have been processed!")
                break

            rid = all_readers[r_idx]
            log_msg(f"  -> Reader [{r_idx+1}/{len(all_readers)}]: {rid}...")
            try:
                process_reader(rid, force=False)
            except Exception as e:
                log_err(f"Reader {rid} error: {e}")

            state["next_reader_idx"] += 1
            readers_processed += 1
            save_state(state)

        # ----------------------------------------------------
        # 3. PODCASTS BATCH: 5 Episodes
        # ----------------------------------------------------
        log_msg(f"\n--- [Pack #{cycle_num} Part 3/3] Aligning 5 Daily English Podcast Episodes ---")
        podcasts_processed = 0
        while podcasts_processed < 5:
            ep_num = state["next_podcast_num"]
            if ep_num > total_podcast_eps:
                log_msg("All Daily English episodes processed!")
                break

            log_msg(f"  -> Podcast Daily English Episode #{ep_num}...")
            try:
                process_series_episode("daily-english", ep_num, force=False)
            except Exception as e:
                log_err(f"Podcast Daily English episode {ep_num} error: {e}")

            state["next_podcast_num"] += 1
            podcasts_processed += 1
            save_state(state)

        # Complete Cycle
        log_msg(f"\n✅ COMPLETED HYBRID PACK #{cycle_num}! All newly processed lessons, chapters, and episodes are now live with 'Synced Audio Reading' in the app.")
        state["cycle"] += 1
        save_state(state)

        # Small 3-second breathing break before next pack
        time.sleep(3)

if __name__ == "__main__":
    run_perpetual_hybrid()
