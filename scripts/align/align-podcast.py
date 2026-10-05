#!/usr/bin/env python3
"""
Audio-First Podcast Alignment Pipeline (Whisper Acoustic Ground Truth)
Uses faster-whisper (base.en, int8) for physical cross-attention word-level timestamps.
Aligns ESL Podcast episodes (Daily English, Cultural English, etc.) with exact acoustic accuracy.
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
DATA_DIR = BASE_PROJECT_DIR / "public/data"
ALIGNMENTS_DIR = BASE_PROJECT_DIR / "public/data/alignments/podcasts"

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

def align_podcast_episode(episode_id: str, series: str, audio_path: Path, out_json_path: Path):
    model = get_whisper_model()
    
    wav_tmp = f"/tmp/pod_{episode_id}_{int(time.time()*1000)%100000}.wav"
    subprocess.run(
        f'ffmpeg -y -i "{audio_path}" -ar 16000 -ac 1 -f wav "{wav_tmp}"',
        shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
    )
    
    sr, data = wavfile.read(wav_tmp)
    audio_float = data.astype(np.float32) / 32768.0
    total_dur = len(audio_float) / 16000.0

    print(f"  Transcribing & aligning Episode {episode_id} ({total_dur:.1f}s) with Whisper acoustic word timestamps...")
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
        p_idx += 1

    if os.path.exists(wav_tmp):
        os.remove(wav_tmp)

    print(f"  -> Generated {len(aligned_paragraphs)} paragraphs ({sum(len(p['words']) for p in aligned_paragraphs)} words) in {time.time()-t0:.1f}s.")

    alignment_result = {
        "sectionId": episode_id,
        "series": series,
        "audioPath": str(audio_path),
        "totalDuration": total_dur,
        "engine": "faster-whisper-base.en",
        "paragraphs": aligned_paragraphs
    }

    out_json_path.parent.mkdir(parents=True, exist_ok=True)
    with open(out_json_path, "w", encoding="utf-8") as f:
        json.dump(alignment_result, f, indent=2)

    # If episode_id is daily-1, also save daily-0001.json
    m = re.search(r"([a-zA-Z\-]+?)(\d+)", episode_id)
    if m:
        prefix, num_str = m.group(1), m.group(2)
        padded_id = f"{prefix}{int(num_str):04d}"
        if padded_id != episode_id:
            alt_path = out_json_path.parent / f"{padded_id}.json"
            with open(alt_path, "w", encoding="utf-8") as f:
                json.dump(alignment_result, f, indent=2)

    return alignment_result

def process_series_episode(series: str, number: int, force: bool = False):
    series_file = DATA_DIR / f"{series}.json"
    if not series_file.exists():
        print(f"Series file {series_file} not found.")
        return False

    with open(series_file, "r", encoding="utf-8") as f:
        episodes = json.load(f)

    ep = next((e for e in episodes if e.get("number") == number), None)
    if not ep:
        print(f"Episode #{number} not found in {series}.")
        return False

    audio_rel = ep.get("audioPath")
    audio_path = resolve_audio_path(audio_rel)
    if not audio_path:
        print(f"Audio path '{audio_rel}' not found on disk.")
        return False

    ep_id = ep.get("id", f"{series}-{number}")
    out_json = ALIGNMENTS_DIR / series / f"{ep_id}.json"

    if out_json.exists() and not force:
        try:
            with open(out_json, "r", encoding="utf-8") as f_al:
                d = json.load(f_al)
            if d.get("engine") == "faster-whisper-base.en":
                print(f"Episode {ep_id}: True acoustic alignment already exists. Skipping.")
                return True
        except Exception:
            pass

    align_podcast_episode(ep_id, series, audio_path, out_json)
    return True

def main():
    parser = argparse.ArgumentParser(description="Acoustic Alignment for Podcasts with faster-whisper.")
    parser.add_argument("--series", type=str, default="daily-english", help="Series name (daily-english, cultural-english)")
    parser.add_argument("--number", type=int, required=True, help="Episode number (e.g. 1)")
    parser.add_argument("--force", action="store_true", help="Force regenerate existing alignments")
    args = parser.parse_args()

    process_series_episode(args.series, args.number, force=args.force)

if __name__ == "__main__":
    main()
