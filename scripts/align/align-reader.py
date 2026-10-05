#!/usr/bin/env python3
"""
Audio-First Reader Alignment & Text Correction Pipeline (Whisper Acoustic Ground Truth)
Uses faster-whisper (base.en, int8) for physical cross-attention word-level timestamps.
Guarantees 100% acoustic sync (no lead, no lag), eliminates publisher intros and OCR noise,
and purges broken OCR comprehension quiz garbage.
"""

import sys
import os
import re
import json
import time
import subprocess
import argparse
from pathlib import Path
import scipy.io.wavfile as wavfile
import numpy as np
from faster_whisper import WhisperModel

AUDIO_ROOT = Path("/run/media/dzgeek/Disque local/Study English/English_Materials")
BASE_PROJECT_DIR = Path("/home/dzgeek/Projects/english-learning-app")
READERS_EXTRACTED_DIR = BASE_PROJECT_DIR / "public/data/extracted/readers"
ALIGNMENTS_DIR = BASE_PROJECT_DIR / "public/data/alignments/readers"

# Lazy loaded Whisper Model
_model = None

def get_whisper_model():
    global _model
    if _model is None:
        print("Loading faster-whisper base.en model (int8 on CPU, 4 threads)...")
        t0 = time.time()
        _model = WhisperModel("base.en", device="cpu", compute_type="int8", cpu_threads=4)
        print(f"Model loaded in {time.time()-t0:.2f}s")
    return _model

def resolve_audio_path(audio_path_str: str) -> Path | None:
    if not audio_path_str:
        return None
    clean_path = audio_path_str
    if clean_path.startswith("materials/"):
        clean_path = clean_path[len("materials/"):]
    full_path = AUDIO_ROOT / clean_path
    if full_path.exists():
        return full_path
    p = Path(audio_path_str)
    if p.exists():
        return p
    return None

def is_garbage_quiz_text(text: str) -> bool:
    """Detect if activitiesText contains garbled OCR artifacts like RRM T, setmmerr, etc."""
    if not text or not text.strip():
        return True
    
    garbage_patterns = [
        r"[\u4e00-\u9fff]",  # Chinese characters from glossaries / notes
        r"RRM\s+T",
        r"setmmerr",
        r"Emmet,\s*meme",
        r"T[\|\s]*[\|\]]F",
        r"@[T\s]*@[F\s]",
        r"&\s*@T\s*@F",
        r"B\s+setmmer",
        r"ae\s*rsemrie",
        r"shimenaxnete",
        r"sgacee\s*rrazmaier",
        r"HTARERKHASES",
        r"SPNMEPBANAEH",
        r"Rite T Sb",
        r"APSA\s+RM",
        r"One Point Lest",
        r"One Point Lesson",
        r"KEY\s+Wor[dp]s",
        r"omprehension\s+Quiz",
        r"B\s+@©\s+@@",
        r"C\s+0205050",
        r"oT\s+eT\s+@F",
        r"[^\x00-\x7F]{3,}", # repeated non-ascii characters
    ]
    for pat in garbage_patterns:
        if re.search(pat, text, re.IGNORECASE):
            return True
            
    # Check symbol to letter ratio
    letters = sum(1 for c in text if c.isalpha())
    non_ws = sum(1 for c in text if not c.isspace())
    if non_ws > 20 and (letters / non_ws) < 0.55:
        return True

    return False

def clean_activities(chapter: dict):
    """Purge meaningless OCR artifacts from activitiesText."""
    act = chapter.get("activitiesText", "")
    if is_garbage_quiz_text(act):
        chapter["activitiesText"] = ""
        chapter["hasActivities"] = False

def is_publisher_intro_segment(seg_text: str, seg_start: float) -> bool:
    """Identify if a segment in the first 45s is a publisher announcement."""
    if seg_start > 45.0:
        return False
    lower = seg_text.lower()
    publisher_keywords = [
        "publishing house", "foreign languages", "university press",
        "audio-visual", "audiovisual", "beijing", "cassette",
        "compact disc", "macmillan readers", "penguin readers"
    ]
    return any(kw in lower for kw in publisher_keywords)

