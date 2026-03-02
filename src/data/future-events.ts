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
  category: 'tech' | 'space' | 'climate' | 'society' | 'science' | 'culture';
  source?: string;
}

export const FUTURE_EVENTS: FutureEvent[] = [
  // ── 2027–2029 ──────────────────────────────────────────────
  { year: 2027, event: 'Electric cars reach 30% of global new car sales', certainty: 0.85, category: 'tech', source: 'IEA Global EV Outlook' },
  { year: 2027, event: 'Global AR/VR headset sales surpass 100 million units per year', certainty: 0.6, category: 'tech' },
  { year: 2028, event: 'India becomes the world\'s most populous country officially in census', certainty: 0.95, category: 'society', source: 'UN Population Division' },
  { year: 2028, event: 'Los Angeles hosts the Summer Olympics', certainty: 0.99, category: 'culture', source: 'IOC' },
  { year: 2029, event: 'AI passes a rigorous, widely-accepted Turing test', certainty: 0.75, category: 'tech' },
  { year: 2029, event: 'First fully AI-directed feature film released in theaters', certainty: 0.5, category: 'culture' },

  // ── 2030–2039 ──────────────────────────────────────────────
  { year: 2030, event: 'First crewed mission reaches Mars orbit', certainty: 0.35, category: 'space', source: 'NASA/SpaceX timelines' },
  { year: 2030, event: 'Renewable energy exceeds 50% of global electricity generation', certainty: 0.7, category: 'climate', source: 'IEA' },
  { year: 2030, event: 'China overtakes the US as the world\'s largest economy by GDP', certainty: 0.65, category: 'society', source: 'PwC/World Bank projections' },
  { year: 2031, event: 'Brain-computer interfaces enable paralyzed patients to type by thought', certainty: 0.7, category: 'science', source: 'Neuralink/BCI research' },
  { year: 2032, event: 'Self-driving cars operate without safety drivers in major cities', certainty: 0.65, category: 'tech' },
  { year: 2032, event: 'Brisbane hosts the Summer Olympics', certainty: 0.99, category: 'culture', source: 'IOC' },
  { year: 2033, event: 'First human walks on Mars', certainty: 0.25, category: 'space' },
  { year: 2034, event: 'Global e-commerce exceeds 50% of all retail sales', certainty: 0.6, category: 'society' },
  { year: 2035, event: 'AI-authored work wins a major literary award', certainty: 0.6, category: 'culture' },
  { year: 2035, event: 'Lab-grown meat reaches price parity with conventional meat', certainty: 0.55, category: 'science' },
  { year: 2035, event: 'Last new petrol-only car sold in the European Union', certainty: 0.75, category: 'climate', source: 'EU regulation' },
  { year: 2036, event: 'Quantum computers solve problems no classical computer ever could in practice', certainty: 0.5, category: 'tech' },
  { year: 2038, event: 'Average smartphone has more processing power than a 2020 supercomputer', certainty: 0.7, category: 'tech' },

  // ── 2040–2049 ──────────────────────────────────────────────
  { year: 2040, event: 'First commercial fusion power plant delivers electricity to the grid', certainty: 0.4, category: 'science' },
  { year: 2040, event: 'World population of people over 65 exceeds those under 15', certainty: 0.7, category: 'society', source: 'UN Population Division' },
  { year: 2042, event: 'Artificial organs grown from patient\'s own cells become routine', certainty: 0.45, category: 'science' },
  { year: 2045, event: 'AI systems match human-level general reasoning across domains', certainty: 0.35, category: 'tech' },
  { year: 2045, event: 'Vertical farms produce 10% of the world\'s vegetables', certainty: 0.4, category: 'climate' },
  { year: 2048, event: 'Arctic experiences its first ice-free summer', certainty: 0.55, category: 'climate', source: 'IPCC AR6' },

  // ── 2050–2059 ──────────────────────────────────────────────
  { year: 2050, event: 'First permanent human settlement on Mars', certainty: 0.3, category: 'space' },
  { year: 2050, event: 'Global temperatures reach +2°C above pre-industrial levels', certainty: 0.6, category: 'climate', source: 'IPCC AR6' },
  { year: 2050, event: 'World population peaks near 9.7 billion and begins to decline', certainty: 0.55, category: 'society', source: 'UN / Lancet projections' },
  { year: 2052, event: 'Most new knowledge workers have an AI "co-pilot" managing their schedule', certainty: 0.5, category: 'tech' },
  { year: 2055, event: 'Majority of new buildings are 3D-printed or robotically assembled', certainty: 0.4, category: 'tech' },

  // ── 2060–2079 ──────────────────────────────────────────────
  { year: 2060, event: 'Last new internal combustion engine car rolls off an assembly line', certainty: 0.55, category: 'tech' },
  { year: 2065, event: 'First child receives a fully synthetic genome edit before birth', certainty: 0.3, category: 'science' },
  { year: 2070, event: 'Average human lifespan exceeds 90 in developed nations', certainty: 0.4, category: 'science' },
  { year: 2075, event: 'First human born on another planet', certainty: 0.2, category: 'space' },

  // ── 2080+ ──────────────────────────────────────────────────
  { year: 2080, event: 'Ocean levels have risen enough to submerge several island nations', certainty: 0.5, category: 'climate', source: 'IPCC' },
  { year: 2085, event: 'Humans establish a permanent presence beyond the inner solar system', certainty: 0.15, category: 'space' },
  { year: 2100, event: 'World population stabilizes near 10 billion', certainty: 0.6, category: 'society', source: 'UN Population Division' },
];
