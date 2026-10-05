#!/usr/bin/env python3
"""
Intelligent 1:1 Chapter-to-Track Hybrid Extractor for Graded Readers.
Features:
- Hybrid digital/OCR extraction: instant digital text if available, high-speed PPM+Tesseract (PSM 3) if scanned.
- Audio-duration-guided proportional segmentation with chapter marker snapping.
- Continuous fractional page allocation for high-track density books (eliminates 0-word chapters).
- Resilient separation of story text from activities and exercises.
- Saves structured JSON to public/data/extracted/readers/<book-id>.json
- Saves chapter transcripts to public/data/extracted/transcripts/readers/<book-id>/ch-<nn>.txt
- Automatically rebuilds public/data/extracted/readers/index.json
- Tracks progress in .ocr-progress.json to enable safe stopping and resumption.
"""

import os
import sys
import json
import re
import shutil
import subprocess
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import pymupdf

# Force unbuffered output for real-time background task monitoring
try:
    sys.stdout.reconfigure(line_buffering=True)
except Exception:
    pass

PROJECT_DIR = Path(__file__).resolve().parent.parent.parent
MATERIALS_DIR = Path('/run/media/dzgeek/Disque local/Study English/English_Materials')
READERS_JSON = PROJECT_DIR / 'public/data/readers.json'
OUT_DIR = PROJECT_DIR / 'public/data/extracted/readers'
TXT_DIR = PROJECT_DIR / 'public/data/extracted/transcripts/readers'
PROGRESS_FILE = OUT_DIR / '.ocr-progress.json'
INDEX_FILE = OUT_DIR / 'index.json'

OUT_DIR.mkdir(parents=True, exist_ok=True)
TXT_DIR.mkdir(parents=True, exist_ok=True)

HAS_TESSERACT = shutil.which('tesseract') is not None
if HAS_TESSERACT:
    print("[OCR Engine] Using native Tesseract (High Speed C++ Engine)")
else:
    print("[OCR Engine] Tesseract not found in PATH! Falling back to RapidOCR.")
    from rapidocr_onnxruntime import RapidOCR
    ocr_engine = RapidOCR()

def load_progress():
    if PROGRESS_FILE.exists():
        try:
            with open(PROGRESS_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception:
            return {}
    return {}

def save_progress(progress):
    with open(PROGRESS_FILE, 'w', encoding='utf-8') as f:
        json.dump(progress, f, indent=2)

def get_track_durations(audio_paths):
    """Retrieve audio track durations using ffprobe."""
    durs = []
    for p in audio_paths:
        full_p = MATERIALS_DIR / p.replace('materials/', '')
        if not full_p.exists():
            durs.append(300.0)
            continue
        try:
            out = subprocess.check_output(
                ['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', str(full_p)],
                timeout=5
            )
            durs.append(max(10.0, float(out.strip())))
        except Exception:
            durs.append(300.0)
    return durs

def ocr_page_ppm(doc, p):
    """Extract page text using digital stream or fast PPM Tesseract OCR."""
    try:
        dig_txt = doc[p].get_text().strip()
        words = dig_txt.split()
        if len(words) > 15 and len(set(words)) > 8:
            return dig_txt
    except Exception:
        pass

    if HAS_TESSERACT:
        try:
            pix = doc[p].get_pixmap(dpi=95)
            # Check for totally white/blank page: sample across the whole page
            samples = pix.samples
            if len(samples) > 2000 and sum(1 for b in samples[::50] if b < 200) < 60:
                return ""
            pix_bytes = pix.tobytes('ppm')
            proc = subprocess.Popen(
                ['tesseract', 'stdin', 'stdout', '-l', 'eng', '--psm', '3'],
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )
            out, _ = proc.communicate(input=pix_bytes, timeout=20)
            return out.decode('utf-8', errors='replace').strip()
        except Exception:
            pass
    elif 'ocr_engine' in globals():
        try:
            pix_bytes = doc[p].get_pixmap(dpi=95).tobytes('png')
            result, _ = ocr_engine(pix_bytes)
            return "\n".join([item[1] for item in result]).strip() if result else ""
        except Exception:
            pass

    return ""

def clean_text(text):
    t = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f]', '', text)
    t = re.sub(r'www\.[a-z0-9.-]+\.[a-z]{2,}', '', t, flags=re.IGNORECASE)
    t = re.sub(r'http\S+', '', t)
    t = re.sub(r'[ \t]+', ' ', t)
    return t.strip()

