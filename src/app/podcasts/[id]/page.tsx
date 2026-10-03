import React from 'react';
import { notFound } from 'next/navigation';
import { getPodcastById, getAllPodcastEpisodes } from '@/lib/content/load';
import { EpisodeStudyView } from '@/components/Podcasts/EpisodeStudyView';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  const all = getAllPodcastEpisodes();
  // Generate first 100 statically for ultra fast build, rest handled dynamically
  return all.slice(0, 100).map((ep) => ({ id: ep.id }));
}

export default async function EpisodePage({ params }: Props) {
  const { id } = await params;
  const episode = getPodcastById(id);

  if (!episode) {
    notFound();
  }

  // Find prev/next in same series
  const all = getAllPodcastEpisodes();
  const seriesEpisodes = all.filter((e) => e.series === episode.series);
  const currentIdx = seriesEpisodes.findIndex((e) => e.id === episode.id);
  const prevEp = currentIdx > 0 ? seriesEpisodes[currentIdx - 1] : null;
  const nextEp = currentIdx < seriesEpisodes.length - 1 ? seriesEpisodes[currentIdx + 1] : null;

  return (
    <EpisodeStudyView
      episode={episode}
      prevEpisode={prevEp}
      nextEpisode={nextEp}
    />
  );
}
