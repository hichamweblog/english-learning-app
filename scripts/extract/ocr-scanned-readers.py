#!/usr/bin/env python3
"""
Progressive Local OCR Worker for Scanned Graded Readers
Uses PyMuPDF (fitz) + RapidOCR (ONNX runtime) to run CPU offline OCR
on image-only PDFs without requiring system root or external cloud APIs.
Maintains state in .ocr-progress.json so it can be stopped and resumed at any time.
"""

import os
import sys
import json
import re
from pathlib import Path

PROJECT_DIR = Path(__file__).resolve().parent.parent.parent
MATERIALS_DIR = Path('/run/media/dzgeek/Disque local/Study English/English_Materials')
READERS_JSON = PROJECT_DIR / 'public/data/readers.json'
OUT_DIR = PROJECT_DIR / 'public/data/extracted/readers'
TXT_DIR = PROJECT_DIR / 'public/data/extracted/transcripts/readers'
PROGRESS_FILE = OUT_DIR / '.ocr-progress.json'

OUT_DIR.mkdir(parents=True, exist_ok=True)
TXT_DIR.mkdir(parents=True, exist_ok=True)

try:
    import fitz  # PyMuPDF
except ImportError:
    print("Error: pymupdf is required. Install via pip install pymupdf")
    sys.exit(1)

try:
    from rapidocr_onnxruntime import RapidOCR
except ImportError:
    print("RapidOCR is still installing or not available. Run: pip install --user rapidocr-onnxruntime")
    sys.exit(1)

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

def ocr_pdf(pdf_path, max_pages=None):
    doc = fitz.open(pdf_path)
    total_pages = len(doc)
    pages_to_process = min(total_pages, max_pages) if max_pages else total_pages
    pages_text = []

    for page_idx in range(pages_to_process):
        page = doc[page_idx]
        # Render page to high-res image (150 DPI)
        pix = page.get_pixmap(dpi=150)
        img_bytes = pix.tobytes("png")

        result, _ = ocr_engine(img_bytes)
        page_lines = []
        if result:
            for item in result:
                line_text = item[1]
                page_lines.append(line_text)

        full_page = "\n".join(page_lines)
        pages_text.append(full_page)

    return "\n\n--- Page Break ---\n\n".join(pages_text)

def process_scanned_book(reader_meta):
    book_id = reader_meta['id']
    pdf_rel = reader_meta['pdfPath'].replace('materials/', '')
    full_pdf = MATERIALS_DIR / pdf_rel

    if not full_pdf.exists():
        print(f"[{book_id}] PDF not found: {full_pdf}")
        return False

    print(f"[{book_id}] Starting OCR on: {reader_meta['title']} ({full_pdf.name})")
    full_text = ocr_pdf(str(full_pdf))
    word_count = len(full_text.split())

    # Save transcript
    book_txt_dir = TXT_DIR / book_id
    book_txt_dir.mkdir(parents=True, exist_ok=True)
    with open(book_txt_dir / 'full-ocr.txt', 'w', encoding='utf-8') as f:
        f.write(full_text)

    # Save reader JSON
    book_record = {
        "id": book_id,
        "title": reader_meta["title"],
        "level": reader_meta.get("level", "starter"),
        "levelLabel": reader_meta.get("levelLabel", "Starter"),
        "pdfPath": reader_meta["pdfPath"],
        "hasAudio": reader_meta.get("hasAudio", False),
        "audioTracksCount": reader_meta.get("audioTracksCount", 0),
        "ocrExtracted": True,
        "totalChapters": 1,
        "chapters": [
            {
                "chapterNumber": 1,
                "title": reader_meta["title"],
                "audioPath": reader_meta.get("chapters", [{}])[0].get("audioPath") if reader_meta.get("chapters") else None,
                "hasAudio": reader_meta.get("hasAudio", False),
                "storyText": full_text,
                "wordCount": word_count
            }
        ],
        "totalWordCount": word_count
    }

    with open(OUT_DIR / f"{book_id}.json", 'w', encoding='utf-8') as f:
        json.dump(book_record, f, indent=2)

    print(f"[{book_id}] Completed OCR ({word_count} words). Saved to {OUT_DIR / f'{book_id}.json'}")
    return True

def main():
    with open(READERS_JSON, 'r', encoding='utf-8') as f:
        readers = json.load(f)

    progress = load_progress()

    # Identify books that don't have extracted JSON yet
    pending = []
    for r in readers:
        book_id = r['id']
        json_file = OUT_DIR / f"{book_id}.json"
        if not json_file.exists() and r.get('pdfPath'):
            pending.append(r)

    print(f"Found {len(pending)} scanned readers pending OCR.")
    # Prioritize readers with audio first
    pending.sort(key=lambda r: (not r.get('hasAudio', False), r.get('title', '')))

    for r in pending:
        book_id = r['id']
        if progress.get(book_id) == 'done':
            continue
        try:
            success = process_scanned_book(r)
            if success:
                progress[book_id] = 'done'
                save_progress(progress)
        except Exception as e:
            print(f"[{book_id}] Error: {e}")
            progress[book_id] = f"error: {str(e)}"
            save_progress(progress)

if __name__ == '__main__':
    main()
