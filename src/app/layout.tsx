import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Newsreader, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/Navigation/Navbar';
import { AudioPlayer } from '@/components/AudioPlayer/AudioPlayer';

const sans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});

const serif = Newsreader({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-serif',
  style: ['normal', 'italic'],
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'ContentFirst English — Educational Library & Player',
  description:
    'Systematic English learning platform powered by authentic materials: 4,320+ audio episodes, graded readers, pronunciation courses, and reference library.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${sans.variable} ${serif.variable} ${mono.variable}`}
    >
      <body className="min-h-screen font-sans antialiased selection:bg-amber-200 selection:text-neutral-900 dark:selection:bg-amber-900/60 dark:selection:text-amber-100 flex flex-col">
        {/* Accessible skip link per modern web guidance */}
        <a
          href="#content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 z-50 px-4 py-2 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-semibold rounded-lg shadow-xl"
        >
          Skip to main content
        </a>

        <Navbar />

        <main id="content" tabIndex={-1} className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-32 focus:outline-none">
          {children}
        </main>

        <AudioPlayer />
      </body>
    </html>
  );
}
