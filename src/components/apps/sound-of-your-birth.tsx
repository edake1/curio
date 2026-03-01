'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ─────────────────────────────────────────────────────────────────
// SOUND OF YOUR BIRTH
// Enter your birthday. See the world that received you.
// ─────────────────────────────────────────────────────────────────

interface BirthYearData {
  song: string;
  artist: string;
  movie: string;
  ticket: string;   // avg movie ticket price
  gas: string;      // avg gas per gallon
  event: string;    // notable moment
  stamp: string;    // US first-class stamp
  newCar: string;   // avg new car price
}

// Billboard Year-End Hot 100 #1 · top box office film · US avg prices
const YEAR_DATA: Record<number, BirthYearData> = {
  1950: { song: 'Goodnight Irene',          artist: 'Gordon Jenkins & The Weavers', movie: 'Cinderella',                 ticket: '$0.46', gas: '$0.27', event: 'Korean War begins — the world holds its breath.',       stamp: '$0.03', newCar: '$1,510' },
  1951: { song: 'Too Young',                artist: 'Nat King Cole',                movie: 'Quo Vadis',                  ticket: '$0.47', gas: '$0.27', event: 'Color TV broadcasts begin in the United States.',        stamp: '$0.03', newCar: '$1,570' },
  1952: { song: 'Cry',                      artist: 'Johnnie Ray',                  movie: 'The Greatest Show on Earth', ticket: '$0.48', gas: '$0.27', event: 'The Great Smog blankets London for five days.',          stamp: '$0.03', newCar: '$1,700' },
  1953: { song: 'Song From Moulin Rouge',   artist: 'Percy Faith',                  movie: 'Peter Pan',                  ticket: '$0.49', gas: '$0.27', event: 'Mount Everest summited for the very first time.',       stamp: '$0.03', newCar: '$1,800' },
  1954: { song: 'Little Things Mean a Lot', artist: 'Kitty Kallen',                 movie: 'White Christmas',            ticket: '$0.49', gas: '$0.29', event: 'US Supreme Court rules school segregation unconstitutional.', stamp: '$0.03', newCar: '$1,900' },
  1955: { song: "Rock Around the Clock",    artist: 'Bill Haley & His Comets',      movie: 'Lady and the Tramp',         ticket: '$0.50', gas: '$0.29', event: 'Disneyland opens. Rosa Parks refuses to give up her seat.', stamp: '$0.03', newCar: '$2,000' },
  1956: { song: "Don't Be Cruel",           artist: 'Elvis Presley',                movie: 'The Ten Commandments',       ticket: '$0.50', gas: '$0.29', event: "Elvis explodes onto the world stage. Rock'n'roll is born.", stamp: '$0.03', newCar: '$2,100' },
  1957: { song: 'All Shook Up',             artist: 'Elvis Presley',                movie: 'The Bridge on the River Kwai', ticket: '$0.51', gas: '$0.30', event: 'Sputnik launches. Humanity looks up at the stars differently.', stamp: '$0.03', newCar: '$2,200' },
  1958: { song: 'Volare',                   artist: 'Domenico Modugno',             movie: 'South Pacific',              ticket: '$0.52', gas: '$0.30', event: 'NASA is founded. The Space Age begins.',                stamp: '$0.04', newCar: '$2,300' },
  1959: { song: 'Mack the Knife',           artist: 'Bobby Darin',                  movie: 'Ben-Hur',                    ticket: '$0.51', gas: '$0.30', event: 'Alaska and Hawaii become the 49th and 50th US states.',  stamp: '$0.04', newCar: '$2,400' },
  1960: { song: 'Theme from A Summer Place', artist: 'Percy Faith',                 movie: 'Spartacus',                  ticket: '$0.69', gas: '$0.31', event: 'First birth control pill approved. The world quietly changes.', stamp: '$0.04', newCar: '$2,600' },
  1961: { song: "Tossin\' and Turnin\'",    artist: 'Bobby Lewis',                  movie: 'West Side Story',            ticket: '$0.70', gas: '$0.31', event: 'Berlin Wall goes up overnight, splitting a city in two.',  stamp: '$0.04', newCar: '$2,700' },
  1962: { song: 'Stranger on the Shore',    artist: 'Mr. Acker Bilk',               movie: 'Lawrence of Arabia',         ticket: '$0.70', gas: '$0.31', event: 'Cuban Missile Crisis. The world comes closest to nuclear war.', stamp: '$0.04', newCar: '$2,800' },
  1963: { song: 'Sugar Shack',              artist: 'Jimmy Gilmer & The Fireballs', movie: 'Cleopatra',                  ticket: '$0.75', gas: '$0.30', event: 'JFK assassinated. The Beatles take Britain by storm.',   stamp: '$0.05', newCar: '$2,900' },
  1964: { song: 'I Want to Hold Your Hand', artist: 'The Beatles',                  movie: 'Mary Poppins',               ticket: '$0.76', gas: '$0.30', event: 'The Civil Rights Act is signed into law.',               stamp: '$0.05', newCar: '$3,000' },
  1965: { song: 'Wooly Bully',              artist: 'Sam the Sham & the Pharaohs',  movie: 'The Sound of Music',         ticket: '$1.01', gas: '$0.31', event: 'First US combat troops land in Vietnam.',               stamp: '$0.05', newCar: '$2,650' },
  1966: { song: 'The Ballad of the Green Berets', artist: 'SSgt Barry Sadler',      movie: 'Hawaii',                     ticket: '$1.09', gas: '$0.32', event: 'The first Super Bowl is played. The NFL changes forever.', stamp: '$0.05', newCar: '$2,700' },
  1967: { song: 'To Sir with Love',         artist: 'Lulu',                         movie: 'The Jungle Book',            ticket: '$1.20', gas: '$0.33', event: 'The Summer of Love in San Francisco. Flower Power peaks.', stamp: '$0.05', newCar: '$2,750' },
  1968: { song: 'Hey Jude',                 artist: 'The Beatles',                  movie: '2001: A Space Odyssey',      ticket: '$1.31', gas: '$0.34', event: 'Martin Luther King Jr. assassinated. The world mourns.',  stamp: '$0.06', newCar: '$2,850' },
  1969: { song: 'Sugar Sugar',              artist: 'The Archies',                  movie: 'Butch Cassidy and the Sundance Kid', ticket: '$1.42', gas: '$0.35', event: 'Neil Armstrong walks on the moon. Nothing is impossible again.', stamp: '$0.06', newCar: '$3,270' },
  1970: { song: 'Bridge Over Troubled Water', artist: 'Simon & Garfunkel',          movie: 'Love Story',                 ticket: '$1.55', gas: '$0.36', event: 'First Earth Day. The environmental movement is born.',   stamp: '$0.06', newCar: '$3,450' },
  1971: { song: 'Joy to the World',         artist: 'Three Dog Night',             movie: 'Fiddler on the Roof',        ticket: '$1.65', gas: '$0.36', event: 'The voting age drops to 18. Young voices finally count.', stamp: '$0.08', newCar: '$3,560' },
  1972: { song: 'Alone Again (Naturally)',  artist: "Gilbert O\'Sullivan",          movie: 'The Godfather',              ticket: '$1.70', gas: '$0.36', event: 'Watergate break-in. A presidency begins to unravel.',    stamp: '$0.08', newCar: '$3,800' },
  1973: { song: 'Tie a Yellow Ribbon Round the Ole Oak Tree', artist: 'Tony Orlando & Dawn', movie: 'The Sting',        ticket: '$1.77', gas: '$0.39', event: 'OPEC oil embargo. Gas lines stretch for miles.',          stamp: '$0.08', newCar: '$3,900' },
  1974: { song: 'The Way We Were',          artist: 'Barbra Streisand',             movie: 'Blazing Saddles',            ticket: '$1.87', gas: '$0.53', event: 'Nixon resigns. First US president to do so.',            stamp: '$0.10', newCar: '$4,440' },
  1975: { song: 'Love Will Keep Us Together', artist: 'Captain & Tennille',         movie: 'Jaws',                       ticket: '$2.05', gas: '$0.57', event: 'Vietnam War ends. Microsoft is founded by two college kids.', stamp: '$0.10', newCar: '$4,950' },
  1976: { song: 'Silly Love Songs',         artist: 'Wings',                        movie: 'Rocky',                      ticket: '$2.13', gas: '$0.59', event: 'The US celebrates its 200th birthday. Apple Computer is founded.', stamp: '$0.13', newCar: '$5,100' },
  1977: { song: "Tonight\'s the Night",     artist: 'Rod Stewart',                  movie: 'Star Wars',                  ticket: '$2.23', gas: '$0.62', event: 'Star Wars premieres. Sci-fi changes forever. Elvis dies.',  stamp: '$0.13', newCar: '$5,700' },
  1978: { song: 'Shadow Dancing',           artist: 'Andy Gibb',                    movie: 'Grease',                     ticket: '$2.34', gas: '$0.63', event: "The world\'s first test-tube baby is born.",            stamp: '$0.15', newCar: '$5,750' },
  1979: { song: 'My Sharona',               artist: 'The Knack',                    movie: 'Kramer vs. Kramer',          ticket: '$2.47', gas: '$0.86', event: 'Sony Walkman launches. Music becomes personal.',         stamp: '$0.15', newCar: '$6,400' },
  1980: { song: 'Call Me',                  artist: 'Blondie',                      movie: 'The Empire Strikes Back',    ticket: '$2.69', gas: '$1.19', event: 'Mount St. Helens erupts. John Lennon is shot in New York.', stamp: '$0.15', newCar: '$7,200' },
  1981: { song: 'Bette Davis Eyes',         artist: 'Kim Carnes',                   movie: 'Raiders of the Lost Ark',    ticket: '$2.78', gas: '$1.31', event: 'MTV launches. "I want my MTV." The video age begins.',   stamp: '$0.18', newCar: '$8,100' },
  1982: { song: 'Physical',                 artist: 'Olivia Newton-John',           movie: 'E.T. The Extra-Terrestrial', ticket: '$2.94', gas: '$1.22', event: 'Michael Jackson releases Thriller — still the bestselling album of all time.', stamp: '$0.20', newCar: '$8,800' },
  1983: { song: 'Every Breath You Take',    artist: 'The Police',                   movie: 'Return of the Jedi',         ticket: '$3.15', gas: '$1.16', event: 'The internet is born as ARPANET switches to TCP/IP.',    stamp: '$0.20', newCar: '$9,200' },
  1984: { song: 'When Doves Cry',           artist: 'Prince',                       movie: 'Ghostbusters',               ticket: '$3.36', gas: '$1.10', event: 'The Apple Macintosh debuts. Personal computing arrives.',  stamp: '$0.20', newCar: '$9,600' },
  1985: { song: 'Careless Whisper',         artist: 'Wham!',                        movie: 'Back to the Future',         ticket: '$3.55', gas: '$1.20', event: 'Live Aid raises $125M for famine relief. Music unites the world.', stamp: '$0.22', newCar: '$10,200' },
  1986: { song: "That\'s What Friends Are For", artist: 'Dionne Warwick & Friends', movie: 'Top Gun',                    ticket: '$3.71', gas: '$0.86', event: 'Chernobyl disaster. Space Shuttle Challenger explodes.',  stamp: '$0.22', newCar: '$11,100' },
  1987: { song: 'Walk Like an Egyptian',    artist: 'The Bangles',                  movie: 'Three Men and a Baby',       ticket: '$3.91', gas: '$0.90', event: 'Black Monday: the largest single-day stock market crash in history.', stamp: '$0.22', newCar: '$12,100' },
  1988: { song: 'Faith',                    artist: 'George Michael',               movie: 'Rain Man',                   ticket: '$4.11', gas: '$0.90', event: 'The first transatlantic fiber-optic cable goes live.',    stamp: '$0.25', newCar: '$13,300' },
  1989: { song: 'Look Away',                artist: 'Chicago',                      movie: 'Batman',                     ticket: '$3.99', gas: '$1.00', event: 'The Berlin Wall falls. The Cold War ends.',              stamp: '$0.25', newCar: '$14,400' },
  1990: { song: 'Hold On',                  artist: 'Wilson Phillips',              movie: 'Home Alone',                 ticket: '$4.23', gas: '$1.16', event: 'Hubble Space Telescope launches. The web is just being invented.', stamp: '$0.25', newCar: '$14,900' },
  1991: { song: '(Everything I Do) I Do It for You', artist: 'Bryan Adams',        movie: 'Terminator 2: Judgment Day', ticket: '$4.21', gas: '$1.14', event: 'The Soviet Union collapses. The Cold War is officially over.', stamp: '$0.29', newCar: '$15,500' },
  1992: { song: 'End of the Road',          artist: 'Boyz II Men',                  movie: 'Aladdin',                    ticket: '$4.15', gas: '$1.13', event: 'The World Wide Web opens to the public. Nothing is the same.', stamp: '$0.29', newCar: '$16,200' },
  1993: { song: 'I Will Always Love You',   artist: 'Whitney Houston',              movie: 'Jurassic Park',              ticket: '$4.14', gas: '$1.11', event: 'Jurassic Park terrifies the world. The internet starts growing.', stamp: '$0.29', newCar: '$16,700' },
  1994: { song: 'The Sign',                 artist: 'Ace of Base',                  movie: 'The Lion King',              ticket: '$4.08', gas: '$1.11', event: 'Amazon and Yahoo are founded. Mandela becomes president of South Africa.', stamp: '$0.29', newCar: '$17,200' },
  1995: { song: "Gangsta\'s Paradise",      artist: 'Coolio ft. L.V.',              movie: 'Toy Story',                  ticket: '$4.35', gas: '$1.15', event: 'Windows 95 launches. Everyone gets a computer. eBay is born.', stamp: '$0.32', newCar: '$17,800' },
  1996: { song: 'Macarena (Bayside Boys Mix)', artist: 'Los Del Rio',               movie: 'Independence Day',           ticket: '$4.42', gas: '$1.23', event: "Dolly the sheep is cloned. Scientists cross a line.",   stamp: '$0.32', newCar: '$18,400' },
  1997: { song: 'Candle in the Wind 1997',  artist: 'Elton John',                   movie: 'Titanic',                    ticket: '$4.59', gas: '$1.23', event: 'Princess Diana dies. The world mourns together. Harry Potter is published.', stamp: '$0.32', newCar: '$18,700' },
  1998: { song: 'Too Close',                artist: 'Next',                         movie: 'Saving Private Ryan',        ticket: '$4.69', gas: '$1.06', event: 'Google is founded in a garage. The search era begins.',   stamp: '$0.32', newCar: '$19,400' },
  1999: { song: 'Believe',                  artist: 'Cher',                         movie: 'Star Wars: The Phantom Menace', ticket: '$5.08', gas: '$1.17', event: 'Y2K panic grips the world. The dot-com bubble inflates.', stamp: '$0.33', newCar: '$20,500' },
  2000: { song: 'Breathe',                  artist: 'Faith Hill',                   movie: 'Mission: Impossible 2',      ticket: '$5.39', gas: '$1.51', event: 'The dot-com bubble begins to burst. The millennium arrives without apocalypse.', stamp: '$0.33', newCar: '$21,800' },
  2001: { song: 'Hanging by a Moment',      artist: 'Lifehouse',                    movie: 'Harry Potter and the Philosophers Stone', ticket: '$5.65', gas: '$1.46', event: '9/11 reshapes the world. Wikipedia is launched.', stamp: '$0.34', newCar: '$22,200' },
  2002: { song: 'How You Remind Me',        artist: 'Nickelback',                   movie: 'Spider-Man',                 ticket: '$5.80', gas: '$1.36', event: 'The Euro currency launches across 12 European countries.',  stamp: '$0.37', newCar: '$22,400' },
  2003: { song: 'In Da Club',               artist: '50 Cent',                      movie: 'Finding Nemo',               ticket: '$6.03', gas: '$1.59', event: 'Iraq War begins. SpaceX is founded. The Concorde retires.', stamp: '$0.37', newCar: '$22,600' },
  2004: { song: 'Yeah!',                    artist: 'Usher ft. Lil Jon & Ludacris', movie: 'Shrek 2',                    ticket: '$6.21', gas: '$1.88', event: 'Facebook is founded in a Harvard dorm room.',             stamp: '$0.37', newCar: '$23,300' },
  2005: { song: 'We Belong Together',       artist: 'Mariah Carey',                 movie: 'Star Wars: Revenge of the Sith', ticket: '$6.41', gas: '$2.30', event: 'Hurricane Katrina devastates New Orleans. YouTube is founded.', stamp: '$0.37', newCar: '$24,100' },
  2006: { song: 'Bad Day',                  artist: 'Daniel Powter',                movie: 'Pirates of the Caribbean: Dead Man\'s Chest', ticket: '$6.55', gas: '$2.59', event: 'Twitter launches. Pluto is stripped of its planet status.', stamp: '$0.39', newCar: '$24,600' },
  2007: { song: 'Irreplaceable',            artist: 'Beyoncé',                      movie: 'Spider-Man 3',               ticket: '$6.88', gas: '$2.80', event: 'The iPhone is unveiled. Everything about how we live changes.', stamp: '$0.41', newCar: '$25,400' },
  2008: { song: 'Low',                      artist: 'Flo Rida ft. T-Pain',          movie: 'The Dark Knight',            ticket: '$7.18', gas: '$3.27', event: 'Global financial crisis. Barack Obama is elected president.', stamp: '$0.42', newCar: '$26,300' },
  2009: { song: 'Boom Boom Pow',            artist: 'Black Eyed Peas',              movie: 'Avatar',                     ticket: '$7.50', gas: '$2.35', event: 'H1N1 pandemic. Bitcoin is invented. Obama is inaugurated.', stamp: '$0.44', newCar: '$26,900' },
  2010: { song: 'Need You Now',             artist: 'Lady Antebellum',              movie: 'Toy Story 3',                ticket: '$7.89', gas: '$2.79', event: 'iPad releases. Arab Spring begins. 33 Chilean miners rescued.', stamp: '$0.44', newCar: '$28,300' },
  2011: { song: 'Rolling in the Deep',      artist: 'Adele',                        movie: 'Harry Potter and the Deathly Hallows Part 2', ticket: '$7.93', gas: '$3.53', event: 'Osama bin Laden is killed. The Fukushima disaster rocks Japan.', stamp: '$0.44', newCar: '$29,200' },
  2012: { song: 'Somebody That I Used to Know', artist: 'Gotye ft. Kimbra',         movie: 'The Avengers',               ticket: '$7.96', gas: '$3.64', event: 'Mars Curiosity Rover lands. Gangnam Style breaks the internet.', stamp: '$0.45', newCar: '$30,100' },
  2013: { song: 'Thrift Shop',              artist: 'Macklemore & Ryan Lewis',      movie: 'Iron Man 3',                 ticket: '$8.13', gas: '$3.53', event: 'Edward Snowden leaks NSA surveillance programs. Pope Francis elected.', stamp: '$0.46', newCar: '$31,000' },
  2014: { song: 'Happy',                    artist: 'Pharrell Williams',            movie: 'Guardians of the Galaxy',    ticket: '$8.17', gas: '$3.37', event: 'Ice Bucket Challenge raises $220M. Ebola outbreak in West Africa.', stamp: '$0.49', newCar: '$32,000' },
  2015: { song: 'Uptown Funk',              artist: 'Mark Ronson ft. Bruno Mars',   movie: 'Star Wars: The Force Awakens', ticket: '$8.43', gas: '$2.45', event: 'Same-sex marriage legalized in the US. Pluto photographed for the first time.', stamp: '$0.49', newCar: '$33,500' },
};

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

