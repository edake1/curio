// Fallback career templates — used when AI generation fails
// These are intentionally absurd but plausible-sounding fictional careers

export interface CareerTemplate {
  title: string;
  prefix: string;
  suffix: string;
}

export const CAREER_TEMPLATES: CareerTemplate[] = [
  { title: 'Moisture Analyst', prefix: 'Evaluates', suffix: 'humidity levels in artisanal bread production facilities' },
  { title: 'Professional Queue Organizer', prefix: 'Coordinates', suffix: 'waiting lines at high-traffic establishments' },
  { title: 'Digital Sentiment Observer', prefix: 'Monitors', suffix: 'emotional responses to brand color palettes' },
  { title: 'Cloud Photograph Cataloger', prefix: 'Documents', suffix: 'cumulus formations for meteorological archives' },
  { title: 'Braille Menu Translator', prefix: 'Converts', suffix: 'restaurant menus into tactile dining experiences' },
  { title: 'Velvet Texture Consultant', prefix: 'Advises', suffix: 'on optimal softness levels for luxury furniture' },
  { title: 'Professional Plant Waterer', prefix: 'Maintains', suffix: 'hydration schedules for office greenery ecosystems' },
  { title: 'Bicycle Chain Lubrication Specialist', prefix: 'Ensures', suffix: 'smooth pedaling experiences for urban commuters' },
  { title: 'Silence Quality Inspector', prefix: 'Measures', suffix: 'ambient noise levels in premium recording studios' },
  { title: 'Pillow Fluffiness Evaluator', prefix: 'Tests', suffix: 'comfort ratings for boutique hotel chains worldwide' },
  { title: 'Elevator Music Curator', prefix: 'Selects', suffix: 'ambient playlists for vertical transportation experiences' },
  { title: 'Paint Drying Observer', prefix: 'Monitors', suffix: 'curing rates and surface consistency for industrial coatings' },
  { title: 'Professional Bubble Wrap Popper', prefix: 'Tests', suffix: 'air pocket integrity in protective packaging materials' },
  { title: 'Cheese Aging Therapist', prefix: 'Counsels', suffix: 'artisanal wheels through their maturation journey' },
  { title: 'Left-Handed Scissors Tester', prefix: 'Evaluates', suffix: 'ergonomic comfort for sinistral cutting instruments' },
];

export const CAREER_SKILLS: string[] = [
  'Attention to detail',
  'Patience',
  'Creative thinking',
  'Problem solving',
  'Communication skills',
  'Time management',
  'Adaptability',
  'Critical thinking',
  'Organization',
  'Empathy',
  'Analytical mind',
  'Artistic vision',
  'Technical aptitude',
  'Leadership',
  'Collaboration',
  'Precision',
  'Dedication',
  'Curiosity',
  'Resilience',
  'Perseverance',
  'Bread affinity',
  'Humidity tolerance',
  'Standing for long periods',
  'Color sensitivity',
  'Texture awareness',
  'Patience with plants',
  'Mechanical intuition',
  'Acoustic sensitivity',
  'Comfort assessment',
  'Travel willingness',
];
