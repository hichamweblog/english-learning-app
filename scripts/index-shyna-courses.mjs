#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const BASE_DIR = '/run/media/dzgeek/Disque local/Study English/English_Materials/01-shyna-courses';
const OUT_FILE = path.resolve('public/data/shyna-courses.json');

const courses = [];

function relPath(fullPath) {
  return fullPath.replace('/run/media/dzgeek/Disque local/Study English/English_Materials/', 'materials/');
}

// 1. Everyday English Speaking Level 1
{
  const cDir = path.join(BASE_DIR, '1-mchugh_oliveira_shayna_everyday_english_speaking_level_1');
  const audioDir = path.join(cDir, 'Everyday English Speaking. Audio');
  const textDir = path.join(cDir, 'Everyday English Speaking');
  if (fs.existsSync(audioDir)) {
    const audioFiles = fs.readdirSync(audioDir).filter(f => f.endsWith('.mp3')).sort();
    const lessons = audioFiles.map((f, i) => {
      const title = f.replace(/^Lesson\s*[0-9]+\s*-\s*/i, '').replace('.mp3', '');
      const lessonPdfName = f.replace('.mp3', '.pdf');
      const pdfFullPath = path.join(textDir, lessonPdfName);
      return {
        lessonNumber: i + 1,
        title: title,
        audioPath: relPath(path.join(audioDir, f)),
        pdfPath: fs.existsSync(pdfFullPath) ? relPath(pdfFullPath) : relPath(path.join(textDir, 'Everyday English Speaking Course Level 1 Book.pdf')),
        hasAudio: true
      };
    });
    courses.push({
      id: 'shyna-everyday-speaking-1',
      title: 'Everyday English Speaking (Level 1)',
      author: 'Shayna Oliveira',
      category: 'Speaking & Conversation',
      level: 'elementary',
      levelLabel: 'Elementary / Pre-Intermediate',
      totalLessons: lessons.length,
      masterPdfPath: relPath(path.join(textDir, 'Everyday English Speaking Course Level 1 Book.pdf')),
      lessons
    });
  }
}

// 2. Everyday English Speaking Level 2
{
  const cDir = path.join(BASE_DIR, '2-mchugh_oliveira_shayna_everyday_english_speaking_level_2');
  const audioDir = path.join(cDir, 'Everyday English Speaking. Level 2. Audio');
  const textDir = path.join(cDir, 'Everyday English Speaking. Level 2');
  if (fs.existsSync(audioDir)) {
    const audioFiles = fs.readdirSync(audioDir).filter(f => f.endsWith('.mp3')).sort();
    const lessons = audioFiles.map((f, i) => {
      const title = f.replace(/^Lesson\s*[0-9]+\s*-\s*/i, '').replace('.mp3', '');
      const lessonPdfName = f.replace('.mp3', '.pdf');
      const pdfFullPath = path.join(textDir, lessonPdfName);
      return {
        lessonNumber: i + 1,
        title: title,
        audioPath: relPath(path.join(audioDir, f)),
        pdfPath: fs.existsSync(pdfFullPath) ? relPath(pdfFullPath) : null,
        hasAudio: true
      };
    });
    courses.push({
      id: 'shyna-everyday-speaking-2',
      title: 'Everyday English Speaking (Level 2)',
      author: 'Shayna Oliveira',
      category: 'Speaking & Conversation',
      level: 'intermediate',
      levelLabel: 'Intermediate / Upper-Intermediate',
      totalLessons: lessons.length,
      lessons
    });
  }
}

