import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAmericanAccentExtractedData, getAmericanAccentLessonById, getAmericanAccentLessons } from '@/lib/content/load';
import { AccentLessonView } from '@/components/Accent/AccentLessonView';

export function generateStaticParams() {
  return getAmericanAccentLessons().map((lesson) => ({ id: lesson.id }));
}

export function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  return params.then(({ id }) => {
    const lesson = getAmericanAccentLessonById(id);
    return lesson ? { title: `${lesson.title} — American Accent Studio` } : {};
  });
}

export default async function AccentLessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lesson = getAmericanAccentLessonById(id);
  if (!lesson) notFound();

  const extracted = getAmericanAccentExtractedData(id);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link href="/accent" className="text-sm font-semibold text-amber-700 hover:underline dark:text-amber-400">
        ← Back to Accent Studio
      </Link>
      <AccentLessonView lesson={lesson} transcript={extracted?.content || ''} />
    </div>
  );
}