const ERA_GRADIENT: Record<string, string> = {
  '1950s': 'from-amber-950 via-stone-900 to-zinc-900',
  '1960s': 'from-sky-950 via-zinc-900 to-stone-900',
  '1970s': 'from-orange-950 via-zinc-900 to-stone-900',
  '1980s': 'from-fuchsia-950 via-zinc-900 to-zinc-950',
  '1990s': 'from-violet-950 via-zinc-900 to-zinc-950',
  '2000s': 'from-blue-950 via-zinc-900 to-zinc-950',
  '2010s': 'from-emerald-950 via-zinc-900 to-zinc-950',
};

function getEra(year: number): string {
  const decade = Math.floor(year / 10) * 10;
  return `${decade}s`;
}

function getEraGradient(year: number): string {
  return ERA_GRADIENT[getEra(year)] ?? 'from-zinc-900 via-zinc-900 to-zinc-950';
}

function getYearData(year: number): BirthYearData | null {
  if (YEAR_DATA[year]) return YEAR_DATA[year];
  // Interpolate nearest year
  const years = Object.keys(YEAR_DATA).map(Number).sort((a, b) => a - b);
  const closest = years.reduce((prev, curr) =>
    Math.abs(curr - year) < Math.abs(prev - year) ? curr : prev
  );
  return YEAR_DATA[closest] ?? null;
}

