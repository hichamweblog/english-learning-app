#!/usr/bin/env python3
"""
Master Pedagogical Extractor for Espresso English Courses (01-shyna-courses).
Extracts all 16 comprehensive courses/programs:
1. Everyday English Speaking (Level 1) - 47 lessons, 46 MP3s
2. Everyday English Speaking (Level 2) - 45 lessons, 45 MP3s
3. Business English Course - 40 lessons, 36 MP3s
4. Phrasal Verbs in Conversation - 30 lessons, 28 MP4 videos
5. 300 Idioms in 30 Days - 30 lessons, 30 MP3s
6. Reading Comprehension Course - 40 lessons, 40 MP3s
7. English Listening & Comprehension Course - 45 lessons, 98 MP3s (Faster & Slower)
8. Advanced English Grammar Course (AEG) - 45 lessons
9. Vocabulary Builder Course (Level 1) - 30 video lessons (MP4)
10. Vocabulary Builder Course (Level 2) - 30 lessons
11. 1000 English Collocations in 10 Minutes a Day - 50 lessons, 50 MP3s
12. 150 Slang & Informal English Expressions - 27 lessons, 27 MP3s
13. 600 Confusing English Words Explained - 130 lessons, 130 MP3s
14. 500 Real English Phrases - 75 lessons, 75 MP3s
15. Basic English Grammar - 22 lessons, 22 MP3s
16. Intermediate English Grammar - 36 lessons, 36 MP3s

Output:
- public/data/extracted/shyna-courses/<course-id>.json
- public/data/extracted/transcripts/shyna-courses/<course-id>/lesson-<nn>.txt
- public/data/extracted/shyna-courses/index.json
- public/data/shyna-courses.json
"""

import os
import sys
import json
import re
from pathlib import Path
import pymupdf

try:
    sys.stdout.reconfigure(line_buffering=True)
except Exception:
    pass

PROJECT_DIR = Path(__file__).resolve().parent.parent.parent
MATERIALS_DIR = Path('/run/media/dzgeek/Disque local/Study English/English_Materials')
SHYNA_ROOT = MATERIALS_DIR / '01-shyna-courses'
OUT_DIR = PROJECT_DIR / 'public/data/extracted/shyna-courses'
TXT_DIR = PROJECT_DIR / 'public/data/extracted/transcripts/shyna-courses'
COURSES_JSON = PROJECT_DIR / 'public/data/shyna-courses.json'

OUT_DIR.mkdir(parents=True, exist_ok=True)
TXT_DIR.mkdir(parents=True, exist_ok=True)

def clean_text(text: str) -> str:
    if not text:
        return ""
    t = re.sub(r'www\.espressoenglish\.net\s*', '', text, flags=re.IGNORECASE)
    t = re.sub(r'©\s*Shayna Oliveira\s*\d{4}\s*', '', t, flags=re.IGNORECASE)
    t = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f]', '', t)
    t = t.replace('\uf0b7', '•').replace('\u2022', '•')
    return t.strip()

def extract_dialogue(text: str):
    dialogue = []
    lines = text.splitlines()
    for line in lines:
        line_s = line.strip()
        m = re.match(r'^([A-Z][a-zA-Z\s]{1,18}):\s+(.+)$', line_s)
        if m:
            speaker = m.group(1).strip()
            content = m.group(2).strip()
            if speaker.lower() not in [
                'lesson', 'page', 'question', 'quiz', 'note', 'answers',
                'explanation', 'part', 'chapter', 'option', 'example', 'activity',
                'tip', 'practice', 'exercise'
            ] and len(content) > 3:
                dialogue.append({'speaker': speaker, 'text': content})
    return dialogue

def extract_vocabulary_from_tables(doc):
    vocab = []
    for page in doc:
        try:
            tabs = page.find_tables()
            if tabs.tables:
                for t in tabs.tables:
                    rows = t.extract()
                    if not rows or len(rows) < 2:
                        continue
                    header = [str(c).lower().strip() if c else '' for c in rows[0]]
                    if any('phrasal' in h or 'word' in h or 'verb' in h or 'idiom' in h or 'term' in h for h in header):
                        for r in rows[1:]:
                            if len(r) >= 2 and r[0] and r[1]:
                                term = str(r[0]).strip().replace('\n', ' ')
                                defn = str(r[1]).strip().replace('\n', ' ')
                                if term and defn and term.lower() not in ['phrasal verb', 'word', 'term']:
                                    vocab.append({'term': term, 'definition': defn})
        except Exception:
            pass
    return vocab

def extract_vocabulary_from_text(text: str):
    vocab = []
    # Pattern 1 for idioms: #1 – term = (A) - definition
    for m in re.finditer(r'#(\d+)\s*[-–]\s*([^=\n]+?)\s*=\s*\(([A-D])\)\s*[-–]?\s*([^\n]+)', text):
        term = m.group(2).strip().strip('"\'')
        defn = m.group(4).strip()
        vocab.append({'term': term, 'definition': defn})

    if not vocab:
        # Pattern 2: term (n./v./adj.) = definition
        for m in re.finditer(r'(?:^|\n)([A-Za-z\s-]{2,35})\s*\((?:n\.|v\.|adj\.|adv\.|phr\.)\)\s*=\s*([^\n]+)', text):
            term = m.group(1).strip()
            defn = m.group(2).strip()
            vocab.append({'term': term, 'definition': defn})

    if not vocab:
        # Pattern 3: bold / italic definition in quotes
        for m in re.finditer(r'“([A-Za-z\s-]{2,30})”\s*means\s+([^\n.]+)', text):
            term = m.group(1).strip()
            defn = m.group(2).strip()
            vocab.append({'term': term, 'definition': defn})

    return vocab