def segment_and_extract_reader(reader_meta):
    b_id = reader_meta['id']
    pdf_rel = reader_meta['pdfPath'].replace('materials/', '')
    pdf_p = MATERIALS_DIR / pdf_rel

    if not pdf_p.exists():
        print(f"[{b_id}] PDF file not found on disk: {pdf_p}. Skipping.")
        return False

    chapters_meta = reader_meta.get('chapters', [])
    n_tracks = len(chapters_meta)
    if n_tracks == 0:
        print(f"[{b_id}] No audio chapters defined in metadata. Skipping.")
        return False

    audio_paths = [c['audioPath'] for c in chapters_meta]
    durs = get_track_durations(audio_paths)
    total_dur = sum(durs)
    weights = [d / total_dur for d in durs]

    doc = pymupdf.open(str(pdf_p))
    total_pages = len(doc)
    print(f"[{b_id}] Processing '{reader_meta['title']}' ({total_pages} pages, {n_tracks} audio tracks)...")

    # Parallel extraction across 4 threads
    with ThreadPoolExecutor(max_workers=4) as ex:
        pages = list(ex.map(lambda p: clean_text(ocr_page_ppm(doc, p)), range(total_pages)))

    # 1. Identify first page with real content (skip blank or unparsed initial pages)
    first_real_page = 0
    for p in range(total_pages):
        if len(pages[p].strip()) > 30 and (any(len(pages[np].strip()) > 30 for np in range(p+1, min(p+4, total_pages))) or p >= total_pages - 3):
            first_real_page = p
            break

    story_start = first_real_page
    for p in range(first_real_page, min(first_real_page + 20, total_pages)):
        txt = pages[p]
        if 'CONTENTS' in txt.upper() or 'TABLE OF' in txt.upper():
            story_start = p + 1
        elif re.search(r'\b(?:CHAPTER|PART)\s*(?:1|I|ONE)\b', txt, re.IGNORECASE) and p >= story_start:
            story_start = p
            break

    # 2. Identify story end (before back-matter)
    story_end = total_pages
    for p in range(total_pages - 1, max(story_start + 1, total_pages - 15), -1):
        txt = pages[p]
        if any(k in txt.upper() for k in ['WORD LIST', 'GLOSSARY', 'VOCABULARY', 'ANSWER KEY', 'ABOUT THE AUTHOR', 'ABOUT THE BOOKWORMS', 'ACTIVITIES: AFTER READING']):
            story_end = p

    if story_end <= story_start:
        story_start = first_real_page
        story_end = total_pages

    total_story_pages = max(1, story_end - story_start)

    # 3. Calculate chapter boundaries
    use_discrete_boundaries = total_story_pages >= n_tracks
    boundaries = [story_start]

    if use_discrete_boundaries:
        cum_w = 0.0
        for c in range(n_tracks - 1):
            cum_w += weights[c]
            target = story_start + int(round(cum_w * total_story_pages))

            best_p = target
            found = False
            ch_num = c + 2

            for offset in [0, -1, 1, -2, 2, -3, 3, -4, 4]:
                cand = target + offset
                if boundaries[-1] < cand < story_end:
                    txt = pages[cand]
                    pat = rf'\b(?:CHAPTER|PART|GHAPTER|Track|STORY)\s*(?:[•·-]\s*)?(?:0?{ch_num}\b|[IVXLCDM]+\b)'
                    if re.search(pat, txt, re.IGNORECASE):
                        best_p = cand
                        found = True
                        break

            if not found:
                for offset in [0, -1, 1, -2, 2]:
                    cand = target + offset
                    if boundaries[-1] < cand < story_end:
                        prev_txt = pages[cand - 1]
                        if any(k in prev_txt.upper() for k in ['QUIZ', 'ACTIVITIES', 'EXERCISES', 'COMPREHENSION']):
                            best_p = cand
                            found = True
                            break

            boundaries.append(best_p)
        boundaries.append(story_end)

        # Ensure strictly monotonic boundaries
        for i in range(1, len(boundaries)):
            if boundaries[i] <= boundaries[i - 1]:
                boundaries[i] = min(story_end, boundaries[i - 1] + 1)

    book_txt_dir = TXT_DIR / b_id
    book_txt_dir.mkdir(parents=True, exist_ok=True)

    extracted_chapters = []
    has_any_activities = False

    for c in range(n_tracks):
        track_meta = chapters_meta[c]
        ch_num = c + 1
        padded_ch = f"{ch_num:02d}"

        if use_discrete_boundaries:
            p_from = boundaries[c]
            p_to = boundaries[c + 1]
            if p_to <= p_from:
                p_to = min(total_pages, p_from + 1)
            ch_pages = [p for p in pages[p_from:p_to] if p.strip()]
        else:
            # Continuous fractional page allocation for dense multi-track books
            f_start = story_start + (c / n_tracks) * total_story_pages
            f_end = story_start + ((c + 1) / n_tracks) * total_story_pages
            p_from = int(f_start)
            p_to = min(total_pages, int(f_end) + (1 if f_end > int(f_end) else 0))
            if p_to <= p_from:
                p_to = min(total_pages, p_from + 1)
            ch_pages = [pages[p] for p in range(p_from, p_to) if pages[p].strip()]

        # Separate story from activities
        story_pages = []
        act_pages = []
        in_activities = False

        for p_idx, p_txt in enumerate(ch_pages):
            act_match = re.search(r'\b[A-Za-z]?(?:omprehension|ctivit|exercis|quiz)\b', p_txt, re.IGNORECASE)
            if act_match and p_idx > 0:
                in_activities = True

            if in_activities:
                act_pages.append(p_txt)
            else:
                story_pages.append(p_txt)

        story_text = "\n\n".join(story_pages).strip()
        act_text = "\n\n".join(act_pages).strip()

        if not story_text and act_text:
            story_text = act_text
            act_text = ""

        # Fallback to prevent 0-word chapters: if still empty, use nearest non-empty story page
        if not story_text:
            for p in range(p_from, min(total_pages, p_from + 3)):
                if pages[p].strip():
                    story_text = pages[p].strip()
                    break

        # Write transcript text file
        ch_txt_path = book_txt_dir / f"ch-{padded_ch}.txt"
        with open(ch_txt_path, 'w', encoding='utf-8') as f:
            f.write(f"--- Chapter {ch_num}: {track_meta.get('title', f'Chapter {ch_num}')} ---\n\n")
            f.write(story_text)
            if act_text:
                f.write(f"\n\n--- Activities & Exercises ---\n\n{act_text}")

        w_count = len(story_text.split())
        has_act = len(act_text) > 20
        if has_act:
            has_any_activities = True

        extracted_chapters.append({
            "chapterNumber": ch_num,
            "title": track_meta.get('title') or f"Chapter {ch_num}",
            "audioPath": track_meta['audioPath'],
            "hasAudio": True,
            "storyText": story_text,
            "activitiesText": act_text,
            "hasActivities": has_act,
            "wordCount": w_count
        })

    total_words = sum(c['wordCount'] for c in extracted_chapters)

    book_record = {
        "id": b_id,
        "title": reader_meta["title"],
        "level": reader_meta.get("level", "starter"),
        "levelLabel": reader_meta.get("levelLabel", "Starter"),
        "seriesCode": reader_meta.get("seriesCode", "General"),
        "pdfPath": reader_meta["pdfPath"],
        "hasAudio": True,
        "audioTracksCount": len(extracted_chapters),
        "totalChapters": len(extracted_chapters),
        "hasExercises": has_any_activities,
        "ocrExtracted": True,
        "chapters": extracted_chapters,
        "totalWordCount": total_words
    }

    out_json = OUT_DIR / f"{b_id}.json"
    with open(out_json, 'w', encoding='utf-8') as f:
        json.dump(book_record, f, indent=2)

    min_words = min((c['wordCount'] for c in extracted_chapters), default=0)
    print(f"[{b_id}] Extracted {len(extracted_chapters)} chapters ({total_words} words, min chapter: {min_words} words). Saved to {out_json.name}")
    return True

