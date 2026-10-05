#!/usr/bin/env python3
"""
Batch Audio-First Alignment & Content Sanitization Runner
Iterates over Graded Readers, applying faster-whisper acoustic word-level timestamps,
restoring missing words, eliminating publisher intro tracks, and wiping out OCR garbage.
"""

import sys
import os
import re
import json
import argparse
from pathlib import Path
from align_reader import process_reader, READERS_EXTRACTED_DIR

def natural_sort_key(path: Path):
    m = re.search(r"reader-(\d+)", path.name)
    return int(m.group(1)) if m else 999999

def run_batch(limit: int | None = None, force: bool = False, reader_ids: list[str] | None = None, level: str | None = None):
    all_readers = sorted(READERS_EXTRACTED_DIR.glob("reader-*.json"), key=natural_sort_key)
    
    selected = []
    if reader_ids:
        for rid in reader_ids:
            p = READERS_EXTRACTED_DIR / f"{rid}.json"
            if p.exists():
                selected.append(p)
    elif level:
        for p in all_readers:
            try:
                with open(p, "r", encoding="utf-8") as f:
                    d = json.load(f)
                if d.get("level") == level.lower():
                    selected.append(p)
            except Exception:
                pass
        if limit:
            selected = selected[:limit]
    else:
        selected = all_readers[:limit] if limit else all_readers

    print(f"Batch processing {len(selected)} readers (force={force})...")
    
    success = 0
    for idx, r_path in enumerate(selected, 1):
        rid = r_path.stem
        print(f"\n[{idx}/{len(selected)}] Starting {rid}...")
        try:
            ok = process_reader(rid, force=force)
            if ok:
                success += 1
        except Exception as e:
            print(f"Error processing {rid}: {e}")

    print(f"\nBatch completed: {success}/{len(selected)} successfully processed.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Batch align readers.")
    parser.add_argument("--limit", type=int, default=None, help="Number of readers to process")
    parser.add_argument("--force", action="store_true", help="Force re-alignment")
    parser.add_argument("--level", type=str, help="Filter by level (e.g. starter, elementary)")
    parser.add_argument("--ids", nargs="+", help="Explicit reader IDs to process")
    args = parser.parse_args()

    # Add scripts/align to sys.path
    sys.path.insert(0, str(Path(__file__).parent))
    run_batch(limit=args.limit, force=args.force, reader_ids=args.ids, level=args.level)

