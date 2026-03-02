// Historical moments for The Rewind app
// Each moment is revealed line-by-line with dramatic pacing

export interface HistoricalMoment {
  year: number;
  location: string;
  lines: string[];        // revealed one at a time
  reflection: string;     // shown after all lines
  category: 'war' | 'science' | 'culture' | 'disaster' | 'revolution' | 'exploration' | 'invention';
}

export const HISTORICAL_MOMENTS: HistoricalMoment[] = [
  // ── WAR ────────────────────────────────────────
  {
    year: 1945,
    location: 'Hiroshima, Japan',
    lines: [
      'It is 8:15 in the morning.',
      'Children are walking to school.',
      'A single plane flies overhead.',
      'For a fraction of a second, the sky turns white.',
      '80,000 people cease to exist.',
      'The shadows they leave behind are burned into the concrete.',
    ],
    reflection: 'The world entered the atomic age in 43 seconds.',
    category: 'war',
  },
  {
    year: 1916,
    location: 'The Somme, France',
    lines: [
      'It is the first day of the battle.',
      'Officers blow their whistles at 7:30 AM.',
      '60,000 men climb out of the trenches.',
      'They walk slowly across no man\'s land.',
      'By nightfall, 19,240 of them are dead.',
      'The battle will continue for 141 more days.',
    ],
    reflection: 'The longest day of the longest war the world had known.',
    category: 'war',
  },
  {
    year: 1944,
    location: 'Normandy, France',
    lines: [
      'It is still dark. The English Channel is rough.',
      '156,000 men are packed into 5,000 ships.',
      'Many of them are teenagers.',
      'The ramps drop. The water is chest-deep.',
      'The first wave reaches the sand.',
      'By sunset, the beach is taken. 4,400 never leave it.',
    ],
    reflection: 'The beginning of the end, paid for in blood and saltwater.',
    category: 'war',
  },

  // ── SCIENCE ────────────────────────────────────
  {
    year: 1969,
    location: 'Sea of Tranquility, The Moon',
    lines: [
      'The fuel gauge reads 25 seconds remaining.',
      'Armstrong takes manual control.',
      'He guides the lander over a boulder field.',
      'Contact light.',
      'A boot presses into grey dust.',
      '600 million people hold their breath at the same time.',
    ],
    reflection: 'For one moment, every human alive shared the same sky.',
    category: 'science',
  },
  {
    year: 1928,
    location: 'London, England',
    lines: [
      'A scientist returns from holiday.',
      'He notices mold growing on a petri dish.',
      'Around the mold, the bacteria are dead.',
      'He almost throws it away.',
      'Instead, he writes a short note about it.',
      'That mold will go on to save 200 million lives.',
    ],
    reflection: 'Alexander Fleming\'s "mistake" became penicillin.',
    category: 'science',
  },
  {
    year: 1953,
    location: 'Cambridge, England',
    lines: [
      'Two men walk into a pub.',
      'One announces they have found the secret of life.',
      'Nobody believes them.',
      'On a chalkboard, they sketch a twisted ladder.',
      'The double helix.',
      'Every living thing on Earth carries this shape inside it.',
    ],
    reflection: 'Watson and Crick decoded the blueprint of biology over lunch.',
    category: 'science',
  },
  {
    year: 1905,
    location: 'Bern, Switzerland',
    lines: [
      'A 26-year-old patent clerk rides a tram to work.',
      'He stares at the clock tower as it shrinks behind him.',
      'He imagines riding a beam of light away from it.',
      'The clock would appear to stop.',
      'He writes four papers that year.',
      'Each one rewrites the laws of the universe.',
    ],
    reflection: 'Einstein\'s miracle year began with a daydream on a tram.',
    category: 'science',
  },

  // ── CULTURE ────────────────────────────────────
  {
    year: 1977,
    location: 'Memphis, Tennessee',
    lines: [
      'A man collapses on his bathroom floor.',
      'He is 42 years old.',
      'Once, he shook his hips and the world lost its mind.',
      'He sold more records than anyone in history.',
      'The ambulance arrives too late.',
      'Around the world, radios fall silent, then play only him.',
    ],
    reflection: 'Elvis left the building for the last time.',
    category: 'culture',
  },
  {
    year: 1889,
    location: 'Arles, France',
    lines: [
      'A painter with red hair stares at a wheat field.',
      'The crows circle overhead.',
      'He has sold exactly one painting in his life.',
      'He paints faster now — sometimes one per day.',
      'He will not live to see his 38th birthday.',
      'His paintings will eventually sell for $100 million each.',
    ],
    reflection: 'Van Gogh painted 900 works. The world didn\'t notice until he was gone.',
    category: 'culture',
  },
  {
    year: 1963,
    location: 'Washington, D.C.',
    lines: [
      '250,000 people stand in the August heat.',
      'A preacher steps to the microphone.',
      'He sets aside his prepared speech.',
      'Mahalia Jackson calls from the crowd: "Tell them about the dream!"',
      'He grips the podium.',
      '"I have a dream…"',
    ],
    reflection: 'Martin Luther King Jr. ad-libbed the most famous speech in American history.',
    category: 'culture',
  },

  // ── DISASTER ───────────────────────────────────
  {
    year: 1912,
    location: 'North Atlantic Ocean',
    lines: [
      'The largest ship ever built is four days into its first voyage.',
      'The night is calm. The water is flat as glass.',
      'A lookout sees something in the darkness.',
      'He rings the bell three times.',
      'The ship turns — but not fast enough.',
      'In 2 hours and 40 minutes, it is gone. 1,517 people with it.',
    ],
    reflection: 'The Titanic was called unsinkable. The ocean disagreed.',
    category: 'disaster',
  },
  {
    year: 1986,
    location: 'Pripyat, Ukraine',
    lines: [
      'It is 1:23 in the morning.',
      'Engineers are running a safety test on Reactor No. 4.',
      'Someone presses the emergency shutdown button.',
      'Instead of stopping, the reactor surges to 100x its capacity.',
      'The 1,000-ton lid lifts into the air.',
      'The radiation released equals 400 Hiroshimas.',
    ],
    reflection: 'Chernobyl turned a city of 50,000 into a ghost town overnight.',
    category: 'disaster',
  },
  {
    year: 79,
    location: 'Pompeii, Roman Empire',
    lines: [
      'The mountain has been rumbling for days.',
      'Most people ignore it.',
      'At noon, Vesuvius splits open.',
      'A column of ash rises 33 kilometers into the sky.',
      'Superheated gas rolls down the mountain at 700°C.',
      '2,000 people are frozen in place — some still eating lunch.',
    ],
    reflection: 'Pompeii was forgotten for 1,700 years. Then someone started digging.',
    category: 'disaster',
  },

  // ── REVOLUTION ─────────────────────────────────
  {
    year: 1789,
    location: 'Paris, France',
    lines: [
      'Bread costs more than a day\'s wages.',
      'A crowd gathers outside a medieval fortress.',
      'The guards fire into the crowd.',
      'The crowd does not run.',
      'By afternoon, the fortress is theirs.',
      'The governor\'s head is carried through the streets on a pike.',
    ],
    reflection: 'The Bastille fell, and a monarchy crumbled with it.',
    category: 'revolution',
  },
  {
    year: 1989,
    location: 'Berlin, Germany',
    lines: [
      'A government spokesman gives a confused press conference.',
      '"When does the border open?" a reporter asks.',
      'He shuffles his papers. "Immediately, I suppose."',
      'Thousands walk to the wall.',
      'The guards, outnumbered, step aside.',
      'Strangers on both sides embrace and weep.',
    ],
    reflection: 'The Berlin Wall fell because of a bureaucratic mistake.',
    category: 'revolution',
  },
  {
    year: 1955,
    location: 'Montgomery, Alabama',
    lines: [
      'A seamstress boards a city bus after work.',
      'She sits in the middle section.',
      'The driver tells her to move.',
      'She says no.',
      'She is arrested.',
      'For the next 381 days, 40,000 Black citizens refuse to ride the bus.',
    ],
    reflection: 'Rosa Parks sat down so a movement could stand up.',
    category: 'revolution',
  },

  // ── EXPLORATION ────────────────────────────────
  {
    year: 1492,
    location: 'The Atlantic Ocean',
    lines: [
      'Three small ships have been at sea for 71 days.',
      'The crew is talking about turning back.',
      'A sailor spots a branch floating in the water.',
      'Then a carved stick.',
      'At 2 AM on October 12, a lookout sees a white cliff in the moonlight.',
      '"Tierra! Tierra!"',
    ],
    reflection: 'Columbus found a world that didn\'t need discovering.',
    category: 'exploration',
  },
  {
    year: 1911,
    location: 'South Pole, Antarctica',
    lines: [
      'The temperature is -30°C.',
      'Five men on skis pull sleds across a white void.',
      'They have been walking for 99 days.',
      'There are no landmarks. Only a compass and the sun.',
      'On December 14, Amundsen plants a Norwegian flag in the ice.',
      'They are the first humans to stand at the bottom of the world.',
    ],
    reflection: 'Scott\'s team arrived 34 days later. None of them made it home.',
    category: 'exploration',
  },
  {
    year: 1961,
    location: 'Low Earth Orbit',
    lines: [
      'A 27-year-old sits in a metal sphere barely wider than his shoulders.',
      'The rocket ignites beneath him.',
      '"Poyekhali!" he shouts. "Let\'s go!"',
      'He orbits the Earth once in 108 minutes.',
      'Below him, oceans and continents drift past the tiny window.',
      'He lands in a farmer\'s field. The farmer stares.',
    ],
    reflection: 'Yuri Gagarin was the first human to see Earth from space— and return.',
    category: 'exploration',
  },

  // ── INVENTION ──────────────────────────────────
  {
    year: 1876,
    location: 'Boston, Massachusetts',
    lines: [
      'A man spills acid on his lap in his workshop.',
      '"Mr. Watson, come here. I want to see you."',
      'His assistant, in another room, hears every word.',
      'Through a wire.',
      'The first telephone call is an accident.',
      'Within a year, the president has one.',
    ],
    reflection: 'Alexander Graham Bell\'s first phone call was a cry for help.',
    category: 'invention',
  },
  {
    year: 1903,
    location: 'Kitty Hawk, North Carolina',
    lines: [
      'Two bicycle mechanics drag a wooden machine onto a beach.',
      'The wind is 27 mph.',
      'The engine weighs more than the pilot.',
      'The machine lifts off the sand.',
      'It flies for 12 seconds. 120 feet.',
      'Only five people are watching.',
    ],
    reflection: 'The Wright Brothers flew shorter than a 747 is long. 66 years later: the Moon.',
    category: 'invention',
  },
  {
    year: 1440,
    location: 'Mainz, Germany',
    lines: [
      'A goldsmith arranges tiny metal letters in a wooden frame.',
      'He mixes oil, soot, and walnut resin into ink.',
      'He presses a heavy screw down onto a sheet of paper.',
      'The first printed page emerges.',
      'It takes him three years to print 180 Bibles.',
      'A monk could copy one in two.',
    ],
    reflection: 'Gutenberg didn\'t invent reading. He made it unstoppable.',
    category: 'invention',
  },
  {
    year: 1879,
    location: 'Menlo Park, New Jersey',
    lines: [
      'A man has tried 3,000 materials as filaments.',
      'Cotton thread. Bamboo. Human hair.',
      'This time, he tries carbonized cardboard.',
      'He seals it in a glass bulb and turns on the current.',
      'It glows.',
      'It stays lit for 13 hours. Then the world changes forever.',
    ],
    reflection: 'Edison didn\'t just invent the lightbulb. He made darkness optional.',
    category: 'invention',
  },
];
