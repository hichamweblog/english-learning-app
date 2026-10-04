#!/usr/bin/env python3
"""
Intelligent 1:1 Chapter-to-Track OCR Extractor for Scanned Graded Readers.
Features:
- Fast Tesseract CLI detection (10x faster) with automatic fallback to RapidOCR ONNX.
- Chapter segmentation algorithm that maps book text 1:1 to each audio track.
- Separation of story text and comprehension activities / exercises.
- Saves structured JSON to public/data/extracted/readers/<book-id>.json
- Saves chapter transcripts to public/data/extracted/transcripts/readers/<book-id>/ch-<nn>.txt
- Tracks progress in .ocr-progress.json to enable safe stopping and resumption.
"""

import os
import sys
import json
import re
import shutil
import subprocess
from pathlib import Path
import pymupdf

PROJECT_DIR = Path(__file__).resolve().parent.parent.parent
MATERIALS_DIR = Path('/run/media/dzgeek/Disque local/Study English/English_Materials')
READERS_JSON = PROJECT_DIR / 'public/data/readers.json'
OUT_DIR = PROJECT_DIR / 'public/data/extracted/readers'
TXT_DIR = PROJECT_DIR / 'public/data/extracted/transcripts/readers'
PROGRESS_FILE = OUT_DIR / '.ocr-progress.json'

OUT_DIR.mkdir(parents=True, exist_ok=True)
TXT_DIR.mkdir(parents=True, exist_ok=True)

# Detect if Tesseract is available
HAS_TESSERACT = shutil.which('tesseract') is not None
ocr_engine = None

if HAS_TESSERACT:
    print("[OCR Engine] Using native Tesseract (High Speed C++ Engine)")
else:
    print("[OCR Engine] Tesseract not found in PATH. Initializing RapidOCR ONNX fallback...")
    try:
        from rapidocr_onnxruntime import RapidOCR
        ocr_engine = RapidOCR()
        print("[OCR Engine] RapidOCR initialized successfully.")
    except ImportError:
        print("Error: neither tesseract nor rapidocr-onnxruntime is available.")
        sys.exit(1)

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

def ocr_page_tesseract(pix):
    img_bytes = pix.tobytes("png")
    proc = subprocess.Popen(
        ['tesseract', 'stdin', 'stdout', '-l', 'eng', '--psm', '1'],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )
    stdout, _ = proc.communicate(input=img_bytes)
    return stdout.decode('utf-8', errors='replace').strip()

def ocr_page_rapidocr(pix):
    img_bytes = pix.tobytes("png")
    result, _ = ocr_engine(img_bytes)
    lines = []
    if result:
        for item in result:
            lines.append(item[1])
    return "\n".join(lines).strip()

def ocr_page(pix):
    if HAS_TESSERACT:
        try:
            return ocr_page_tesseract(pix)
        except Exception:
            pass
    if ocr_engine:
        return ocr_page_rapidocr(pix)
    return ""

def clean_ocr_text(text):
    # Normalize typography and remove watermarks
    t = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f]', '', text)
    t = re.sub(r'www\.[a-z0-9.-]+\.[a-z]{2,}', '', t, flags=re.IGNORECASE)
    t = re.sub(r'http\S+', '', t)
    t = re.sub(r'[ \t]+', ' ', t)
    return t.strip()

