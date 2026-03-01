// Life statistics — physiological rates used by the "Life Stats" mini-app
//
// Sources:
// - Heartbeats: AHA average resting heart rate (60-100 bpm, median ~72)
// - Breaths: NIH normal adult respiratory rate (12-20/min, avg ~16)
// - Blinks: Harvard Eye Research Center (~15-20/min, avg ~15)
// - Dreams: National Sleep Foundation (~4-6 dreams/night → ~0.1/hr over 24h)
// - Laughs: Psychology Today (~15 laughs per day for an average adult)
//
// Last reviewed: 2024-Q4

// Time conversion constants (milliseconds)
export const MS_PER_DAY = 86_400_000;
export const MS_PER_HOUR = 3_600_000;
export const MS_PER_MINUTE = 60_000;

export interface LifeStat {
  key: string;
  label: string;
  emoji: string;
  color: string;
  /** Rate unit: how many times per the given unit */
  rate: number;
  /** Which time unit the rate is measured in */
  unit: 'perMinute' | 'perHour' | 'perDay';
}

export const LIFE_STATS: LifeStat[] = [
  // Physiological — per minute
  { key: 'heartbeats', label: 'Heartbeats',    emoji: '💓', color: 'text-rose-400',    rate: 72,     unit: 'perMinute' },
  { key: 'breaths',    label: 'Breaths',       emoji: '🫁', color: 'text-sky-400',     rate: 16,     unit: 'perMinute' },
  { key: 'blinks',     label: 'Blinks',        emoji: '👁️', color: 'text-violet-400',  rate: 15,     unit: 'perMinute' },
  // Sleep/dreams — per hour
  { key: 'dreams',     label: 'Dreams',        emoji: '💭', color: 'text-indigo-400',  rate: 0.1,    unit: 'perHour'   },
  // Daily
  { key: 'laughs',     label: 'Laughs',        emoji: '😂', color: 'text-amber-400',   rate: 15,     unit: 'perDay'    },
  { key: 'steps',      label: 'Steps Walked',  emoji: '👟', color: 'text-emerald-400', rate: 8_000,  unit: 'perDay'    },
  { key: 'words',      label: 'Words Spoken',  emoji: '💬', color: 'text-yellow-400',  rate: 16_000, unit: 'perDay'    },
  { key: 'sleep',      label: 'Hrs Slept',     emoji: '🌙', color: 'text-blue-400',    rate: 8,      unit: 'perDay'    },
  { key: 'meals',      label: 'Meals Eaten',   emoji: '🍽️', color: 'text-orange-300',  rate: 3,      unit: 'perDay'    },
];

/** Compute a life stat total given elapsed milliseconds */
export function computeLifeStat(stat: LifeStat, elapsedMs: number): number {
  switch (stat.unit) {
    case 'perMinute': return Math.floor((elapsedMs / MS_PER_MINUTE) * stat.rate);
    case 'perHour':   return Math.floor((elapsedMs / MS_PER_HOUR) * stat.rate);
    case 'perDay':    return Math.floor((elapsedMs / MS_PER_DAY) * stat.rate);
  }
}