def rebuild_index():
    """Generate index.json catalog of all extracted readers."""
    json_files = sorted(OUT_DIR.glob('*.json'))
    catalog = []
    for jf in json_files:
        if jf.name in ('index.json', '.ocr-progress.json'):
            continue
        try:
            with open(jf, 'r', encoding='utf-8') as f:
                data = json.load(f)
                catalog.append({
                    "id": data["id"],
                    "title": data["title"],
                    "level": data.get("level", "starter"),
                    "levelLabel": data.get("levelLabel", "Starter"),
                    "audioTracksCount": data.get("audioTracksCount", len(data.get("chapters", []))),
                    "totalChapters": data.get("totalChapters", len(data.get("chapters", []))),
                    "totalWordCount": data.get("totalWordCount", 0),
                    "hasExercises": data.get("hasExercises", False),
                    "file": jf.name
                })
        except Exception:
            pass

    with open(INDEX_FILE, 'w', encoding='utf-8') as f:
        json.dump(catalog, f, indent=2)
    print(f"[Index] Built catalog index with {len(catalog)} readers in {INDEX_FILE.name}")

def main():
    with open(READERS_JSON, 'r', encoding='utf-8') as f:
        readers = json.load(f)

    progress = load_progress()

    run_all = '--all' in sys.argv
    force = '--force' in sys.argv
    recheck_flagged = '--recheck-flagged' in sys.argv

    specific_book = None
    if '--book' in sys.argv:
        specific_book = sys.argv[sys.argv.index('--book') + 1]

    limit = None
    if '--limit' in sys.argv:
        limit = int(sys.argv[sys.argv.index('--limit') + 1])

    queue = []
    if specific_book:
        target = next((r for r in readers if r['id'] == specific_book), None)
        if target:
            queue.append(target)
        else:
            print(f"Book '{specific_book}' not found in readers.json!")
            return
    elif recheck_flagged:
        for r in readers:
            b_id = r['id']
            json_file = OUT_DIR / f"{b_id}.json"
            if json_file.exists():
                try:
                    with open(json_file, 'r', encoding='utf-8') as f:
                        d = json.load(f)
                    min_w = min((c.get('wordCount', 0) for c in d.get('chapters', [])), default=0)
                    tot_w = d.get('totalWordCount', 0)
                    if min_w < 50 or tot_w == 0:
                        print(f"Flagged for re-extraction: {b_id} (min: {min_w}w, total: {tot_w}w)")
                        queue.append(r)
                except Exception:
                    queue.append(r)
    else:
        for r in readers:
            b_id = r['id']
            json_file = OUT_DIR / f"{b_id}.json"
            if force or (not json_file.exists()) or progress.get(b_id) != 'done':
                queue.append(r)

    print(f"Pending readers to extract: {len(queue)} books.")
    if not queue:
        print("All Graded Readers up to date! Rebuilding catalog index...")
        rebuild_index()
        return

    if limit:
        queue = queue[:limit]

    processed = 0
    for r in queue:
        b_id = r['id']
        try:
            success = segment_and_extract_reader(r)
            if success:
                progress[b_id] = 'done'
                save_progress(progress)
                processed += 1
        except Exception as e:
            print(f"[{b_id}] Extraction Error: {e}")
            progress[b_id] = f"error: {str(e)}"
            save_progress(progress)

    print(f"\nBatch complete: successfully extracted {processed} books.")
    rebuild_index()

if __name__ == '__main__':
    main()