// 3. Business English Course
{
  const cDir = path.join(BASE_DIR, '3-mchugh_oliveira_shayna_business_english_course');
  const audioDir = path.join(cDir, 'Business English Course_Audio');
  const textDir = path.join(cDir, 'Business English Course_Text');
  if (fs.existsSync(audioDir)) {
    const audioFiles = fs.readdirSync(audioDir).filter(f => f.endsWith('.mp3')).sort();
    const lessons = audioFiles.map((f, i) => {
      const title = f.replace(/^Lesson\s*[0-9]+\s*-\s*/i, '').replace('.mp3', '');
      const lessonPdfName = f.replace('.mp3', '.pdf');
      const pdfFullPath = path.join(textDir, lessonPdfName);
      return {
        lessonNumber: i + 1,
        title: title,
        audioPath: relPath(path.join(audioDir, f)),
        pdfPath: fs.existsSync(pdfFullPath) ? relPath(pdfFullPath) : relPath(path.join(textDir, 'Business English Course - E-BOOK.pdf')),
        hasAudio: true
      };
    });
    courses.push({
      id: 'shyna-business-english',
      title: 'Business English Course',
      author: 'Shayna Oliveira',
      category: 'Professional English',
      level: 'intermediate',
      levelLabel: 'Intermediate / Advanced',
      totalLessons: lessons.length,
      masterPdfPath: relPath(path.join(textDir, 'Business English Course - E-BOOK.pdf')),
      lessons
    });
  }
}

// 4. Reading Course (40 Lessons)
{
  const cDir = path.join(BASE_DIR, '6-mchugh_oliveira_shayna_reading_course_40_lessons');
  const audioDir = path.join(cDir, 'Reading Course_Audio');
  const textDir = path.join(cDir, 'Reading Course_Text');
  if (fs.existsSync(audioDir)) {
    const audioFiles = fs.readdirSync(audioDir).filter(f => f.endsWith('.mp3')).sort();
    const lessons = audioFiles.map((f, i) => {
      const title = f.replace(/^Lesson\s*[0-9]+\s*-\s*/i, '').replace('.mp3', '');
      const lessonPdfName = f.replace('.mp3', '.pdf');
      const pdfFullPath = path.join(textDir, lessonPdfName);
      return {
        lessonNumber: i + 1,
        title: title,
        audioPath: relPath(path.join(audioDir, f)),
        pdfPath: fs.existsSync(pdfFullPath) ? relPath(pdfFullPath) : null,
        hasAudio: true
      };
    });
    courses.push({
      id: 'shyna-reading-course',
      title: 'Reading Comprehension Course (40 Lessons)',
      author: 'Shayna Oliveira',
      category: 'Reading Comprehension',
      level: 'intermediate',
      levelLabel: 'Intermediate',
      totalLessons: lessons.length,
      lessons
    });
  }
}

// 5. Phrasal Verbs in Conversation
{
  const cDir = path.join(BASE_DIR, '8-mchugh_oliveira_shayna_phrasal_verbs_in_conversation_course');
  const textDir = path.join(cDir, 'Phrasal Verbs in Conversation Course');
  const videoDir = path.join(cDir, 'Phrasal Verbs in Conversation Course. Video');
  if (fs.existsSync(videoDir)) {
    const videoFiles = fs.readdirSync(videoDir).filter(f => f.endsWith('.mp4')).sort();
    const lessons = videoFiles.map((f, i) => {
      const title = f.replace(/^Lesson\s*[0-9]+\s*-\s*/i, '').replace('.mp4', '');
      const lessonPdfName = f.replace('.mp4', '.pdf');
      const pdfFullPath = path.join(textDir, lessonPdfName);
      return {
        lessonNumber: i + 1,
        title: title,
        videoPath: relPath(path.join(videoDir, f)),
        pdfPath: fs.existsSync(pdfFullPath) ? relPath(pdfFullPath) : relPath(path.join(textDir, 'E-Book - Phrasal Verbs in Conversation Course.pdf')),
        hasVideo: true
      };
    });
    courses.push({
      id: 'shyna-phrasal-verbs',
      title: 'Phrasal Verbs in Conversation',
      author: 'Shayna Oliveira',
      category: 'Vocabulary & Idioms',
      level: 'intermediate',
      levelLabel: 'Intermediate / Upper-Intermediate',
      totalLessons: lessons.length,
      masterPdfPath: relPath(path.join(textDir, 'E-Book - Phrasal Verbs in Conversation Course.pdf')),
      lessons
    });
  }
}

