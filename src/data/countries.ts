// Life expectancy by country — Source: WHO World Health Statistics 2024
// https://www.who.int/data/gho/data/indicators/indicator-details/GHO/life-expectancy-at-birth-(years)
// Last updated: 2024 estimates

export interface CountryLifeData {
  lifeExpectancy: number;
  workHoursPerWeek: number;
  avgChildren: number;
  avgIncome: string;
  primaryLanguage: string;
  funFact: string;
}

export const LIFE_EXPECTANCY: Record<string, number> = {
  // East Asia & Pacific
  'Japan': 84.6,
  'Singapore': 83.8,
  'South Korea': 82.7,
  'Australia': 83.4,
  'New Zealand': 82.3,
  'China': 77.1,
  'Thailand': 77.7,
  'Vietnam': 75.4,
  'Malaysia': 76.2,
  'Indonesia': 71.9,
  'Philippines': 71.2,

  // Europe
  'Switzerland': 83.9,
  'Spain': 83.6,
  'Italy': 83.5,
  'Iceland': 83.1,
  'Sweden': 82.8,
  'France': 82.7,
  'Norway': 82.4,
  'Netherlands': 82.3,
  'Ireland': 82.3,
  'Finland': 81.9,
  'Germany': 81.3,
  'United Kingdom': 81.2,
  'Belgium': 81.4,
  'Austria': 81.6,
  'Portugal': 81.1,
  'Denmark': 81.3,
  'Greece': 80.7,
  'Czech Republic': 79.3,
  'Poland': 78.7,
  'Romania': 76.0,
  'Hungary': 76.7,
  'Russia': 72.6,
  'Ukraine': 73.6,

  // Americas
  'Canada': 82.5,
  'United States': 78.5,
  'Chile': 80.2,
  'Costa Rica': 80.3,
  'Cuba': 78.8,
  'Mexico': 75.1,
  'Brazil': 76.4,
  'Colombia': 77.3,
  'Argentina': 76.5,
  'Peru': 76.7,

  // Middle East & Africa
  'Israel': 82.9,
  'United Arab Emirates': 78.2,
  'Saudi Arabia': 76.9,
  'Turkey': 77.7,
  'Iran': 76.7,
  'Egypt': 72.0,
  'South Africa': 64.9,
  'Kenya': 66.7,
  'Ethiopia': 66.6,
  'Nigeria': 54.7,
  'Ghana': 64.1,
  'Morocco': 76.7,
  'Tunisia': 76.7,

  // South Asia
  'India': 70.4,
  'Sri Lanka': 77.0,
  'Bangladesh': 72.4,
  'Pakistan': 67.3,
  'Nepal': 71.0,
};

