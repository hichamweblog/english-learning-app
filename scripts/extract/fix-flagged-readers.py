#!/usr/bin/env python3
"""
Targeted Re-Extraction for Readers with any zero-word chapters.
Uses native Tesseract OCR to guarantee 100% chapter coverage.
"""

import sys
import json
from pathlib import Path
import importlib.util

spec = importlib.util.spec_from_file_location('osr', 'scripts/extract/ocr-scanned-readers.py')
osr = importlib.util.module_from_spec(spec)
spec.loader.exec_module(osr)

READERS_JSON = Path('public/data/readers.json')
OUT_DIR = Path('public/data/extracted/readers')

with open(READERS_JSON) as fp:
    readers_catalog = json.load(fp)

readers_by_id = {r['id']: r for r in readers_catalog}

# Detect any readers in OUT_DIR with zero-word chapters
flagged_ids = []
for f in sorted(OUT_DIR.glob('reader-*.json')):
    with open(f) as fp:
        data = json.load(fp)
    b_id = data['id']
    chapters = data.get('chapters', [])
    if any(c.get('wordCount', 0) == 0 for c in chapters) or sum(c.get('wordCount', 0) for c in chapters) < 500:
        flagged_ids.append(b_id)

print(f"Found {len(flagged_ids)} readers with zero-word or deficient chapters to re-extract:")
for fid in flagged_ids:
    print(f" - {fid}")

re_extracted = 0
failed = []

for b_id in flagged_ids:
    if b_id not in readers_by_id:
        print(f"Warning: {b_id} not in readers.json!")
        continue
    r_meta = readers_by_id[b_id]
    print(f"\n[{b_id}] Re-extracting '{r_meta['title']}'...")
    try:
        success = osr.segment_and_extract_reader(r_meta)
        if success:
            re_extracted += 1
        else:
            failed.append(b_id)
    except Exception as e:
        print(f"[{b_id}] Error: {e}")
        failed.append(b_id)

# Rebuild index
osr.rebuild_index()

print("\n==========================================")
print(f"Finished re-extraction: {re_extracted}/{len(flagged_ids)} successful.")
if failed:
    print(f"Failed: {failed}")
print("==========================================")
