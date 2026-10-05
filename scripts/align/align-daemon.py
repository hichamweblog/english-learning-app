#!/usr/bin/env python3
"""
Autonomous Tiered Alignment Queue Daemon (Whisper Ground Truth Orchestrator)
Processes Graded Readers, Courses, and Podcasts tier-by-tier with checkpointing,
graceful error handling, and live progress reporting.
"""

import sys
import os
import re
import json
import time
import argparse
from pathlib import Path

# Ensure local imports work
sys.path.insert(0, str(Path(__file__).parent))
from align_reader import process_reader, READERS_EXTRACTED_DIR
from align_course import process_course, COURSES_EXTRACTED_DIR
from align_podcast import process_series_episode

BASE_DIR = Path("/home/dzgeek/Projects/english-learning-app")
LOG_FILE = BASE_DIR / "scripts/align/daemon.log"

def log_msg(msg: str):
    ts = time.strftime("%Y-%m-%d %H:%M:%S")
    formatted = f"[{ts}] {msg}"
    print(formatted, flush=True)
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(formatted + "\n")

def natural_sort_key(path: Path):
    m = re.search(r"reader-(\d+)", path.name)
    return int(m.group(1)) if m else 999999

def get_tier1_readers():
    """Starter & Stage 1 Graded Readers (Foundational Literature)"""
    all_readers = sorted(READERS_EXTRACTED_DIR.glob("reader-*.json"), key=natural_sort_key)
    selected = []
    for r in all_readers:
        try:
            with open(r, "r", encoding="utf-8") as f:
                d = json.load(f)
            # Pick starters or first 30 readers
            if d.get("level") in ["starter", "elementary"] or natural_sort_key(r) <= 30:
                selected.append(r.stem)
        except Exception:
            pass
    return selected

def get_tier2_readers():
    """Intermediate Graded Readers (Pre-Intermediate to Intermediate)"""
    all_readers = sorted(READERS_EXTRACTED_DIR.glob("reader-*.json"), key=natural_sort_key)
    selected = []
    for r in all_readers:
        try:
            with open(r, "r", encoding="utf-8") as f:
                d = json.load(f)
            if d.get("level") in ["pre-intermediate", "intermediate"]:
                selected.append(r.stem)
        except Exception:
            pass
    return selected

def get_all_readers():
    all_readers = sorted(READERS_EXTRACTED_DIR.glob("reader-*.json"), key=natural_sort_key)
    return [r.stem for r in all_readers]

def run_daemon(tier: str = "tier1", specific_ids: list[str] = None, max_items: int = None):
    log_msg(f"=== Starting Alignment Daemon: Tier='{tier}', MaxItems={max_items} ===")
    
    tasks_completed = 0

    if specific_ids:
        reader_ids = specific_ids
    elif tier == "tier1":
        reader_ids = get_tier1_readers()
    elif tier == "tier2":
        reader_ids = get_tier2_readers()
    elif tier == "all":
        reader_ids = get_all_readers()
    else:
        reader_ids = get_tier1_readers()

    log_msg(f"Selected {len(reader_ids)} readers in queue.")

    # 1. Process Graded Readers
    for idx, rid in enumerate(reader_ids, 1):
        if max_items and tasks_completed >= max_items:
            log_msg(f"Reached max items limit ({max_items}). Stopping daemon.")
            return

        log_msg(f"\n[{idx}/{len(reader_ids)}] Processing Reader: {rid}")
        try:
            ok = process_reader(rid, force=False)
            if ok:
                tasks_completed += 1
        except Exception as e:
            log_msg(f"Error on reader {rid}: {e}")

    # 2. Process Courses if Tier 1 or All
    if tier in ["tier1", "all"]:
        courses_priority = ["shyna-everyday-speaking-1"]
        for cid in courses_priority:
            if max_items and tasks_completed >= max_items:
                break
            log_msg(f"\nProcessing Priority Course: {cid}")
            try:
                # Process first 5 lessons of everyday speaking
                for l_num in range(1, 6):
                    process_course(cid, lesson_filter=l_num, force=False)
                    tasks_completed += 1
            except Exception as e:
                log_msg(f"Error on course {cid}: {e}")

    # 3. Process Podcasts sample if Tier 1 or All
    if tier in ["tier1", "all"]:
        log_msg("\nProcessing Priority Podcast Sample: Daily English 1-3")
        for ep_num in [1, 2, 3]:
            if max_items and tasks_completed >= max_items:
                break
            try:
                process_series_episode("daily-english", ep_num, force=False)
                tasks_completed += 1
            except Exception as e:
                log_msg(f"Error on podcast episode {ep_num}: {e}")

    log_msg(f"\n=== Daemon Batch Finished. Completed {tasks_completed} items. ===")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Autonomous Alignment Queue Daemon")
    parser.add_argument("--tier", type=str, default="tier1", choices=["tier1", "tier2", "all"], help="Processing tier")
    parser.add_argument("--ids", nargs="+", help="Specific reader IDs")
    parser.add_argument("--max-items", type=int, help="Limit number of processed items")
    args = parser.parse_args()

    run_daemon(tier=args.tier, specific_ids=args.ids, max_items=args.max_items)