def extract_quiz(text: str):
    quiz_match = re.search(r'(?:Quiz\s*[-–:]\s*Lesson\s*\d+|Lesson\s*\d+\s*Quiz|Introductory Quiz|Comprehension Questions|Quiz)([\s\S]+?)(?:Lesson\s*\d+\s*Quiz\s*[-–:]\s*Answers|Answers\s*[-–:]\s*Quiz|Quiz\s*\d*\s*Answers|Answers\s*[-–:]\s*Lesson|Answers\s*[-–:]\s*Quiz\s*\d*|$)', text, re.IGNORECASE)
    if not quiz_match:
        return None

    quiz_body = quiz_match.group(1)
    post_quiz = text[quiz_match.end(1):]

    # Parse answers key
    answers_map = {}
    for m in re.finditer(r'(\d+)\s*[.:)]\s*([A-D])\b', post_quiz):
        answers_map[int(m.group(1))] = m.group(2).upper()

    # Split quiz into questions
    chunks = re.split(r'\n(?=(?:Question\s*\d+|\d+\s*[.)])\s*)', quiz_body)
    questions = []
    q_counter = 1

    for chunk in chunks:
        chunk_s = chunk.strip()
        if not chunk_s or len(chunk_s) < 10:
            continue

        lines = [l.strip() for l in chunk_s.splitlines() if l.strip()]
        if not lines:
            continue

        q_head = lines[0]
        q_text = re.sub(r'^(?:Question\s*\d+|\d+\s*[.)])\s*[:.]?\s*', '', q_head)
        
        options = []
        i = 1
        while i < len(lines):
            l = lines[i]
            m_inline = re.match(r'^([A-D])[.)\s]\s*(.+)$', l)
            if m_inline:
                options.append(f"{m_inline.group(1)}. {m_inline.group(2).strip()}")
                i += 1
            elif l in ['A', 'B', 'C', 'D'] and i + 1 < len(lines):
                options.append(f"{l}. {lines[i+1].strip()}")
                i += 2
            else:
                if not options:
                    q_text += ' ' + l
                i += 1

        if options:
            correct_ans = answers_map.get(q_counter)
            questions.append({
                'id': q_counter,
                'question': q_text.strip(),
                'options': options,
                'correctAnswer': correct_ans
            })
            q_counter += 1

    if questions:
        return {
            'title': f'Lesson Quiz ({len(questions)} Questions)',
            'questions': questions
        }
    return None

def extract_phrases(text: str):
    phrases = []
    pattern = re.findall(r'\n([A-Z\s/]{4,40})\n([\s\S]+?)(?=\n[A-Z\s/]{4,40}\n|Quiz|$)', text)
    for head, body in pattern:
        head_s = head.strip()
        if head_s in ['EXPLANATION', 'QUIZ', 'ANSWERS', 'DIALOG', 'CONVERSATION', 'LESSON', 'QUESTION']:
            continue
        bullets = [re.sub(r'^[•\-\*]\s*', '', l.strip()) for l in body.splitlines() if re.match(r'^\s*[•\-\*]\s*.+', l)]
        if bullets:
            for b in bullets:
                if len(b) > 4:
                    phrases.append({'category': head_s, 'phrase': b})
    return phrases

def extract_writing_task(text: str):
    wt_match = re.search(r'(?:Writing Task|Writing Exercises|Practice Exercise|Speaking & Writing Practice)([\s\S]+?)(?:Answers|Quiz|$)', text, re.IGNORECASE)
    if wt_match:
        wt = clean_text(wt_match.group(1)).strip()
        return wt[:1000] if len(wt) > 1000 else wt
    return None

def extract_pdf_data(pdf_path: Path, parse_tables: bool = False):
    doc = pymupdf.open(str(pdf_path))
    raw_pages = [doc[i].get_text() for i in range(len(doc))]
    full_text = clean_text('\n\n'.join(raw_pages))
    word_count = len(full_text.split())

    dialogue = extract_dialogue(full_text)
    
    vocab = []
    if parse_tables:
        vocab = extract_vocabulary_from_tables(doc)
    if not vocab:
        vocab = extract_vocabulary_from_text(full_text)

    quiz = extract_quiz(full_text)
    phrases = extract_phrases(full_text)
    writing_task = extract_writing_task(full_text)

    return {
        'fullText': full_text,
        'wordCount': word_count,
        'dialogue': dialogue if dialogue else None,
        'vocabulary': vocab if vocab else None,
        'phrases': phrases if phrases else None,
        'quiz': quiz,
        'writingTask': writing_task
    }

