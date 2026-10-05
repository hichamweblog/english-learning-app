export interface AlignedWord {
  id: string; // e.g. "p1w1"
  text: string;
  start: number; // seconds
  end: number; // seconds
}

export interface AlignedParagraph {
  id: string; // e.g. "p1"
  start: number;
  end: number;
  text: string;
  words: AlignedWord[];
}

export interface SectionAlignment {
  sectionId: string; // e.g. "reader-2-beauty-and-the-beast-ch-1"
  trackNumber: number;
  audioPath: string;
  totalDuration: number;
  paragraphs: AlignedParagraph[];
}
