import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Newsreader, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Sidebar } from '@/components/Navigation/Sidebar';
import { AudioPlayer } from '@/components/AudioPlayer/AudioPlayer';
import { ClientLayoutWrapper } from '@/components/Navigation/ClientLayoutWrapper';

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
  title: 'ContentFirst English — The Reading Room',
  description:
    'A quiet, focused environment for systematic English learning powered by authentic materials.',
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
      <body className="min-h-screen font-sans antialiased bg-[hsl(var(--background))] text-[hsl(var(--foreground))] selection:bg-[hsl(36_90%_75%/0.4)] dark:selection:bg-[hsl(36_80%_40%/0.5)]">
        {/* Accessible skip link */}
        <a
          href="#content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 z-50 px-4 py-2 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-semibold rounded-lg shadow-xl"
        >
          Skip to main content
        </a>

        <Sidebar />

        <ClientLayoutWrapper>
          <main id="content" tabIndex={-1} className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-32 focus:outline-none min-h-screen">
            {children}
          </main>
        </ClientLayoutWrapper>

        <AudioPlayer />
      </body>
    </html>
  );
}