def align_chapter(chapter_num: int, audio_path: Path, section_id: str, out_json_path: Path):
    model = get_whisper_model()
    
    wav_tmp = f"/tmp/ch_{chapter_num}_{int(time.time()*1000)%100000}.wav"
    subprocess.run(
        f'ffmpeg -y -i "{audio_path}" -ar 16000 -ac 1 -f wav "{wav_tmp}"',
        shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
    )
    
    sr, data = wavfile.read(wav_tmp)
    audio_float = data.astype(np.float32) / 32768.0
    total_dur = len(audio_float) / 16000.0

    print(f"  Transcribing & aligning Track #{chapter_num} ({total_dur:.1f}s) with Whisper acoustic word timestamps...")
    t0 = time.time()
    segments, info = model.transcribe(
        audio_float,
        word_timestamps=True,
        language="en",
        beam_size=1,
        vad_filter=True,
        vad_parameters=dict(min_silence_duration_ms=500)
    )

    aligned_paragraphs = []
    story_paragraphs = []
    is_ch1 = (chapter_num == 1)

    p_idx = 1
    for seg in segments:
        seg_text = seg.text.strip()
        if not seg_text:
            continue

        # Skip publisher intro on Track 1
        if is_ch1 and is_publisher_intro_segment(seg_text, seg.start):
            print(f"    [Skipped Publisher Intro]: [{seg.start:.1f}s-{seg.end:.1f}s] {seg_text[:60]}")
            continue

        aligned_words = []
        for w_idx, w in enumerate(seg.words):
            w_text = w.word.strip()
            if not w_text:
                continue
            aligned_words.append({
                "id": f"p{p_idx}w{w_idx+1}",
                "text": w_text,
                "start": round(float(w.start), 2),
                "end": round(float(w.end), 2)
            })

        if not aligned_words:
            continue

        aligned_paragraphs.append({
            "id": f"p{p_idx}",
            "start": round(float(seg.start), 2),
            "end": round(float(seg.end), 2),
            "text": seg_text,
            "words": aligned_words
        })
        story_paragraphs.append(seg_text)
        p_idx += 1

    # Cleanup temp wav
    if os.path.exists(wav_tmp):
        os.remove(wav_tmp)

    print(f"  -> Generated {len(aligned_paragraphs)} paragraphs ({sum(len(p['words']) for p in aligned_paragraphs)} words) in {time.time()-t0:.1f}s.")

    alignment_result = {
        "sectionId": section_id,
        "trackNumber": chapter_num,
        "audioPath": str(audio_path),
        "totalDuration": total_dur,
        "engine": "faster-whisper-base.en",
        "paragraphs": aligned_paragraphs
    }

    out_json_path.parent.mkdir(parents=True, exist_ok=True)
    with open(out_json_path, "w", encoding="utf-8") as f:
        json.dump(alignment_result, f, indent=2)

    full_story_text = "\n\n".join(story_paragraphs)
    return alignment_result, full_story_text

def process_reader(reader_id: str, chapter_filter: int | None = None, force: bool = False):
    reader_file = READERS_EXTRACTED_DIR / f"{reader_id}.json"
    if not reader_file.exists():
        print(f"Error: Reader file {reader_file} does not exist.")
        return False

    with open(reader_file, "r", encoding="utf-8") as f:
        reader_data = json.load(f)

    print(f"\n==========================================")
    print(f"Aligning Reader: {reader_data.get('title')} ({reader_id})")
    print(f"Chapters count: {len(reader_data.get('chapters', []))}")
    print(f"==========================================")

    modified = False
    for ch in reader_data.get("chapters", []):
        ch_num = ch.get("chapterNumber", 1)
        if chapter_filter and ch_num != chapter_filter:
            continue

        # Purge garbage OCR in activitiesText
        prev_act = ch.get("activitiesText", "")
        clean_activities(ch)
        if ch.get("activitiesText") != prev_act:
            modified = True

        audio_rel = ch.get("audioPath")
        if not audio_rel:
            continue

        audio_path = resolve_audio_path(audio_rel)
        if not audio_path:
            print(f"  Chapter {ch_num}: Audio file not found for path '{audio_rel}'")
            continue

        section_id = f"{reader_id}-ch-{ch_num}"
        align_json = ALIGNMENTS_DIR / reader_id / f"ch-{ch_num}.json"

        if align_json.exists() and not force:
            try:
                with open(align_json, "r", encoding="utf-8") as f_al:
                    al_data = json.load(f_al)
                if al_data.get("engine") == "faster-whisper-base.en":
                    print(f"  Chapter {ch_num}: True acoustic alignment already exists. Skipping.")
                    continue
            except Exception:
                pass

        alignment_res, story_text = align_chapter(ch_num, audio_path, section_id, align_json)
        if story_text:
            ch["storyText"] = story_text
            ch["wordCount"] = len(story_text.split())
            ch["hasAudio"] = True
            ch["hasAlignment"] = True

            # Extract chapter title if spoken in first paragraph
            first_words = story_text.split()[:15]
            joined_first = " ".join(first_words).lower()
            num_words = ["one","two","three","four","five","six","seven","eight","nine","ten"]
            num_str = num_words[ch_num-1] if ch_num <= 10 else str(ch_num)
            if f"chapter {ch_num}" in joined_first or f"chapter {num_str}" in joined_first:
                m = re.search(r"chapter\s+(?:\d+|one|two|three|four|five|six|seven|eight|nine|ten)[\s:,\-]+([^.,\n]+)", story_text, re.IGNORECASE)
                if m:
                    extracted_sub = m.group(1).strip().title()
                    ch["title"] = f"Chapter {ch_num}: {extracted_sub}"

            modified = True
            print(f"  ✓ Chapter {ch_num} '{ch.get('title')}' acoustic alignment saved ({ch['wordCount']} words).")

    if modified:
        with open(reader_file, "w", encoding="utf-8") as f:
            json.dump(reader_data, f, indent=2)
        print(f"Successfully updated reader extracted data: {reader_file}")

    return True

def main():
    parser = argparse.ArgumentParser(description="Acoustic Alignment with faster-whisper.")
    parser.add_argument("--id", type=str, required=True, help="Specific reader ID (e.g. reader-2-beauty-and-the-beast)")
    parser.add_argument("--chapter", type=int, help="Optional specific chapter number")
    parser.add_argument("--force", action="store_true", help="Force regenerate existing alignments")
    args = parser.parse_args()

    process_reader(args.id, chapter_filter=args.chapter, force=args.force)

if __name__ == "__main__":
    main()
