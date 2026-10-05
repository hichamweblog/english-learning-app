import React from 'react';
import { getCourses } from '@/lib/content/load';
import { CourseBrowser } from '@/components/Courses/CourseBrowser';

export const metadata = {
  title: 'Espresso English Courses — ContentFirst English',
  description:
    'Comprehensive audio, video, and PDF curriculum by Shayna Oliveira: Everyday English Speaking, Business English, Phrasal Verbs, Grammar, and Listening mastery.',
};

export default function CoursesPage() {
  const courses = getCourses();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl sm:text-4xl font-normal tracking-tight text-stone-900 dark:text-stone-50">
          Curated English Courses
        </h1>
        <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1">
          Structured pedagogical courses with synchronized audio lessons, native MP4 video lectures, and PDF coursebooks.
        </p>
      </div>

      <CourseBrowser initialCourses={courses} />
    </div>
  );
}
