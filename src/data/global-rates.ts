// Global statistics rates — per-second estimates
// Used by the "While You Were Here" mini-app
//
// Sources & methodology:
// - Births/Deaths: UN Population Division (2024 revision) — ~385K births/day, ~170K deaths/day
// - Emails: Radicati Group Email Statistics Report 2024 — ~333B emails/day
// - Google searches: Internet Live Stats / Alphabet quarterly reports
// - Tweets/posts: X/Twitter public metrics, estimated ~500M posts/day
// - Pizzas: National Association of Pizzeria Operators + global extrapolation
// - YouTube: YouTube official blog (500 hours uploaded per minute)
// - Instagram: Meta quarterly reports
// - Lightning: NOAA/Global Lightning Detection estimates
//
// These are ESTIMATES and should be annotated as such in the UI.
// Last reviewed: 2024-Q4

export interface GlobalRate {
  key: string;
  label: string;
  emoji: string;
  color: string;
  perSecond: number;
  source: string;
}

/** Display config for derived net-population counter */
export const NET_POPULATION_DISPLAY = {
  key: 'netPopulation',
  emoji: '📈',
  label: 'Net population',
  color: 'text-emerald-400',
  prefix: '+',
} as const;

export const GLOBAL_RATES: GlobalRate[] = [
  { key: 'births', label: 'Babies born', emoji: '👶', color: 'text-emerald-400', perSecond: 4.3, source: 'UN Population Division' },
  { key: 'deaths', label: 'Deaths', emoji: '🕊️', color: 'text-zinc-400', perSecond: 1.8, source: 'UN Population Division' },
  { key: 'emails', label: 'Emails sent', emoji: '📧', color: 'text-blue-400', perSecond: 3_858_024, source: 'Radicati Group' },
  { key: 'tweets', label: 'Posts on X', emoji: '🐦', color: 'text-sky-400', perSecond: 5_787, source: 'X/Twitter estimates' },
  { key: 'googleSearches', label: 'Google searches', emoji: '🔍', color: 'text-yellow-400', perSecond: 99_000, source: 'Internet Live Stats' },
  { key: 'pizzas', label: 'Pizzas ordered', emoji: '🍕', color: 'text-orange-400', perSecond: 350, source: 'Industry estimates' },
  { key: 'youtubeHours', label: 'YouTube hours uploaded', emoji: '▶️', color: 'text-red-400', perSecond: 500, source: 'YouTube Blog' },
  { key: 'lightningStrikes', label: 'Lightning strikes', emoji: '⚡', color: 'text-purple-400', perSecond: 100, source: 'NOAA' },
];

// Helper: compute stats for given elapsed seconds
export function computeGlobalStats(elapsedSeconds: number): Record<string, number> {
  const stats: Record<string, number> = {};
  for (const rate of GLOBAL_RATES) {
    stats[rate.key] = Math.floor(elapsedSeconds * rate.perSecond);
  }
  stats.netPopulation = Math.floor(
    elapsedSeconds * (GLOBAL_RATES[0].perSecond - GLOBAL_RATES[1].perSecond)
  );
  return stats;
}