def process_scanned_book(reader_meta):
    book_id = reader_meta['id']
    pdf_rel = reader_meta['pdfPath'].replace('materials/', '')
    full_pdf = MATERIALS_DIR / pdf_rel

    if not full_pdf.exists():
        print(f"[{book_id}] PDF not found: {full_pdf}")
        return False

    audio_chapters = reader_meta.get('chapters', [])
    total_tracks = len(audio_chapters)
    if total_tracks == 0:
        print(f"[{book_id}] No audio chapters found in metadata. Skipping.")
        return False

    print(f"[{book_id}] Processing: '{reader_meta['title']}' ({total_tracks} audio tracks)...")

    doc = pymupdf.open(str(full_pdf))
    total_pages = len(doc)
    page_texts = []

    # Choose reasonable DPI: 96 DPI provides great balance of speed and clarity
    dpi = 96
    for page_idx in range(total_pages):
        page = doc[page_idx]
        pix = page.get_pixmap(dpi=dpi)
        p_txt = ocr_page(pix)
        clean_p = clean_ocr_text(p_txt)
        page_texts.append(clean_p)

    full_text = "\n\n--- Page Break ---\n\n".join(page_texts)

    # Check for chapter headings in OCR text
    ch_regex = re.compile(r'(?:^|\n)\s*(?:CHAPTER|Chapter|Part|PART)\s+(?:[•·-]\s*)?([0-9IVXLCDM]+|[A-Za-z]+)\b(?:\s*[:–-]?\s*([^\n\r]+))?')
    matches = []
    for m in ch_regex.finditer(full_text):
        m_str = m.group(0).lower()
        if not any(k in m_str for k in ['exercise', 'activities', 'question', 'summary', 'again', 'table', 'quiz']):
            matches.append({
                'num': m.group(1),
                'subtitle': (m.group(2) or '').strip(),
                'start': m.start()
            })

    body_matches = [m for m in matches if m['start'] > 1500]
    active_matches = body_matches if len(body_matches) >= 2 else matches

    chapters = []
    book_txt_dir = TXT_DIR / book_id
    book_txt_dir.mkdir(parents=True, exist_ok=True)

    if 0 < len(active_matches) <= total_tracks * 2:
        # Detected chapter markers
        for c in range(total_tracks):
            track_meta = audio_chapters[c]
            ch_num = c + 1
            padded_ch = f"{ch_num:02d}"
            ch_title = track_meta.get('title') or f"Chapter {ch_num}"

            if c < len(active_matches):
                cur_m = active_matches[c]
                next_start = active_matches[c + 1]['start'] if (c + 1 < len(active_matches)) else len(full_text)
                ch_text = full_text[cur_m['start']:next_start].strip()
                if cur_m['subtitle']:
                    ch_title = f"Chapter {ch_num}: {cur_m['subtitle']}"
            else:
                ch_text = f"[Audio Track {ch_num}] Narration continues."

            act_match = re.search(r'(?:^|\n)\s*(?:ACTIVITIES|Activities|EXERCISES|Exercises|Comprehension Quiz|BEFORE READING|AFTER READING)\b', ch_text, re.IGNORECASE)
            story_text = ch_text
            activities_text = ""
            if act_match and act_match.start() > 50:
                story_text = ch_text[:act_match.start()].strip()
                activities_text = ch_text[act_match.start():].strip()

            ch_txt_path = book_txt_dir / f"ch-{padded_ch}.txt"
            with open(ch_txt_path, 'w', encoding='utf-8') as f:
                f.write(ch_text)

            words = len(ch_text.split())
            chapters.append({
                "chapterNumber": ch_num,
                "title": ch_title,
                "audioPath": track_meta['audioPath'],
                "hasAudio": True,
                "storyText": story_text,
                "activitiesText": activities_text,
                "hasActivities": len(activities_text) > 20,
                "wordCount": words
            })
    else:
        # Proportionally segment pages across audio tracks
        # Exclude initial 2-3 cover/catalog pages if book has > 10 pages
        content_pages = page_texts
        start_p = 2 if total_pages > 10 else 0
        usable_pages = content_pages[start_p:]
        pages_per_track = max(1, len(usable_pages) // total_tracks)

        for c in range(total_tracks):
            track_meta = audio_chapters[c]
            ch_num = c + 1
            padded_ch = f"{ch_num:02d}"

            p_start = c * pages_per_track
            p_end = len(usable_pages) if (c == total_tracks - 1) else min(len(usable_pages), (c + 1) * pages_per_track)
            track_pages = usable_pages[p_start:p_end]
            ch_text = "\n\n".join(p for p in track_pages if p.strip()).strip()
            if not ch_text:
                ch_text = f"[Audio Track {ch_num}] Narration continues."

            act_match = re.search(r'(?:^|\n)\s*(?:ACTIVITIES|Activities|EXERCISES|Exercises|Comprehension Quiz)\b', ch_text, re.IGNORECASE)
            story_text = ch_text
            activities_text = ""
            if act_match and act_match.start() > 50:
                story_text = ch_text[:act_match.start()].strip()
                activities_text = ch_text[act_match.start():].strip()

            ch_txt_path = book_txt_dir / f"ch-{padded_ch}.txt"
            with open(ch_txt_path, 'w', encoding='utf-8') as f:
                f.write(ch_text)

            words = len(ch_text.split())
            chapters.append({
                "chapterNumber": ch_num,
                "title": track_meta.get('title') or f"Chapter {ch_num}",
                "audioPath": track_meta['audioPath'],
                "hasAudio": True,
                "storyText": story_text,
                "activitiesText": activities_text,
                "hasActivities": len(activities_text) > 20,
                "wordCount": words
            })

    has_exercises = any(c['hasActivities'] for c in chapters) or ('EXERCISE' in full_text.upper()) or ('QUIZ' in full_text.upper())
    total_words = sum(c['wordCount'] for c in chapters)

    book_record = {
        "id": book_id,
        "title": reader_meta["title"],
        "level": reader_meta.get("level", "starter"),
        "levelLabel": reader_meta.get("levelLabel", "Starter"),
        "pdfPath": reader_meta["pdfPath"],
        "hasAudio": True,
        "audioTracksCount": len(chapters),
        "totalChapters": len(chapters),
        "hasExercises": has_exercises,
        "ocrExtracted": True,
        "chapters": chapters,
        "totalWordCount": total_words
    }

    out_json = OUT_DIR / f"{book_id}.json"
    with open(out_json, 'w', encoding='utf-8') as f:
        json.dump(book_record, f, indent=2)

    print(f"[{book_id}] Extracted {len(chapters)} chapters ({total_words} words). Saved to {out_json.name}")
    return True

def main():
    with open(READERS_JSON, 'r', encoding='utf-8') as f:
        readers = json.load(f)

    progress = load_progress()

    pending = []
    for r in readers:
        book_id = r['id']
        json_file = OUT_DIR / f"{book_id}.json"
        if not json_file.exists() and r.get('hasAudio'):
            pending.append(r)

    print(f"Pending Scanned Graded Readers to extract: {len(pending)} books.")
    if not pending:
        print("All Graded Readers have already been extracted!")
        return

    # Process one book as validation or pass --all
    run_all = '--all' in sys.argv
    limit = int(sys.argv[sys.argv.index('--limit') + 1]) if '--limit' in sys.argv else (len(pending) if run_all else 1)

    processed = 0
    for r in pending[:limit]:
        book_id = r['id']
        if progress.get(book_id) == 'done':
            continue
        try:
            success = process_scanned_book(r)
            if success:
                progress[book_id] = 'done'
                save_progress(progress)
                processed += 1
        except Exception as e:
            print(f"[{book_id}] Error: {e}")
            progress[book_id] = f"error: {str(e)}"
            save_progress(progress)

    print(f"\nDone batch: processed {processed} books.")

if __name__ == '__main__':
    main()