// 6. Idioms Course (300 Idioms in 30 Days)
{
  const cDir = path.join(BASE_DIR, '9-mchugh_oliveira_shayna_idioms_course_300_idioms_in_30_days_3', 'Idioms Course - 300 Idioms in 30 Days');
  const audioDir = path.join(cDir, 'Audio');
  const textDir = path.join(cDir, 'Text');
  if (fs.existsSync(audioDir)) {
    const audioFiles = fs.readdirSync(audioDir).filter(f => f.endsWith('.mp3')).sort();
    const lessons = audioFiles.map((f, i) => {
      const title = f.replace(/^Day\s*[0-9]+\s*-\s*/i, '').replace('.mp3', '');
      const lessonPdfName = f.replace('.mp3', '.pdf');
      const pdfFullPath = path.join(textDir, lessonPdfName);
      return {
        lessonNumber: i + 1,
        title: title,
        audioPath: relPath(path.join(audioDir, f)),
        pdfPath: fs.existsSync(pdfFullPath) ? relPath(pdfFullPath) : null,
        hasAudio: true
      };
    });
    courses.push({
      id: 'shyna-300-idioms',
      title: '300 Idioms in 30 Days',
      author: 'Shayna Oliveira',
      category: 'Vocabulary & Idioms',
      level: 'intermediate',
      levelLabel: 'Intermediate',
      totalLessons: lessons.length,
      lessons
    });
  }
}

// 7. Basic English Grammar
{
  const cDir = path.join(BASE_DIR, '4-Grammar', 'Basic-English-Grammar');
  if (fs.existsSync(cDir)) {
    const audioFiles = fs.readdirSync(cDir).filter(f => f.endsWith('.mp3')).sort();
    const lessons = audioFiles.map((f, i) => {
      const title = f.replace(/^[0-9]+-/, '').replace('.mp3', '').replace(/-/g, ' ');
      return {
        lessonNumber: i + 1,
        title: title,
        audioPath: relPath(path.join(cDir, f)),
        hasAudio: true
      };
    });
    courses.push({
      id: 'shyna-grammar-basic',
      title: 'Basic English Grammar Course',
      author: 'Shayna Oliveira',
      category: 'Grammar',
      level: 'starter',
      levelLabel: 'Starter / Elementary',
      totalLessons: lessons.length,
      lessons
    });
  }
}

// 8. Intermediate English Grammar
{
  const cDir = path.join(BASE_DIR, '4-Grammar', 'Intermediate-English-Grammar');
  if (fs.existsSync(cDir)) {
    const audioFiles = fs.readdirSync(cDir).filter(f => f.endsWith('.mp3')).sort();
    const lessons = audioFiles.map((f, i) => {
      const title = f.replace(/^[0-9]+-/, '').replace('.mp3', '').replace(/-/g, ' ');
      return {
        lessonNumber: i + 1,
        title: title,
        audioPath: relPath(path.join(cDir, f)),
        hasAudio: true
      };
    });
    courses.push({
      id: 'shyna-grammar-intermediate',
      title: 'Intermediate English Grammar Course',
      author: 'Shayna Oliveira',
      category: 'Grammar',
      level: 'intermediate',
      levelLabel: 'Intermediate',
      totalLessons: lessons.length,
      lessons
    });
  }
}

// 9. Listening Course
{
  const cDir = path.join(BASE_DIR, '5-Listening');
  const audioDir = path.join(cDir, 'Listening Course. Audio');
  const textDir = path.join(cDir, 'Listening Course');
  if (fs.existsSync(audioDir)) {
    const audioFiles = fs.readdirSync(audioDir).filter(f => f.endsWith('.mp3')).sort();
    const lessons = audioFiles.map((f, i) => {
      const title = f.replace(/^Lesson\s*[0-9]+\s*-\s*/i, '').replace('.mp3', '');
      return {
        lessonNumber: i + 1,
        title: title,
        audioPath: relPath(path.join(audioDir, f)),
        hasAudio: true
      };
    });
    courses.push({
      id: 'shyna-listening-course',
      title: 'English Listening & Comprehension Course',
      author: 'Shayna Oliveira',
      category: 'Listening Skills',
      level: 'intermediate',
      levelLabel: 'Intermediate',
      totalLessons: lessons.length,
      lessons
    });
  }
}

fs.writeFileSync(OUT_FILE, JSON.stringify(courses, null, 2));
console.log(`Successfully indexed ${courses.length} Espresso English courses with ${courses.reduce((a, b) => a + b.totalLessons, 0)} total lessons to ${OUT_FILE}`);
