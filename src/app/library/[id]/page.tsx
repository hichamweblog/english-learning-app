import React from 'react';
import { notFound } from 'next/navigation';
import { getReferenceBookById, getReferenceBooks } from '@/lib/content/load';
import { ReferenceDetailView } from '@/components/Library/ReferenceDetailView';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  const all = getReferenceBooks();
  return all.map((b) => ({ id: b.id }));
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const book = getReferenceBookById(id);
  if (!book) return { title: 'Reference Book Not Found' };

  return {
    title: `${book.title} — ContentFirst English`,
    description: `Interactive reference folio and pedagogical guide for ${book.title}.`,
  };
}

export default async function ReferenceBookPage({ params }: Props) {
  const { id } = await params;
  const book = getReferenceBookById(id);

  if (!book) {
    notFound();
  }

  return <ReferenceDetailView book={book} />;
}
