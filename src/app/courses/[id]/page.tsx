import React from 'react';
import { notFound } from 'next/navigation';
import { getCourseById, getCourses } from '@/lib/content/load';
import { CourseDetailView } from '@/components/Courses/CourseDetailView';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  const all = getCourses();
  return all.map((c) => ({ id: c.id }));
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const course = getCourseById(id);
  if (!course) return { title: 'Course Not Found — ContentFirst English' };

  return {
    title: `${course.title} — ContentFirst English`,
    description: `Structured lessons, native audio, video modules, and coursebooks for ${course.title} by ${course.author}.`,
  };
}

export default async function CourseDetailPage({ params }: Props) {
  const { id } = await params;
  const course = getCourseById(id);

  if (!course) {
    notFound();
  }

  return <CourseDetailView course={course} />;
}