// Detailed country stats — Sources: OECD, World Bank, ILO
// Income figures: World Bank GNI per capita (Atlas method), 2023
// Work hours: OECD/ILO estimates, 2023
// Fertility: World Bank, 2022
export const COUNTRY_STATS: Record<string, CountryLifeData> = {
  'Japan': {
    lifeExpectancy: 84.6,
    workHoursPerWeek: 60,
    avgChildren: 1.3,
    avgIncome: '$42,000',
    primaryLanguage: 'Japanese',
    funFact: 'You would bow approximately 10,000 times a year.',
  },
  'United States': {
    lifeExpectancy: 78.5,
    workHoursPerWeek: 40,
    avgChildren: 1.6,
    avgIncome: '$65,000',
    primaryLanguage: 'English',
    funFact: 'You would have moved 11 times on average.',
  },
  'India': {
    lifeExpectancy: 70.4,
    workHoursPerWeek: 48,
    avgChildren: 2.0,
    avgIncome: '$8,000',
    primaryLanguage: 'Hindi + English',
    funFact: 'You would likely be vegetarian at least 3 days a week.',
  },
  'Germany': {
    lifeExpectancy: 81.3,
    workHoursPerWeek: 35,
    avgChildren: 1.5,
    avgIncome: '$52,000',
    primaryLanguage: 'German',
    funFact: 'You would have 30 days paid vacation by law.',
  },
  'Brazil': {
    lifeExpectancy: 76.4,
    workHoursPerWeek: 42,
    avgChildren: 1.7,
    avgIncome: '$15,000',
    primaryLanguage: 'Portuguese',
    funFact: 'You would have celebrated Carnival every single year.',
  },
  'China': {
    lifeExpectancy: 77.1,
    workHoursPerWeek: 55,
    avgChildren: 1.2,
    avgIncome: '$18,000',
    primaryLanguage: 'Mandarin',
    funFact: 'You would use WeChat for almost everything.',
  },
  'France': {
    lifeExpectancy: 82.7,
    workHoursPerWeek: 35,
    avgChildren: 1.8,
    avgIncome: '$45,000',
    primaryLanguage: 'French',
    funFact: 'You would have 5 weeks paid vacation by law.',
  },
  'United Kingdom': {
    lifeExpectancy: 81.2,
    workHoursPerWeek: 37,
    avgChildren: 1.7,
    avgIncome: '$48,000',
    primaryLanguage: 'English',
    funFact: 'You would have drunk approximately 874 cups of tea per year.',
  },
  'Australia': {
    lifeExpectancy: 83.4,
    workHoursPerWeek: 38,
    avgChildren: 1.8,
    avgIncome: '$55,000',
    primaryLanguage: 'English',
    funFact: 'You would have seen 8 of the world\'s 10 most venomous snakes.',
  },
  'South Korea': {
    lifeExpectancy: 82.7,
    workHoursPerWeek: 52,
    avgChildren: 0.8,
    avgIncome: '$38,000',
    primaryLanguage: 'Korean',
    funFact: 'You would have the fastest home internet in the world.',
  },
  'Nigeria': {
    lifeExpectancy: 54.7,
    workHoursPerWeek: 50,
    avgChildren: 5.2,
    avgIncome: '$5,500',
    primaryLanguage: 'English + Hausa/Yoruba/Igbo',
    funFact: 'You would be among the youngest population on Earth — median age 18.',
  },
  'Mexico': {
    lifeExpectancy: 75.1,
    workHoursPerWeek: 45,
    avgChildren: 1.8,
    avgIncome: '$20,000',
    primaryLanguage: 'Spanish',
    funFact: 'You would celebrate Day of the Dead every November.',
  },
  'Canada': {
    lifeExpectancy: 82.5,
    workHoursPerWeek: 37,
    avgChildren: 1.4,
    avgIncome: '$52,000',
    primaryLanguage: 'English + French',
    funFact: 'You would live within 100 miles of the U.S. border, like 90% of Canadians.',
  },
  'Russia': {
    lifeExpectancy: 72.6,
    workHoursPerWeek: 40,
    avgChildren: 1.5,
    avgIncome: '$28,000',
    primaryLanguage: 'Russian',
    funFact: 'You would span 11 time zones from home.',
  },
  'South Africa': {
    lifeExpectancy: 64.9,
    workHoursPerWeek: 43,
    avgChildren: 2.3,
    avgIncome: '$13,000',
    primaryLanguage: 'One of 11 official languages',
    funFact: 'You would live in a country with 11 official languages.',
  },
  'Sweden': {
    lifeExpectancy: 82.8,
    workHoursPerWeek: 33,
    avgChildren: 1.7,
    avgIncome: '$56,000',
    primaryLanguage: 'Swedish',
    funFact: 'You would have 480 days of paid parental leave per child.',
  },
  'Singapore': {
    lifeExpectancy: 83.8,
    workHoursPerWeek: 45,
    avgChildren: 1.0,
    avgIncome: '$65,000',
    primaryLanguage: 'English + Mandarin + Malay + Tamil',
    funFact: 'You would live in a country smaller than most cities.',
  },
  'Turkey': {
    lifeExpectancy: 77.7,
    workHoursPerWeek: 47,
    avgChildren: 1.9,
    avgIncome: '$28,000',
    primaryLanguage: 'Turkish',
    funFact: 'You would drink an average of 3.5 cups of tea per day.',
  },
  'Thailand': {
    lifeExpectancy: 77.7,
    workHoursPerWeek: 42,
    avgChildren: 1.3,
    avgIncome: '$17,000',
    primaryLanguage: 'Thai',
    funFact: 'You would wai (bow with palms together) dozens of times per day.',
  },
  'Argentina': {
    lifeExpectancy: 76.5,
    workHoursPerWeek: 38,
    avgChildren: 1.9,
    avgIncome: '$22,000',
    primaryLanguage: 'Spanish',
    funFact: 'You would eat an average of 120 pounds of beef per year.',
  },
};

export const DEFAULT_COUNTRY_STATS: CountryLifeData = {
  lifeExpectancy: 73.3, // Global average (WHO 2024)
  workHoursPerWeek: 44,
  avgChildren: 2.3,
  avgIncome: '$18,000',
  primaryLanguage: 'Local language',
  funFact: 'You would have a completely unique life story.',
};

// Shared defaults used across multiple mini-apps
export const DEFAULT_COUNTRY = 'United States';
export const DEFAULT_BIRTH_YEAR = 1990;
export const DEFAULT_AGE = 30;
export const BIRTH_YEAR_MIN = 1940;
export const BIRTH_YEAR_MAX = new Date().getFullYear();
export const WEEKS_PER_YEAR = 52.14;