def process_lesson_pdf_course(course_def):
    c_id = course_def['id']
    title = course_def['title']
    print(f"\n[{c_id}] Extracting '{title}'...")

    course_dir = SHYNA_ROOT / course_def['rel_dir']
    pdf_dir = SHYNA_ROOT / course_def['pdf_dir'] if course_def.get('pdf_dir') else course_dir
    audio_dir = SHYNA_ROOT / course_def['audio_dir'] if course_def.get('audio_dir') else None
    video_dir = SHYNA_ROOT / course_def['video_dir'] if course_def.get('video_dir') else None

    lesson_pdfs = sorted(pdf_dir.glob('Lesson *.pdf'))
    if not lesson_pdfs:
        lesson_pdfs = sorted(pdf_dir.glob('*.pdf'))
    if len(lesson_pdfs) > 1:
        lesson_pdfs = [p for p in lesson_pdfs if not ('E-BOOK' in p.name or 'Book.pdf' in p.name or 'All' in p.name or 'Guide' in p.name)]

    audio_files = sorted(audio_dir.glob('*.mp3')) if audio_dir and audio_dir.exists() else []
    video_files = sorted(video_dir.glob('*.mp4')) if video_dir and video_dir.exists() else []

    lessons = []
    course_txt_dir = TXT_DIR / c_id
    course_txt_dir.mkdir(parents=True, exist_ok=True)

    use_tables = (c_id == 'shyna-phrasal-verbs')

    for idx, pdf_p in enumerate(lesson_pdfs):
        num_m = re.search(r'(?:Lesson|AEG-Lesson-)?\s*0*(\d+)', pdf_p.stem, re.IGNORECASE)
        lesson_num = int(num_m.group(1)) if num_m else (idx + 1)

        clean_title = re.sub(r'^(?:Lesson|AEG-Lesson-)?\s*0*\d+\s*[-–:]?\s*', '', pdf_p.stem).strip()
        if not clean_title:
            clean_title = f"Lesson {lesson_num}"

        # Match audio
        audio_p = None
        for a in audio_files:
            a_num_m = re.search(r'(?:Lesson|AEG-Lesson-)?\s*0*(\d+)', a.stem, re.IGNORECASE)
            if a_num_m and int(a_num_m.group(1)) == lesson_num:
                # If listening course, prefer FASTER track
                if 'FASTER' in a.stem or audio_p is None:
                    audio_p = a

        # Match video
        video_p = None
        for v in video_files:
            v_num_m = re.search(r'(?:Lesson|lesson)?\s*0*(\d+)', v.stem, re.IGNORECASE)
            if v_num_m and int(v_num_m.group(1)) == lesson_num:
                video_p = v
                break

        try:
            pdf_data = extract_pdf_data(pdf_p, parse_tables=use_tables)
        except Exception as e:
            print(f"  Error extracting {pdf_p.name}: {e}")
            continue

        txt_file = course_txt_dir / f"lesson-{lesson_num:02d}.txt"
        with open(txt_file, 'w', encoding='utf-8') as f:
            f.write(pdf_data['fullText'])

        rel_pdf = str(pdf_p.relative_to(MATERIALS_DIR))
        rel_audio = str(audio_p.relative_to(MATERIALS_DIR)) if audio_p else None
        rel_video = str(video_p.relative_to(MATERIALS_DIR)) if video_p else None

        lessons.append({
            'lessonNumber': lesson_num,
            'title': clean_title,
            'audioPath': f"materials/{rel_audio}" if rel_audio else None,
            'videoPath': f"materials/{rel_video}" if rel_video else None,
            'pdfPath': f"materials/{rel_pdf}",
            'transcriptPath': f"data/extracted/transcripts/shyna-courses/{c_id}/lesson-{lesson_num:02d}.txt",
            'hasAudio': bool(audio_p),
            'hasVideo': bool(video_p),
            'wordCount': pdf_data['wordCount'],
            'fullText': pdf_data['fullText'],
            'dialogue': pdf_data['dialogue'],
            'vocabulary': pdf_data['vocabulary'],
            'phrases': pdf_data['phrases'],
            'quiz': pdf_data['quiz'],
            'writingTask': pdf_data['writingTask'],
        })

    lessons.sort(key=lambda x: x['lessonNumber'])

    master_pdf = None
    if course_def.get('master_pdf'):
        m_path = SHYNA_ROOT / course_def['master_pdf']
        if m_path.exists():
            master_pdf = f"materials/{m_path.relative_to(MATERIALS_DIR)}"

    total_words = sum(l['wordCount'] for l in lessons)
    total_audio = sum(1 for l in lessons if l['hasAudio'])
    total_video = sum(1 for l in lessons if l['hasVideo'])
    total_quizzes = sum(1 for l in lessons if l.get('quiz'))

    course_data = {
        'id': c_id,
        'title': title,
        'author': 'Shayna Oliveira',
        'category': course_def['category'],
        'level': course_def['level'],
        'levelLabel': course_def['levelLabel'],
        'totalLessons': len(lessons),
        'totalWordCount': total_words,
        'audioLessonsCount': total_audio,
        'videoLessonsCount': total_video,
        'quizzesCount': total_quizzes,
        'masterPdfPath': master_pdf,
        'lessons': lessons
    }

    out_file = OUT_DIR / f"{c_id}.json"
    with open(out_file, 'w', encoding='utf-8') as f:
        json.dump(course_data, f, indent=2, ensure_ascii=False)

    print(f"[{c_id}] Done: {len(lessons)} lessons ({total_words:,} words, {total_audio} audio, {total_video} video, {total_quizzes} quizzes).")
    return course_data

def process_collocations_course():
    c_id = 'shyna-collocations'
    title = '1000 English Collocations in 10 Minutes a Day'
    print(f"\n[{c_id}] Extracting '{title}'...")

    course_dir = SHYNA_ROOT / '10-1000 English Collocations in 10 Minutes a Day_AUDIO'
    pdf_p = course_dir / '1000 English Collocations. in 10 Minutes a Day .pdf'
    audio_dir = course_dir / '1000 English Collocations in 10 Minutes a Day_AUDIO'
    audio_files = sorted(audio_dir.glob('*.mp3'))

    doc = pymupdf.open(str(pdf_p))
    lesson_pages = {}
    for i, page in enumerate(doc):
        text = page.get_text()
        m = re.search(r'Lesson\s+(\d+)\s*[-–:]\s*([^\n]+)', text)
        if m:
            num = int(m.group(1))
            t = m.group(2).strip()
            if num not in lesson_pages:
                lesson_pages[num] = (i, t)

    course_txt_dir = TXT_DIR / c_id
    course_txt_dir.mkdir(parents=True, exist_ok=True)
    sorted_nums = sorted(lesson_pages.keys())

    lessons = []
    for idx, num in enumerate(sorted_nums):
        start_p, l_title = lesson_pages[num]
        end_p = lesson_pages[sorted_nums[idx + 1]][0] if idx + 1 < len(sorted_nums) else len(doc)

        pages_text = [doc[p].get_text() for p in range(start_p, end_p)]
        full_text = clean_text('\n\n'.join(pages_text))

        # Match audio track: Collocations-Lesson01.mp3
        audio_p = None
        for a in audio_files:
            m = re.search(r'Lesson\s*0*(\d+)', a.stem, re.IGNORECASE)
            if m and int(m.group(1)) == num:
                audio_p = a
                break

        # Extract collocations as vocab
        vocab = []
        for line in full_text.splitlines():
            line_s = line.strip()
            if line_s.startswith('•') or line_s.startswith('-'):
                phrase = re.sub(r'^[•\-]\s*', '', line_s)
                if '=' in phrase:
                    parts = phrase.split('=', 1)
                    vocab.append({'term': parts[0].strip(), 'definition': parts[1].strip()})
                elif len(phrase) > 5:
                    vocab.append({'term': phrase, 'definition': 'Key collocation'})

        quiz = extract_quiz(full_text)

        txt_file = course_txt_dir / f"lesson-{num:02d}.txt"
        with open(txt_file, 'w', encoding='utf-8') as f:
            f.write(full_text)

        rel_pdf = str(pdf_p.relative_to(MATERIALS_DIR))
        rel_audio = str(audio_p.relative_to(MATERIALS_DIR)) if audio_p else None

        lessons.append({
            'lessonNumber': num,
            'title': l_title,
            'audioPath': f"materials/{rel_audio}" if rel_audio else None,
            'videoPath': None,
            'pdfPath': f"materials/{rel_pdf}",
            'transcriptPath': f"data/extracted/transcripts/shyna-courses/{c_id}/lesson-{num:02d}.txt",
            'hasAudio': bool(audio_p),
            'hasVideo': False,
            'wordCount': len(full_text.split()),
            'fullText': full_text,
            'dialogue': None,
            'vocabulary': vocab if vocab else None,
            'phrases': None,
            'quiz': quiz,
            'writingTask': None,
        })

    master_pdf = f"materials/{pdf_p.relative_to(MATERIALS_DIR)}"
    total_words = sum(l['wordCount'] for l in lessons)
    total_audio = sum(1 for l in lessons if l['hasAudio'])
    total_quizzes = sum(1 for l in lessons if l.get('quiz'))

    course_data = {
        'id': c_id,
        'title': title,
        'author': 'Shayna Oliveira',
        'category': 'Vocabulary & Idioms',
        'level': 'intermediate',
        'levelLabel': 'Intermediate',
        'totalLessons': len(lessons),
        'totalWordCount': total_words,
        'audioLessonsCount': total_audio,
        'videoLessonsCount': 0,
        'quizzesCount': total_quizzes,
        'masterPdfPath': master_pdf,
        'lessons': lessons
    }

    out_file = OUT_DIR / f"{c_id}.json"
    with open(out_file, 'w', encoding='utf-8') as f:
        json.dump(course_data, f, indent=2, ensure_ascii=False)

    print(f"[{c_id}] Done: {len(lessons)} lessons ({total_words:,} words, {total_audio} audio, {total_quizzes} quizzes).")
    return course_data

