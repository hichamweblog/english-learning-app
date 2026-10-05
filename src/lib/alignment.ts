import type { AlignedParagraph, SectionAlignment } from '@/types/alignment';

export type AlignmentCapability = 'unavailable' | 'paragraph' | 'word';

function isAlignedParagraph(value: unknown): value is AlignedParagraph {
  if (!value || typeof value !== 'object') return false;
  const paragraph = value as Partial<AlignedParagraph>;
  return (
    typeof paragraph.id === 'string' &&
    typeof paragraph.start === 'number' &&
    typeof paragraph.end === 'number' &&
    typeof paragraph.text === 'string' &&
    Array.isArray(paragraph.words) &&
    paragraph.words.every(
      (word) =>
        !!word &&
        typeof word === 'object' &&
        typeof (word as { id?: unknown }).id === 'string' &&
        typeof (word as { text?: unknown }).text === 'string' &&
        typeof (word as { start?: unknown }).start === 'number' &&
        typeof (word as { end?: unknown }).end === 'number'
    )
  );
}

export function isSectionAlignment(value: unknown): value is SectionAlignment {
  if (!value || typeof value !== 'object') return false;
  const alignment = value as Partial<SectionAlignment>;
  return (
    typeof alignment.sectionId === 'string' &&
    Array.isArray(alignment.paragraphs) &&
    alignment.paragraphs.length > 0 &&
    alignment.paragraphs.every(isAlignedParagraph)
  );
}

export function getAlignmentCapability(
  alignment: SectionAlignment | null | undefined
): AlignmentCapability {
  if (!alignment || !isSectionAlignment(alignment)) return 'unavailable';
  return alignment.paragraphs.some((paragraph) => paragraph.words.length > 0)
    ? 'word'
    : 'paragraph';
}
