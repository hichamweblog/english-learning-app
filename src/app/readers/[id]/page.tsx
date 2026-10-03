import React from 'react';
import { notFound } from 'next/navigation';
import { getReaderById, getGradedReaders } from '@/lib/content/load';
import { ReaderDetailView } from '@/components/Readers/ReaderDetailView';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  const all = getGradedReaders();
  return all.slice(0, 50).map((r) => ({ id: r.id }));
}

export default async function ReaderPage({ params }: Props) {
  const { id } = await params;
  const reader = getReaderById(id);

  if (!reader) {
    notFound();
  }

  return <ReaderDetailView reader={reader} />;
}