function getDaysAlive(month: number, day: number, year: number): number {
  const birth = new Date(year, month - 1, day);
  const now = new Date();
  return Math.floor((now.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24));
}

// ── Stat chip ────────────────────────────────────────────────────
function Chip({ label, value, emoji }: { label: string; value: string; emoji: string }) {
  return (
    <div className="flex flex-col gap-0.5 px-3 py-2.5 rounded-xl"
      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <span className="text-[10px] uppercase tracking-widest font-semibold text-zinc-500">{label}</span>
      <div className="flex items-center gap-1.5">
        <span className="text-base leading-none">{emoji}</span>
        <span className="text-[13px] font-bold text-zinc-200 leading-snug">{value}</span>
      </div>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────
export function SoundOfYourBirthApp() {
  const [month, setMonth] = useState('');
  const [day,   setDay]   = useState('');
  const [year,  setYear]  = useState('');
  const [shown, setShown] = useState(false);

  const currentYear = new Date().getFullYear();
  const yearNum = parseInt(year, 10);
  const monthNum = parseInt(month, 10);
  const dayNum  = parseInt(day, 10);
  const isValid = !isNaN(yearNum) && !isNaN(monthNum) && !isNaN(dayNum)
    && yearNum >= 1950 && yearNum <= currentYear - 1;
  const data = isValid ? getYearData(yearNum) : null;
  const daysAlive = isValid ? getDaysAlive(monthNum, dayNum, yearNum) : 0;
  const yearsAlive = isValid ? Math.floor(daysAlive / 365.25) : 0;
  const eraGradient = isValid ? getEraGradient(yearNum) : '';

  const formattedDate = isValid
    ? `${MONTHS[monthNum - 1]} ${dayNum}, ${yearNum}`
    : '';

  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const years = Array.from({ length: currentYear - 1950 }, (_, i) => currentYear - 1 - i);

  const handleReveal = () => {
    if (isValid) setShown(true);
  };

  return (
    <div className="py-2 sm:py-4 max-w-2xl mx-auto space-y-5">

      {/* Header */}
      <div>
        <p className="text-[10px] uppercase tracking-widest font-semibold text-zinc-500 mb-1">Your birthday</p>
        <div className="flex flex-wrap gap-2 items-end">
          {/* Month */}
          <div>
            <p className="text-[10px] text-zinc-600 mb-1">Month</p>
            <select
              value={month}
              onChange={e => { setMonth(e.target.value); setShown(false); }}
              className="bg-white/[0.05] border border-white/[0.08] text-zinc-200 text-sm font-medium rounded-xl px-3 py-2 outline-none cursor-pointer [color-scheme:dark]"
            >
              <option value="">—</option>
              {MONTHS.map((m, i) => (
                <option key={m} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>

          {/* Day */}
          <div>
            <p className="text-[10px] text-zinc-600 mb-1">Day</p>
            <select
              value={day}
              onChange={e => { setDay(e.target.value); setShown(false); }}
              className="bg-white/[0.05] border border-white/[0.08] text-zinc-200 text-sm font-medium rounded-xl px-3 py-2 outline-none cursor-pointer [color-scheme:dark]"
            >
              <option value="">—</option>
              {days.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Year */}
          <div>
            <p className="text-[10px] text-zinc-600 mb-1">Year</p>
            <select
              value={year}
              onChange={e => { setYear(e.target.value); setShown(false); }}
              className="bg-white/[0.05] border border-white/[0.08] text-zinc-200 text-sm font-medium rounded-xl px-3 py-2 outline-none cursor-pointer [color-scheme:dark]"
            >
              <option value="">—</option>
              {years.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <motion.button
            onClick={handleReveal}
            disabled={!isValid}
            whileTap={{ scale: 0.96 }}
            className="px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              background: isValid ? 'linear-gradient(135deg, #f97316, #ec4899)' : undefined,
              backgroundColor: isValid ? undefined : 'rgba(255,255,255,0.05)',
              color: '#fff',
              boxShadow: isValid ? '0 4px 20px rgba(249,115,22,0.3)' : undefined,
            }}
          >
            Transport me back →
          </motion.button>
        </div>
      </div>

      {/* Card */}
      <AnimatePresence>
        {shown && data && (
          <motion.div
            key={year}
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className={`rounded-2xl overflow-hidden bg-gradient-to-br ${eraGradient}`}
            style={{ border: '1px solid rgba(255,255,255,0.09)' }}
          >
            {/* Card top strip */}
            <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #f97316, #ec4899, #8b5cf6)' }} />

            <div className="p-5 sm:p-6 space-y-5">

              {/* Date + era */}
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-500 mb-1">
                  The world on
                </p>
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {formattedDate}
                </h2>
                <p className="text-xs text-zinc-500 mt-1">
                  {yearsAlive} years ago · {daysAlive.toLocaleString()} days · the {getEra(yearNum)}
                </p>
              </div>

              <div className="h-px bg-white/[0.06]" />

              {/* #1 Song — hero element */}
              <div>
                <p className="text-[10px] uppercase tracking-widest font-semibold text-orange-400/80 mb-2">
                  🎵 The year's #1 song
                </p>
                <div className="flex items-center gap-4">
                  {/* Vinyl graphic */}
                  <div className="relative shrink-0 w-14 h-14 rounded-full flex items-center justify-center"
                    style={{
                      background: 'radial-gradient(circle, #1a1a1a 28%, #2d2d2d 28%, #2d2d2d 40%, #1a1a1a 40%, #1a1a1a 55%, #2d2d2d 55%, #2d2d2d 70%, #1a1a1a 70%)',
                      boxShadow: '0 0 0 2px rgba(249,115,22,0.3), 0 4px 16px rgba(0,0,0,0.5)',
                    }}
                  >
                    <div className="w-3 h-3 rounded-full bg-orange-400/60" />
                  </div>
                  <div>
                    <p className="text-lg sm:text-xl font-black text-white leading-tight">
                      &ldquo;{data.song}&rdquo;
                    </p>
                    <p className="text-sm text-zinc-400 mt-0.5">{data.artist}</p>
                  </div>
                </div>
              </div>

              <div className="h-px bg-white/[0.06]" />

              {/* Top film */}
              <div>
                <p className="text-[10px] uppercase tracking-widest font-semibold text-pink-400/80 mb-2">
                  🎬 Top film of the year
                </p>
                <p className="text-lg font-black text-white">{data.movie}</p>
              </div>

              <div className="h-px bg-white/[0.06]" />

              {/* Price grid */}
              <div>
                <p className="text-[10px] uppercase tracking-widest font-semibold text-zinc-500 mb-2">
                  What things cost in {yearNum}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <Chip emoji="🎟️" label="Movie ticket" value={data.ticket} />
                  <Chip emoji="⛽" label="Gas per gallon" value={data.gas} />
                  <Chip emoji="✉️" label="First-class stamp" value={data.stamp} />
                  <Chip emoji="🚗" label="New car (avg)" value={data.newCar} />
                </div>
              </div>

              <div className="h-px bg-white/[0.06]" />

              {/* World event */}
              <div>
                <p className="text-[10px] uppercase tracking-widest font-semibold text-violet-400/80 mb-2">
                  📰 The world that year
                </p>
                <p className="text-sm text-zinc-300 leading-relaxed">{data.event}</p>
              </div>

              <div className="h-px bg-white/[0.06]" />

              {/* Personal footer */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <p className="text-xs text-zinc-600 italic">
                  You have lived {daysAlive.toLocaleString()} days. Make them count.
                </p>
                <span className="text-[10px] font-mono text-zinc-600 border border-white/[0.06] px-2 py-0.5 rounded-full">
                  {getEra(yearNum)}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Placeholder before reveal */}
      {!shown && (
        <div className="rounded-2xl border border-white/[0.06] p-8 flex flex-col items-center justify-center gap-3 text-center"
          style={{ background: 'rgba(255,255,255,0.02)', minHeight: 220 }}>
          <span className="text-4xl">🎵</span>
          <p className="text-zinc-500 text-sm max-w-xs">
            Enter your birthday above to discover the song that was #1 the year you arrived, what movies were playing, and what the world was up to.
          </p>
        </div>
      )}
    </div>
  );
}
