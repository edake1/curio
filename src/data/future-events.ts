// Future events — curated predictions with likelihood estimates
// Sources: Various futurist publications, NASA timelines, IEA reports, UN projections
// Certainty scores are subjective editorial estimates, not scientific predictions
//
// NOTE: Events should be periodically reviewed and updated.
// Filter out events whose year has passed before displaying to users.

export interface FutureEvent {
  year: number;
  event: string;
  certainty: number; // 0-1 likelihood estimate
  source?: string;
}

export const FUTURE_EVENTS: FutureEvent[] = [
  { year: 2027, event: 'Electric cars reach 30% of global new car sales', certainty: 0.85, source: 'IEA Global EV Outlook' },
  { year: 2028, event: 'India becomes the world\'s most populous country officially in census', certainty: 0.95, source: 'UN Population Division' },
  { year: 2029, event: 'AI passes a rigorous, widely-accepted Turing test', certainty: 0.75 },
  { year: 2030, event: 'First crewed mission reaches Mars orbit', certainty: 0.35, source: 'NASA/SpaceX timelines' },
  { year: 2030, event: 'Renewable energy exceeds 50% of global electricity generation', certainty: 0.7, source: 'IEA' },
  { year: 2032, event: 'Self-driving cars operate without safety drivers in major cities', certainty: 0.65 },
  { year: 2035, event: 'AI-authored work wins a major literary award', certainty: 0.6 },
  { year: 2035, event: 'Lab-grown meat reaches price parity with conventional meat', certainty: 0.55 },
  { year: 2040, event: 'First commercial fusion power plant delivers electricity to the grid', certainty: 0.4 },
  { year: 2040, event: 'World population of people over 65 exceeds those under 15', certainty: 0.7, source: 'UN Population Division' },
  { year: 2045, event: 'AI systems match human-level general reasoning across domains', certainty: 0.35 },
  { year: 2050, event: 'First permanent human settlement on Mars', certainty: 0.3 },
  { year: 2050, event: 'Global temperatures reach +2°C above pre-industrial levels', certainty: 0.6, source: 'IPCC AR6' },
  { year: 2055, event: 'Majority of new buildings are 3D-printed or robotically assembled', certainty: 0.4 },
  { year: 2060, event: 'Last new internal combustion engine car rolls off an assembly line', certainty: 0.55 },
  { year: 2070, event: 'Average human lifespan exceeds 90 in developed nations', certainty: 0.4 },
  { year: 2075, event: 'First human born on another planet', certainty: 0.2 },
  { year: 2080, event: 'Ocean levels have risen enough to submerge several island nations', certainty: 0.5, source: 'IPCC' },
  { year: 2100, event: 'World population stabilizes near 10 billion', certainty: 0.6, source: 'UN Population Division' },
];
