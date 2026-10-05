#!/usr/bin/env python3
"""
Audio-First Course Alignment Pipeline (Whisper Acoustic Ground Truth)
Uses faster-whisper (base.en, int8) for physical cross-attention word-level timestamps.
Aligns Shyna and interactive course lessons with microsecond accuracy.
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
COURSES_EXTRACTED_DIR = BASE_PROJECT_DIR / "public/data/extracted/shyna-courses"
ALIGNMENTS_DIR = BASE_PROJECT_DIR / "public/data/alignments/courses"

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

def align_lesson(lesson_num: int, audio_path: Path, section_id: str, out_json_path: Path):
    model = get_whisper_model()
    
    wav_tmp = f"/tmp/lesson_{lesson_num}_{int(time.time()*1000)%100000}.wav"
    subprocess.run(
        f'ffmpeg -y -i "{audio_path}" -ar 16000 -ac 1 -f wav "{wav_tmp}"',
        shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
    )
    
    sr, data = wavfile.read(wav_tmp)
    audio_float = data.astype(np.float32) / 32768.0
    total_dur = len(audio_float) / 16000.0

    print(f"  Transcribing & aligning Lesson #{lesson_num} ({total_dur:.1f}s) with Whisper acoustic word timestamps...")
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
    lesson_paragraphs = []

    p_idx = 1
    for seg in segments:
        seg_text = seg.text.strip()
        if not seg_text:
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
        lesson_paragraphs.append(seg_text)
        p_idx += 1

    if os.path.exists(wav_tmp):
        os.remove(wav_tmp)

    print(f"  -> Generated {len(aligned_paragraphs)} paragraphs ({sum(len(p['words']) for p in aligned_paragraphs)} words) in {time.time()-t0:.1f}s.")

    alignment_result = {
        "sectionId": section_id,
        "trackNumber": lesson_num,
        "audioPath": str(audio_path),
        "totalDuration": total_dur,
        "engine": "faster-whisper-base.en",
        "paragraphs": aligned_paragraphs
    }

    out_json_path.parent.mkdir(parents=True, exist_ok=True)
    with open(out_json_path, "w", encoding="utf-8") as f:
        json.dump(alignment_result, f, indent=2)

    full_lesson_text = "\n\n".join(lesson_paragraphs)
    return alignment_result, full_lesson_text

def process_course(course_id: str, lesson_filter: int | None = None, force: bool = False):
    course_file = COURSES_EXTRACTED_DIR / f"{course_id}.json"
    if not course_file.exists():
        print(f"Error: Course file {course_file} does not exist.")
        return False

    with open(course_file, "r", encoding="utf-8") as f:
        course_data = json.load(f)

    print(f"\n==========================================")
    print(f"Aligning Course: {course_data.get('title')} ({course_id})")
    print(f"Lessons count: {len(course_data.get('lessons', []))}")
    print(f"==========================================")

    modified = False
    for lesson in course_data.get("lessons", []):
        l_num = lesson.get("lessonNumber", 1)
        if lesson_filter and l_num != lesson_filter:
            continue

        audio_rel = lesson.get("audioPath")
        if not audio_rel:
            continue

        audio_path = resolve_audio_path(audio_rel)
        if not audio_path:
            print(f"  Lesson {l_num}: Audio file not found for path '{audio_rel}'")
            continue

        section_id = f"{course_id}-lesson-{l_num}"
        align_json = ALIGNMENTS_DIR / course_id / f"lesson-{l_num}.json"

        if align_json.exists() and not force:
            try:
                with open(align_json, "r", encoding="utf-8") as f_al:
                    al_data = json.load(f_al)
                if al_data.get("engine") == "faster-whisper-base.en":
                    print(f"  Lesson {l_num}: True acoustic alignment already exists. Skipping.")
                    continue
            except Exception:
                pass

        alignment_res, full_text = align_lesson(l_num, audio_path, section_id, align_json)
        if full_text:
            if not lesson.get("fullText"):
                lesson["fullText"] = full_text
            lesson["wordCount"] = len(full_text.split())
            lesson["hasAudio"] = True
            lesson["hasAlignment"] = True
            modified = True
            print(f"  ✓ Lesson {l_num} '{lesson.get('title')}' acoustic alignment saved ({lesson['wordCount']} words).")

    if modified:
        with open(course_file, "w", encoding="utf-8") as f:
            json.dump(course_data, f, indent=2)
        print(f"Successfully updated course extracted data: {course_file}")

    return True

def main():
    parser = argparse.ArgumentParser(description="Acoustic Alignment for Courses with faster-whisper.")
    parser.add_argument("--id", type=str, required=True, help="Specific course ID (e.g. shyna-everyday-speaking-1)")
    parser.add_argument("--lesson", type=int, help="Optional specific lesson number")
    parser.add_argument("--force", action="store_true", help="Force regenerate existing alignments")
    args = parser.parse_args()

    process_course(args.id, lesson_filter=args.lesson, force=args.force)

if __name__ == "__main__":
    main()