def process_slang_course():
    c_id = 'shyna-slang'
    title = '150 Slang & Informal English Expressions'
    print(f"\n[{c_id}] Extracting '{title}'...")

    course_dir = SHYNA_ROOT / '11-150 Slang_&_Informal_English'
    pdf_p = course_dir / 'Shayna Oliveira - Slang & Informal English - 2014.pdf'
    audio_dir = course_dir / 'Audio'
    audio_files = sorted(audio_dir.glob('*.mp3'))

    doc = pymupdf.open(str(pdf_p))
    total_pages = len(doc)

    course_txt_dir = TXT_DIR / c_id
    course_txt_dir.mkdir(parents=True, exist_ok=True)

    lessons = []
    # Distribute ~73 pages evenly across 27 audio tracks
    pages_per_lesson = max(1, total_pages // len(audio_files))

    for idx, audio_p in enumerate(audio_files):
        lesson_num = idx + 1
        raw_name = audio_p.stem
        # e.g. 02-Slang-People-General -> Slang: People - General
        clean_name = re.sub(r'^\d+[-_]?', '', raw_name).replace('-', ' ').strip()

        start_p = min(total_pages - 1, idx * pages_per_lesson)
        end_p = min(total_pages, (idx + 1) * pages_per_lesson) if idx + 1 < len(audio_files) else total_pages

        pages_text = [doc[p].get_text() for p in range(start_p, end_p)]
        full_text = clean_text('\n\n'.join(pages_text))

        # Extract slang expressions
        vocab = []
        for line in full_text.splitlines():
            line_s = line.strip()
            if line_s.startswith('•') or line_s.startswith('-'):
                t = re.sub(r'^[•\-]\s*', '', line_s)
                if '=' in t or '–' in t or '-' in t:
                    parts = re.split(r'[=–-]', t, maxsplit=1)
                    vocab.append({'term': parts[0].strip(), 'definition': parts[1].strip()})
                elif len(t) > 3:
                    vocab.append({'term': t, 'definition': 'Slang term'})

        txt_file = course_txt_dir / f"lesson-{lesson_num:02d}.txt"
        with open(txt_file, 'w', encoding='utf-8') as f:
            f.write(full_text)

        rel_pdf = str(pdf_p.relative_to(MATERIALS_DIR))
        rel_audio = str(audio_p.relative_to(MATERIALS_DIR))

        lessons.append({
            'lessonNumber': lesson_num,
            'title': clean_name,
            'audioPath': f"materials/{rel_audio}",
            'videoPath': None,
            'pdfPath': f"materials/{rel_pdf}",
            'transcriptPath': f"data/extracted/transcripts/shyna-courses/{c_id}/lesson-{lesson_num:02d}.txt",
            'hasAudio': True,
            'hasVideo': False,
            'wordCount': len(full_text.split()),
            'fullText': full_text,
            'dialogue': extract_dialogue(full_text),
            'vocabulary': vocab if vocab else None,
            'phrases': None,
            'quiz': None,
            'writingTask': None,
        })

    master_pdf = f"materials/{pdf_p.relative_to(MATERIALS_DIR)}"
    total_words = sum(l['wordCount'] for l in lessons)

    course_data = {
        'id': c_id,
        'title': title,
        'author': 'Shayna Oliveira',
        'category': 'Vocabulary & Idioms',
        'level': 'intermediate',
        'levelLabel': 'Intermediate / Advanced',
        'totalLessons': len(lessons),
        'totalWordCount': total_words,
        'audioLessonsCount': len(lessons),
        'videoLessonsCount': 0,
        'quizzesCount': 0,
        'masterPdfPath': master_pdf,
        'lessons': lessons
    }

    out_file = OUT_DIR / f"{c_id}.json"
    with open(out_file, 'w', encoding='utf-8') as f:
        json.dump(course_data, f, indent=2, ensure_ascii=False)

    print(f"[{c_id}] Done: {len(lessons)} lessons ({total_words:,} words, {len(lessons)} audio).")
    return course_data

def process_confusing_words_course():
    c_id = 'shyna-confusing-words'
    title = '600 Confusing English Words Explained'
    print(f"\n[{c_id}] Extracting '{title}'...")

    course_dir = SHYNA_ROOT / '12-600 Confusing-English-Words-Explained'
    pdf_p = course_dir / '600 Confusing-English-Words-Explained.pdf'
    audio_files = sorted(course_dir.glob('*.mp3'))

    doc = pymupdf.open(str(pdf_p))
    total_pages = len(doc)

    course_txt_dir = TXT_DIR / c_id
    course_txt_dir.mkdir(parents=True, exist_ok=True)

    lessons = []
    # Distribute the content pages (start around page 13) across 130 audio tracks
    start_content_page = 12
    content_pages = total_pages - start_content_page

    for idx, audio_p in enumerate(audio_files):
        lesson_num = idx + 1
        raw_name = audio_p.stem
        # e.g. 01-A-An-One -> A / An / One
        clean_name = re.sub(r'^\d+[-_]?', '', raw_name).replace('-', ' / ').strip()

        # Map page window
        p_idx = start_content_page + int(idx * (content_pages / len(audio_files)))
        p_idx = min(p_idx, total_pages - 1)
        p_end = min(p_idx + 2, total_pages)

        pages_text = [doc[p].get_text() for p in range(p_idx, p_end)]
        full_text = clean_text('\n\n'.join(pages_text))

        # Vocabulary entries for the word pair
        vocab = []
        words = clean_name.split(' / ')
        for w in words:
            w_clean = w.strip()
            if w_clean:
                vocab.append({'term': w_clean, 'definition': f"Commonly confused English word: {clean_name}"})

        quiz = extract_quiz(full_text)

        txt_file = course_txt_dir / f"lesson-{lesson_num:02d}.txt"
        with open(txt_file, 'w', encoding='utf-8') as f:
            f.write(full_text)

        rel_pdf = str(pdf_p.relative_to(MATERIALS_DIR))
        rel_audio = str(audio_p.relative_to(MATERIALS_DIR))

        lessons.append({
            'lessonNumber': lesson_num,
            'title': clean_name,
            'audioPath': f"materials/{rel_audio}",
            'videoPath': None,
            'pdfPath': f"materials/{rel_pdf}",
            'transcriptPath': f"data/extracted/transcripts/shyna-courses/{c_id}/lesson-{lesson_num:02d}.txt",
            'hasAudio': True,
            'hasVideo': False,
            'wordCount': len(full_text.split()),
            'fullText': full_text,
            'dialogue': None,
            'vocabulary': vocab,
            'phrases': None,
            'quiz': quiz,
            'writingTask': None,
        })

    master_pdf = f"materials/{pdf_p.relative_to(MATERIALS_DIR)}"
    total_words = sum(l['wordCount'] for l in lessons)
    total_quizzes = sum(1 for l in lessons if l.get('quiz'))

    course_data = {
        'id': c_id,
        'title': title,
        'author': 'Shayna Oliveira',
        'category': 'Vocabulary & Idioms',
        'level': 'intermediate',
        'levelLabel': 'Intermediate / Advanced',
        'totalLessons': len(lessons),
        'totalWordCount': total_words,
        'audioLessonsCount': len(lessons),
        'videoLessonsCount': 0,
        'quizzesCount': total_quizzes,
        'masterPdfPath': master_pdf,
        'lessons': lessons
    }

    out_file = OUT_DIR / f"{c_id}.json"
    with open(out_file, 'w', encoding='utf-8') as f:
        json.dump(course_data, f, indent=2, ensure_ascii=False)

    print(f"[{c_id}] Done: {len(lessons)} lessons ({total_words:,} words, {len(lessons)} audio, {total_quizzes} quizzes).")
    return course_data

def process_500_phrases_course():
    c_id = 'shyna-500-phrases'
    title = '500 Real English Phrases'
    print(f"\n[{c_id}] Extracting '{title}'...")

    course_dir = SHYNA_ROOT / '3-500-Real-English-Phrases-Audio'
    pdf_p = course_dir / '500-Real-English-Phrases.pdf'
    audio_dir = course_dir / '500-Phrases-Audio'
    # Exclude combined "All-*.mp3" tracks
    audio_files = sorted([a for a in audio_dir.glob('*.mp3') if not a.name.startswith('All-')])

    doc = pymupdf.open(str(pdf_p))
    total_pages = len(doc)

    course_txt_dir = TXT_DIR / c_id
    course_txt_dir.mkdir(parents=True, exist_ok=True)

    lessons = []
    for idx, audio_p in enumerate(audio_files):
        lesson_num = idx + 1
        raw_name = audio_p.stem
        # e.g. Page05-Hello-Goodbye -> Hello Goodbye
        clean_name = re.sub(r'^Page\d+[-_]?', '', raw_name).replace('-', ' ').strip()

        # Parse page number if present in name
        page_num_m = re.search(r'Page(\d+)', raw_name)
        target_page = int(page_num_m.group(1)) - 1 if page_num_m else min(idx, total_pages - 1)
        target_page = min(target_page, total_pages - 1)

        page_text = clean_text(doc[target_page].get_text())

        # Extract phrases
        phrases = []
        for line in page_text.splitlines():
            line_s = line.strip()
            if re.match(r'^\d+[\.\)]\s+', line_s):
                p_clean = re.sub(r'^\d+[\.\)]\s*', '', line_s)
                phrases.append({'category': clean_name, 'phrase': p_clean})

        txt_file = course_txt_dir / f"lesson-{lesson_num:02d}.txt"
        with open(txt_file, 'w', encoding='utf-8') as f:
            f.write(page_text)

        rel_pdf = str(pdf_p.relative_to(MATERIALS_DIR))
        rel_audio = str(audio_p.relative_to(MATERIALS_DIR))

        lessons.append({
            'lessonNumber': lesson_num,
            'title': clean_name,
            'audioPath': f"materials/{rel_audio}",
            'videoPath': None,
            'pdfPath': f"materials/{rel_pdf}",
            'transcriptPath': f"data/extracted/transcripts/shyna-courses/{c_id}/lesson-{lesson_num:02d}.txt",
            'hasAudio': True,
            'hasVideo': False,
            'wordCount': len(page_text.split()),
            'fullText': page_text,
            'dialogue': None,
            'vocabulary': None,
            'phrases': phrases if phrases else None,
            'quiz': None,
            'writingTask': None,
        })

    master_pdf = f"materials/{pdf_p.relative_to(MATERIALS_DIR)}"
    total_words = sum(l['wordCount'] for l in lessons)

    course_data = {
        'id': c_id,
        'title': title,
        'author': 'Shayna Oliveira',
        'category': 'Speaking & Conversation',
        'level': 'starter',
        'levelLabel': 'Beginner / Intermediate',
        'totalLessons': len(lessons),
        'totalWordCount': total_words,
        'audioLessonsCount': len(lessons),
        'videoLessonsCount': 0,
        'quizzesCount': 0,
        'masterPdfPath': master_pdf,
        'lessons': lessons
    }

    out_file = OUT_DIR / f"{c_id}.json"
    with open(out_file, 'w', encoding='utf-8') as f:
        json.dump(course_data, f, indent=2, ensure_ascii=False)

    print(f"[{c_id}] Done: {len(lessons)} lessons ({total_words:,} words, {len(lessons)} audio).")
    return course_data

def process_grammar_unit_course(course_def):
    c_id = course_def['id']
    title = course_def['title']
    print(f"\n[{c_id}] Extracting '{title}'...")

    course_dir = SHYNA_ROOT / course_def['rel_dir']
    pdf_p = course_dir / course_def['pdf_file']
    audio_files = sorted(course_dir.glob('*.mp3'))

    doc = pymupdf.open(str(pdf_p))
    total_pages = len(doc)

    course_txt_dir = TXT_DIR / c_id
    course_txt_dir.mkdir(parents=True, exist_ok=True)

    lessons = []
    pages_per_unit = max(1, total_pages // len(audio_files))

    for idx, audio_p in enumerate(audio_files):
        lesson_num = idx + 1
        clean_name = re.sub(r'^\d+[-_]?', '', audio_p.stem).replace('-', ' ').strip()

        start_p = min(total_pages - 1, idx * pages_per_unit)
        end_p = min(total_pages, (idx + 1) * pages_per_unit) if idx + 1 < len(audio_files) else total_pages

        pages_text = [doc[p].get_text() for p in range(start_p, end_p)]
        full_text = clean_text('\n\n'.join(pages_text))

        quiz = extract_quiz(full_text)

        txt_file = course_txt_dir / f"lesson-{lesson_num:02d}.txt"
        with open(txt_file, 'w', encoding='utf-8') as f:
            f.write(full_text)

        rel_pdf = str(pdf_p.relative_to(MATERIALS_DIR))
        rel_audio = str(audio_p.relative_to(MATERIALS_DIR))

        lessons.append({
            'lessonNumber': lesson_num,
            'title': clean_name,
            'audioPath': f"materials/{rel_audio}",
            'videoPath': None,
            'pdfPath': f"materials/{rel_pdf}",
            'transcriptPath': f"data/extracted/transcripts/shyna-courses/{c_id}/lesson-{lesson_num:02d}.txt",
            'hasAudio': True,
            'hasVideo': False,
            'wordCount': len(full_text.split()),
            'fullText': full_text,
            'dialogue': None,
            'vocabulary': None,
            'phrases': None,
            'quiz': quiz,
            'writingTask': None,
        })

    master_pdf = f"materials/{pdf_p.relative_to(MATERIALS_DIR)}"
    total_words = sum(l['wordCount'] for l in lessons)
    total_quizzes = sum(1 for l in lessons if l.get('quiz'))

    course_data = {
        'id': c_id,
        'title': title,
        'author': 'Shayna Oliveira',
        'category': 'Grammar',
        'level': course_def['level'],
        'levelLabel': course_def['levelLabel'],
        'totalLessons': len(lessons),
        'totalWordCount': total_words,
        'audioLessonsCount': len(lessons),
        'videoLessonsCount': 0,
        'quizzesCount': total_quizzes,
        'masterPdfPath': master_pdf,
        'lessons': lessons
    }

    out_file = OUT_DIR / f"{c_id}.json"
    with open(out_file, 'w', encoding='utf-8') as f:
        json.dump(course_data, f, indent=2, ensure_ascii=False)

    print(f"[{c_id}] Done: {len(lessons)} lessons ({total_words:,} words, {len(lessons)} audio, {total_quizzes} quizzes).")
    return course_data

def process_vocab_builder_1_course():
    c_id = 'shyna-vocabulary-builder-1'
    title = 'Vocabulary Builder Course (Level 1)'
    print(f"\n[{c_id}] Extracting '{title}'...")

    course_dir = SHYNA_ROOT / '7-mchugh_oliveira_shayna_vocabulary_builder_course_level_1-2/vocab level1'
    pdf_p = course_dir / 'mchugh_oliveira_shayna_vocabulary_builder_course_level_1.pdf'
    video_dir = course_dir / 'Vocabulary Builder Course L1 - Video'
    video_files = sorted(video_dir.glob('*.mp4'))

    doc = pymupdf.open(str(pdf_p))
    total_pages = len(doc)

    course_txt_dir = TXT_DIR / c_id
    course_txt_dir.mkdir(parents=True, exist_ok=True)

    lessons = []
    pages_per_video = max(1, total_pages // len(video_files))

    for idx, video_p in enumerate(video_files):
        num_m = re.search(r'(?:Lesson|lesson)?\s*0*(\d+)', video_p.stem, re.IGNORECASE)
        lesson_num = int(num_m.group(1)) if num_m else (idx + 1)
        clean_title = re.sub(r'^(?:Lesson|lesson)?\s*0*\d+\s*[-–:]?\s*', '', video_p.stem).strip()

        start_p = min(total_pages - 1, idx * pages_per_video)
        end_p = min(total_pages, (idx + 1) * pages_per_video) if idx + 1 < len(video_files) else total_pages

        pages_text = [doc[p].get_text() for p in range(start_p, end_p)]
        full_text = clean_text('\n\n'.join(pages_text))

        vocab = extract_vocabulary_from_text(full_text)
        quiz = extract_quiz(full_text)

        txt_file = course_txt_dir / f"lesson-{lesson_num:02d}.txt"
        with open(txt_file, 'w', encoding='utf-8') as f:
            f.write(full_text)

        rel_pdf = str(pdf_p.relative_to(MATERIALS_DIR))
        rel_video = str(video_p.relative_to(MATERIALS_DIR))

        lessons.append({
            'lessonNumber': lesson_num,
            'title': clean_title,
            'audioPath': None,
            'videoPath': f"materials/{rel_video}",
            'pdfPath': f"materials/{rel_pdf}",
            'transcriptPath': f"data/extracted/transcripts/shyna-courses/{c_id}/lesson-{lesson_num:02d}.txt",
            'hasAudio': False,
            'hasVideo': True,
            'wordCount': len(full_text.split()),
            'fullText': full_text,
            'dialogue': None,
            'vocabulary': vocab if vocab else None,
            'phrases': None,
            'quiz': quiz,
            'writingTask': None,
        })

    lessons.sort(key=lambda x: x['lessonNumber'])
    master_pdf = f"materials/{pdf_p.relative_to(MATERIALS_DIR)}"
    total_words = sum(l['wordCount'] for l in lessons)
    total_quizzes = sum(1 for l in lessons if l.get('quiz'))

    course_data = {
        'id': c_id,
        'title': title,
        'author': 'Shayna Oliveira',
        'category': 'Vocabulary & Idioms',
        'level': 'starter',
        'levelLabel': 'Starter / Elementary',
        'totalLessons': len(lessons),
        'totalWordCount': total_words,
        'audioLessonsCount': 0,
        'videoLessonsCount': len(lessons),
        'quizzesCount': total_quizzes,
        'masterPdfPath': master_pdf,
        'lessons': lessons
    }

    out_file = OUT_DIR / f"{c_id}.json"
    with open(out_file, 'w', encoding='utf-8') as f:
        json.dump(course_data, f, indent=2, ensure_ascii=False)

    print(f"[{c_id}] Done: {len(lessons)} lessons ({total_words:,} words, {len(lessons)} videos).")
    return course_data

# Configurations for Lesson-PDF Courses
PDF_COURSES = [
    {
        'id': 'shyna-everyday-speaking-1',
        'title': 'Everyday English Speaking (Level 1)',
        'category': 'Speaking & Conversation',
        'level': 'elementary',
        'levelLabel': 'Elementary / Pre-Intermediate',
        'rel_dir': '1-mchugh_oliveira_shayna_everyday_english_speaking_level_1',
        'pdf_dir': '1-mchugh_oliveira_shayna_everyday_english_speaking_level_1/Everyday English Speaking',
        'audio_dir': '1-mchugh_oliveira_shayna_everyday_english_speaking_level_1/Everyday English Speaking. Audio',
        'master_pdf': '1-mchugh_oliveira_shayna_everyday_english_speaking_level_1/Everyday English Speaking/Everyday English Speaking Course Level 1 Book.pdf'
    },
    {
        'id': 'shyna-everyday-speaking-2',
        'title': 'Everyday English Speaking (Level 2)',
        'category': 'Speaking & Conversation',
        'level': 'intermediate',
        'levelLabel': 'Intermediate / Upper-Intermediate',
        'rel_dir': '2-mchugh_oliveira_shayna_everyday_english_speaking_level_2',
        'pdf_dir': '2-mchugh_oliveira_shayna_everyday_english_speaking_level_2/Everyday English Speaking. Level 2',
        'audio_dir': '2-mchugh_oliveira_shayna_everyday_english_speaking_level_2/Everyday English Speaking. Level 2. Audio',
        'master_pdf': '2-mchugh_oliveira_shayna_everyday_english_speaking_level_2/Everyday English Speaking. Level 2/Everyday English Speaking Course Level 2 Book.pdf'
    },
    {
        'id': 'shyna-business-english',
        'title': 'Business English Course',
        'category': 'Professional English',
        'level': 'intermediate',
        'levelLabel': 'Intermediate / Advanced',
        'rel_dir': '3-mchugh_oliveira_shayna_business_english_course',
        'pdf_dir': '3-mchugh_oliveira_shayna_business_english_course/Business English Course_Text',
        'audio_dir': '3-mchugh_oliveira_shayna_business_english_course/Business English Course_Audio',
        'master_pdf': '3-mchugh_oliveira_shayna_business_english_course/Business English Course_Text/Business English Course - E-BOOK.pdf'
    },
    {
        'id': 'shyna-phrasal-verbs',
        'title': 'Phrasal Verbs in Conversation',
        'category': 'Vocabulary & Idioms',
        'level': 'intermediate',
        'levelLabel': 'Intermediate / Upper-Intermediate',
        'rel_dir': '8-mchugh_oliveira_shayna_phrasal_verbs_in_conversation_course',
        'pdf_dir': '8-mchugh_oliveira_shayna_phrasal_verbs_in_conversation_course/Phrasal Verbs in Conversation Course',
        'audio_dir': None,
        'video_dir': '8-mchugh_oliveira_shayna_phrasal_verbs_in_conversation_course/Phrasal Verbs in Conversation Course. Video',
        'master_pdf': '8-mchugh_oliveira_shayna_phrasal_verbs_in_conversation_course/Phrasal Verbs in Conversation Course/E-Book - Phrasal Verbs in Conversation Course.pdf'
    },
    {
        'id': 'shyna-300-idioms',
        'title': '300 Idioms in 30 Days',
        'category': 'Vocabulary & Idioms',
        'level': 'intermediate',
        'levelLabel': 'Intermediate',
        'rel_dir': '9-mchugh_oliveira_shayna_idioms_course_300_idioms_in_30_days_3',
        'pdf_dir': '9-mchugh_oliveira_shayna_idioms_course_300_idioms_in_30_days_3/Idioms Course - 300 Idioms in 30 Days/Text',
        'audio_dir': '9-mchugh_oliveira_shayna_idioms_course_300_idioms_in_30_days_3/Idioms Course - 300 Idioms in 30 Days/Audio',
        'master_pdf': None
    },
    {
        'id': 'shyna-reading-course',
        'title': 'Reading Comprehension Course (40 Lessons)',
        'category': 'Reading Comprehension',
        'level': 'intermediate',
        'levelLabel': 'Intermediate',
        'rel_dir': '6-mchugh_oliveira_shayna_reading_course_40_lessons',
        'pdf_dir': '6-mchugh_oliveira_shayna_reading_course_40_lessons/Reading Course_Text',
        'audio_dir': '6-mchugh_oliveira_shayna_reading_course_40_lessons/Reading Course_Audio',
        'master_pdf': '6-mchugh_oliveira_shayna_reading_course_40_lessons/Reading Course_Text/How to take the lessons.pdf'
    },
    {
        'id': 'shyna-listening-course',
        'title': 'English Listening & Comprehension Course',
        'category': 'Listening Skills',
        'level': 'intermediate',
        'levelLabel': 'Intermediate',
        'rel_dir': '5-Listening',
        'pdf_dir': '5-Listening/Listening Course/Text - PDF',
        'audio_dir': '5-Listening/Listening Course. Audio',
        'master_pdf': None
    },
    {
        'id': 'shyna-grammar-advanced',
        'title': 'Advanced English Grammar Course (AEG)',
        'category': 'Grammar',
        'level': 'advanced',
        'levelLabel': 'Advanced',
        'rel_dir': '4-Grammar',
        'pdf_dir': '4-Grammar/AEG - pdf',
        'audio_dir': None,
        'master_pdf': None
    },
    {
        'id': 'shyna-vocabulary-builder-2',
        'title': 'Vocabulary Builder Course (Level 2)',
        'category': 'Vocabulary & Idioms',
        'level': 'intermediate',
        'levelLabel': 'Intermediate / Advanced',
        'rel_dir': '7-mchugh_oliveira_shayna_vocabulary_builder_course_level_1-2',
        'pdf_dir': '7-mchugh_oliveira_shayna_vocabulary_builder_course_level_1-2/Vocabulary Builder Course - Level 2 - E-BOOK',
        'audio_dir': None,
        'video_dir': None,
        'master_pdf': '7-mchugh_oliveira_shayna_vocabulary_builder_course_level_1-2/Vocabulary Builder Course - Level 2 - E-BOOK/Vocabulary Builder Course - Level 2 - E-BOOK.pdf'
    }
]

# Grammar single book courses
GRAMMAR_COURSES = [
    {
        'id': 'shyna-grammar-basic',
        'title': 'Basic English Grammar Course',
        'category': 'Grammar',
        'level': 'starter',
        'levelLabel': 'Starter / Elementary',
        'rel_dir': '4-Grammar/Basic-English-Grammar',
        'pdf_file': 'Basic English Grammar.pdf'
    },
    {
        'id': 'shyna-grammar-intermediate',
        'title': 'Intermediate English Grammar Course',
        'category': 'Grammar',
        'level': 'intermediate',
        'levelLabel': 'Intermediate',
        'rel_dir': '4-Grammar/Intermediate-English-Grammar',
        'pdf_file': 'Intermediate English Grammar.pdf'
    }
]

def main():
    print("=== Espresso English Master Extraction Engine (16 Courses) ===")
    all_courses = []

    # 1. Lesson-PDF Courses
    for c_def in PDF_COURSES:
        try:
            res = process_lesson_pdf_course(c_def)
            all_courses.append(res)
        except Exception as e:
            print(f"Error processing {c_def['id']}: {e}")

    # 2. Vocabulary Builder Level 1 (Videos)
    try:
        res = process_vocab_builder_1_course()
        all_courses.append(res)
    except Exception as e:
        print(f"Error processing shyna-vocabulary-builder-1: {e}")

    # 3. 1000 Collocations
    try:
        res = process_collocations_course()
        all_courses.append(res)
    except Exception as e:
        print(f"Error processing shyna-collocations: {e}")

    # 4. 150 Slang Expressions
    try:
        res = process_slang_course()
        all_courses.append(res)
    except Exception as e:
        print(f"Error processing shyna-slang: {e}")

    # 5. 600 Confusing Words
    try:
        res = process_confusing_words_course()
        all_courses.append(res)
    except Exception as e:
        print(f"Error processing shyna-confusing-words: {e}")

    # 6. 500 Real Phrases
    try:
        res = process_500_phrases_course()
        all_courses.append(res)
    except Exception as e:
        print(f"Error processing shyna-500-phrases: {e}")

    # 7. Grammar Courses (Basic & Intermediate)
    for g_def in GRAMMAR_COURSES:
        try:
            res = process_grammar_unit_course(g_def)
            all_courses.append(res)
        except Exception as e:
            print(f"Error processing {g_def['id']}: {e}")

    # Create light index for client catalog
    light_catalog = []
    for c in all_courses:
        light_lessons = []
        for l in c['lessons']:
            light_lessons.append({
                'lessonNumber': l['lessonNumber'],
                'title': l['title'],
                'audioPath': l['audioPath'],
                'videoPath': l['videoPath'],
                'pdfPath': l['pdfPath'],
                'hasAudio': l['hasAudio'],
                'hasVideo': l['hasVideo'],
                'wordCount': l['wordCount'],
                'hasDialogue': bool(l.get('dialogue')),
                'hasQuiz': bool(l.get('quiz')),
                'hasVocab': bool(l.get('vocabulary')),
                'hasPhrases': bool(l.get('phrases')),
            })

        light_catalog.append({
            'id': c['id'],
            'title': c['title'],
            'author': c['author'],
            'category': c['category'],
            'level': c['level'],
            'levelLabel': c['levelLabel'],
            'totalLessons': c['totalLessons'],
            'totalWordCount': c['totalWordCount'],
            'audioLessonsCount': c['audioLessonsCount'],
            'videoLessonsCount': c['videoLessonsCount'],
            'quizzesCount': c['quizzesCount'],
            'masterPdfPath': c['masterPdfPath'],
            'lessons': light_lessons
        })

    # Save public/data/extracted/shyna-courses/index.json
    index_file = OUT_DIR / 'index.json'
    with open(index_file, 'w', encoding='utf-8') as f:
        json.dump(light_catalog, f, indent=2, ensure_ascii=False)
    print(f"\n✔ Saved master index to {index_file}")

    # Save public/data/shyna-courses.json
    with open(COURSES_JSON, 'w', encoding='utf-8') as f:
        json.dump(light_catalog, f, indent=2, ensure_ascii=False)
    print(f"✔ Updated course catalog at {COURSES_JSON}")

    total_lessons = sum(c['totalLessons'] for c in light_catalog)
    total_words = sum(c['totalWordCount'] for c in light_catalog)
    total_audio = sum(c['audioLessonsCount'] for c in light_catalog)
    total_video = sum(c['videoLessonsCount'] for c in light_catalog)
    total_quizzes = sum(c['quizzesCount'] for c in light_catalog)

    print("\n==========================================")
    print(f"🎉 EXTRACTION COMPLETE FOR ALL {len(light_catalog)} COURSES!")
    print(f"• Total Lessons: {total_lessons:,}")
    print(f"• Total Words: {total_words:,}")
    print(f"• Audio Lessons: {total_audio:,}")
    print(f"• Video Lessons: {total_video:,}")
    print(f"• Quizzes: {total_quizzes:,}")
    print("==========================================")

if __name__ == '__main__':
    main()
