'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toPng } from 'html-to-image';

// ─────────────────────────────────────────────────────────────────
// SOUND OF YOUR BIRTH
// Enter your birthday. See the world that received you.
// ─────────────────────────────────────────────────────────────────

interface BirthYearData {
  song: string;
  artist: string;
  movie: string;          // worldwide box office #1
  topTV: string;          // top-rated TV show
  ticket: string;         // US avg movie ticket
  gas: string;            // US avg gas/gallon
  stamp: string;          // US first-class stamp
  newCar: string;         // US avg new car price
  minWage: string;        // US federal min wage
  population: string;     // world population
  nobel: string;          // Nobel Peace Prize
  event: string;          // notable world moment
}

// Billboard Year-End Hot 100 #1 · worldwide box office #1 · US avg prices · Nobel Peace Prize
const YEAR_DATA: Record<number, BirthYearData> = {
  1950: { song: 'Goodnight Irene',          artist: 'Gordon Jenkins & The Weavers', movie: 'Cinderella',                           topTV: 'Texaco Star Theater',              ticket: '$0.46', gas: '$0.27', stamp: '$0.03', newCar: '$1,510',  minWage: '$0.75', population: '2.5B', nobel: 'Ralph Bunche (peace mediator, Middle East)', event: 'Korean War begins — the world holds its breath.' },
  1951: { song: 'Too Young',                artist: 'Nat King Cole',                movie: 'Quo Vadis',                            topTV: "Arthur Godfrey's Talent Scouts",   ticket: '$0.47', gas: '$0.27', stamp: '$0.03', newCar: '$1,570',  minWage: '$0.75', population: '2.6B', nobel: 'Not awarded',                                 event: 'Color TV broadcasts begin in the United States.' },
  1952: { song: 'Cry',                      artist: 'Johnnie Ray',                  movie: 'The Greatest Show on Earth',           topTV: 'I Love Lucy',                      ticket: '$0.48', gas: '$0.27', stamp: '$0.03', newCar: '$1,700',  minWage: '$0.75', population: '2.6B', nobel: 'Albert Schweitzer (humanitarian)',             event: 'The Great Smog blankets London for five days.' },
  1953: { song: 'Song From Moulin Rouge',   artist: 'Percy Faith',                  movie: 'Peter Pan',                            topTV: 'I Love Lucy',                      ticket: '$0.49', gas: '$0.27', stamp: '$0.03', newCar: '$1,800',  minWage: '$0.75', population: '2.7B', nobel: 'George Marshall (Marshall Plan)',              event: 'Mount Everest summited for the very first time.' },
  1954: { song: 'Little Things Mean a Lot', artist: 'Kitty Kallen',                 movie: 'White Christmas',                      topTV: 'I Love Lucy',                      ticket: '$0.49', gas: '$0.29', stamp: '$0.03', newCar: '$1,900',  minWage: '$0.75', population: '2.7B', nobel: 'UNHCR (UN Refugees)',                          event: 'US Supreme Court rules school segregation unconstitutional.' },
  1955: { song: 'Rock Around the Clock',    artist: 'Bill Haley & His Comets',      movie: 'Lady and the Tramp',                   topTV: 'The $64,000 Question',             ticket: '$0.50', gas: '$0.29', stamp: '$0.03', newCar: '$2,000',  minWage: '$0.75', population: '2.8B', nobel: 'Not awarded',                                 event: 'Disneyland opens. Rosa Parks refuses to give up her seat.' },
  1956: { song: "Don't Be Cruel",           artist: 'Elvis Presley',                movie: 'The Ten Commandments',                 topTV: 'I Love Lucy',                      ticket: '$0.50', gas: '$0.29', stamp: '$0.03', newCar: '$2,100',  minWage: '$1.00', population: '2.8B', nobel: 'Not awarded',                                 event: "Elvis explodes onto the world stage. Rock'n'roll is born." },
  1957: { song: 'All Shook Up',             artist: 'Elvis Presley',                movie: 'The Bridge on the River Kwai',         topTV: 'Gunsmoke',                         ticket: '$0.51', gas: '$0.30', stamp: '$0.03', newCar: '$2,200',  minWage: '$1.00', population: '2.9B', nobel: 'Lester Pearson (Suez Canal diplomacy)',        event: 'Sputnik launches. Humanity looks up at the stars differently.' },
  1958: { song: 'Volare',                   artist: 'Domenico Modugno',             movie: 'South Pacific',                        topTV: 'Gunsmoke',                         ticket: '$0.52', gas: '$0.30', stamp: '$0.04', newCar: '$2,300',  minWage: '$1.00', population: '2.9B', nobel: 'Georges Pire (European refugees)',             event: 'NASA is founded. The Space Age begins.' },
  1959: { song: 'Mack the Knife',           artist: 'Bobby Darin',                  movie: 'Ben-Hur',                              topTV: 'Gunsmoke',                         ticket: '$0.51', gas: '$0.30', stamp: '$0.04', newCar: '$2,400',  minWage: '$1.00', population: '3.0B', nobel: 'Philip Noel-Baker (disarmament)',              event: 'Alaska and Hawaii become the 49th and 50th US states.' },
  1960: { song: 'Theme from A Summer Place', artist: 'Percy Faith',                 movie: 'Spartacus',                            topTV: 'Gunsmoke',                         ticket: '$0.69', gas: '$0.31', stamp: '$0.04', newCar: '$2,600',  minWage: '$1.00', population: '3.0B', nobel: 'Albert Lutuli (South Africa anti-apartheid)',  event: 'First birth control pill approved. The world quietly changes.' },
  1961: { song: "Tossin' and Turnin'",      artist: 'Bobby Lewis',                  movie: 'West Side Story',                      topTV: 'Gunsmoke',                         ticket: '$0.70', gas: '$0.31', stamp: '$0.04', newCar: '$2,700',  minWage: '$1.15', population: '3.1B', nobel: 'Dag Hammarskjöld (UN Secretary-General, posth.)', event: 'Berlin Wall goes up overnight, splitting a city in two.' },
  1962: { song: 'Stranger on the Shore',    artist: 'Mr. Acker Bilk',               movie: 'Lawrence of Arabia',                   topTV: 'The Beverly Hillbillies',          ticket: '$0.70', gas: '$0.31', stamp: '$0.04', newCar: '$2,800',  minWage: '$1.15', population: '3.1B', nobel: 'Linus Pauling (anti-nuclear campaign)',        event: 'Cuban Missile Crisis. The world comes closest to nuclear war.' },
  1963: { song: 'Sugar Shack',              artist: 'Jimmy Gilmer & The Fireballs', movie: 'Cleopatra',                            topTV: 'The Beverly Hillbillies',          ticket: '$0.75', gas: '$0.30', stamp: '$0.05', newCar: '$2,900',  minWage: '$1.25', population: '3.2B', nobel: 'International Committee of the Red Cross',    event: 'JFK assassinated. The Beatles take Britain by storm.' },
  1964: { song: 'I Want to Hold Your Hand', artist: 'The Beatles',                  movie: 'Mary Poppins',                         topTV: 'Bonanza',                          ticket: '$0.76', gas: '$0.30', stamp: '$0.05', newCar: '$3,000',  minWage: '$1.25', population: '3.3B', nobel: 'Martin Luther King Jr.',                      event: 'The Civil Rights Act is signed into law.' },
  1965: { song: 'Wooly Bully',              artist: 'Sam the Sham & the Pharaohs',  movie: 'The Sound of Music',                   topTV: 'Bonanza',                          ticket: '$1.01', gas: '$0.31', stamp: '$0.05', newCar: '$2,650',  minWage: '$1.25', population: '3.3B', nobel: 'UNICEF',                                      event: 'First US combat troops land in Vietnam.' },
  1966: { song: 'The Ballad of the Green Berets', artist: 'SSgt Barry Sadler',      movie: 'Hawaii',                               topTV: 'Bonanza',                          ticket: '$1.09', gas: '$0.32', stamp: '$0.05', newCar: '$2,700',  minWage: '$1.25', population: '3.4B', nobel: 'Not awarded',                                 event: 'The first Super Bowl is played. The NFL changes forever.' },
  1967: { song: 'To Sir with Love',         artist: 'Lulu',                         movie: 'The Jungle Book',                      topTV: 'The Andy Griffith Show',           ticket: '$1.20', gas: '$0.33', stamp: '$0.05', newCar: '$2,750',  minWage: '$1.40', population: '3.5B', nobel: 'Not awarded',                                 event: 'The Summer of Love in San Francisco. Flower Power peaks.' },
  1968: { song: 'Hey Jude',                 artist: 'The Beatles',                  movie: '2001: A Space Odyssey',                topTV: "Rowan & Martin's Laugh-In",        ticket: '$1.31', gas: '$0.34', stamp: '$0.06', newCar: '$2,850',  minWage: '$1.60', population: '3.5B', nobel: 'René Cassin (human rights)',                  event: 'Martin Luther King Jr. assassinated. The world mourns.' },
  1969: { song: 'Sugar Sugar',              artist: 'The Archies',                  movie: 'Butch Cassidy and the Sundance Kid',   topTV: "Rowan & Martin's Laugh-In",        ticket: '$1.42', gas: '$0.35', stamp: '$0.06', newCar: '$3,270',  minWage: '$1.60', population: '3.6B', nobel: 'International Labour Organization',            event: 'Neil Armstrong walks on the moon. Nothing is impossible again.' },
  1970: { song: 'Bridge Over Troubled Water', artist: 'Simon & Garfunkel',          movie: 'Love Story',                           topTV: 'Marcus Welby, M.D.',               ticket: '$1.55', gas: '$0.36', stamp: '$0.06', newCar: '$3,450',  minWage: '$1.60', population: '3.7B', nobel: 'Norman Borlaug (Green Revolution)',            event: 'First Earth Day. The environmental movement is born.' },
  1971: { song: 'Joy to the World',         artist: 'Three Dog Night',              movie: 'Fiddler on the Roof',                  topTV: 'All in the Family',                ticket: '$1.65', gas: '$0.36', stamp: '$0.08', newCar: '$3,560',  minWage: '$1.60', population: '3.8B', nobel: 'Willy Brandt (East-West diplomatic bridge)',  event: 'The voting age drops to 18. Young voices finally count.' },
  1972: { song: 'Alone Again (Naturally)',  artist: "Gilbert O'Sullivan",           movie: 'The Godfather',                        topTV: 'All in the Family',                ticket: '$1.70', gas: '$0.36', stamp: '$0.08', newCar: '$3,800',  minWage: '$1.60', population: '3.8B', nobel: 'Not awarded',                                 event: 'Watergate break-in. A presidency begins to unravel.' },
  1973: { song: 'Tie a Yellow Ribbon Round the Ole Oak Tree', artist: 'Tony Orlando & Dawn', movie: 'The Sting',                   topTV: 'All in the Family',                ticket: '$1.77', gas: '$0.39', stamp: '$0.08', newCar: '$3,900',  minWage: '$1.60', population: '3.9B', nobel: 'Le Duc Tho & Henry Kissinger (Vietnam ceasefire)', event: 'OPEC oil embargo. Gas lines stretch for miles.' },
  1974: { song: 'The Way We Were',          artist: 'Barbra Streisand',             movie: 'Blazing Saddles',                      topTV: 'All in the Family',                ticket: '$1.87', gas: '$0.53', stamp: '$0.10', newCar: '$4,440',  minWage: '$2.00', population: '4.0B', nobel: 'Eisaku Satō & Seán MacBride (peace & disarmament)', event: 'Nixon resigns. First US president to do so.' },
  1975: { song: 'Love Will Keep Us Together', artist: 'Captain & Tennille',         movie: 'Jaws',                                 topTV: 'All in the Family',                ticket: '$2.05', gas: '$0.57', stamp: '$0.10', newCar: '$4,950',  minWage: '$2.10', population: '4.1B', nobel: 'Andrei Sakharov (nuclear arms opponent)',     event: 'Vietnam War ends. Microsoft is founded by two college kids.' },
  1976: { song: 'Silly Love Songs',         artist: 'Wings',                        movie: 'Rocky',                                topTV: 'Happy Days',                       ticket: '$2.13', gas: '$0.59', stamp: '$0.13', newCar: '$5,100',  minWage: '$2.30', population: '4.1B', nobel: 'Betty Williams & Mairead Corrigan (N. Ireland)', event: 'The US celebrates its 200th birthday. Apple Computer is founded.' },
  1977: { song: "Tonight's the Night",      artist: 'Rod Stewart',                  movie: 'Star Wars',                            topTV: 'Happy Days',                       ticket: '$2.23', gas: '$0.62', stamp: '$0.13', newCar: '$5,700',  minWage: '$2.30', population: '4.2B', nobel: 'Amnesty International',                       event: "Star Wars premieres. Sci-fi changes forever. Elvis dies." },
  1978: { song: 'Shadow Dancing',           artist: 'Andy Gibb',                    movie: 'Grease',                               topTV: 'Laverne & Shirley',                ticket: '$2.34', gas: '$0.63', stamp: '$0.15', newCar: '$5,750',  minWage: '$2.65', population: '4.3B', nobel: 'Anwar Sadat & Menachem Begin (Camp David)',   event: "The world's first test-tube baby is born." },
  1979: { song: 'My Sharona',               artist: 'The Knack',                    movie: 'Kramer vs. Kramer',                    topTV: 'Laverne & Shirley',                ticket: '$2.47', gas: '$0.86', stamp: '$0.15', newCar: '$6,400',  minWage: '$2.90', population: '4.4B', nobel: 'Mother Teresa',                               event: 'Sony Walkman launches. Music becomes personal.' },
  1980: { song: 'Call Me',                  artist: 'Blondie',                      movie: 'The Empire Strikes Back',              topTV: 'Dallas',                           ticket: '$2.69', gas: '$1.19', stamp: '$0.15', newCar: '$7,200',  minWage: '$3.10', population: '4.4B', nobel: 'Adolfo Pérez Esquivel (human rights, Argentina)', event: 'Mount St. Helens erupts. John Lennon is shot in New York.' },
  1981: { song: 'Bette Davis Eyes',         artist: 'Kim Carnes',                   movie: 'Raiders of the Lost Ark',              topTV: 'Dallas',                           ticket: '$2.78', gas: '$1.31', stamp: '$0.18', newCar: '$8,100',  minWage: '$3.35', population: '4.5B', nobel: 'UNHCR (UN Refugees, 2nd time)',               event: 'MTV launches. "I want my MTV." The video age begins.' },
  1982: { song: 'Physical',                 artist: 'Olivia Newton-John',           movie: 'E.T. The Extra-Terrestrial',           topTV: '60 Minutes',                       ticket: '$2.94', gas: '$1.22', stamp: '$0.20', newCar: '$8,800',  minWage: '$3.35', population: '4.6B', nobel: 'Alva Myrdal & Alfonso García Robles (disarmament)', event: 'Michael Jackson releases Thriller — still the bestselling album of all time.' },
  1983: { song: 'Every Breath You Take',    artist: 'The Police',                   movie: 'Return of the Jedi',                   topTV: '60 Minutes',                       ticket: '$3.15', gas: '$1.16', stamp: '$0.20', newCar: '$9,200',  minWage: '$3.35', population: '4.7B', nobel: 'Lech Wałęsa (Polish Solidarity)',             event: 'The internet is born as ARPANET switches to TCP/IP.' },
  1984: { song: 'When Doves Cry',           artist: 'Prince',                       movie: 'Ghostbusters',                         topTV: 'Dynasty',                          ticket: '$3.36', gas: '$1.10', stamp: '$0.20', newCar: '$9,600',  minWage: '$3.35', population: '4.8B', nobel: 'Desmond Tutu (South Africa anti-apartheid)',  event: 'The Apple Macintosh debuts. Personal computing arrives.' },
  1985: { song: 'Careless Whisper',         artist: 'Wham!',                        movie: 'Back to the Future',                   topTV: 'Dynasty',                          ticket: '$3.55', gas: '$1.20', stamp: '$0.22', newCar: '$10,200', minWage: '$3.35', population: '4.8B', nobel: 'International Physicians for Prevention of Nuclear War', event: 'Live Aid raises $125M for famine relief. Music unites the world.' },
  1986: { song: "That's What Friends Are For", artist: 'Dionne Warwick & Friends',  movie: 'Top Gun',                              topTV: 'The Cosby Show',                   ticket: '$3.71', gas: '$0.86', stamp: '$0.22', newCar: '$11,100', minWage: '$3.35', population: '4.9B', nobel: 'Elie Wiesel (Holocaust witness & author)',    event: 'Chernobyl disaster. Space Shuttle Challenger explodes.' },
  1987: { song: 'Walk Like an Egyptian',    artist: 'The Bangles',                  movie: 'Three Men and a Baby',                 topTV: 'The Cosby Show',                   ticket: '$3.91', gas: '$0.90', stamp: '$0.22', newCar: '$12,100', minWage: '$3.35', population: '5.0B', nobel: 'Óscar Arias Sánchez (Central America peace)', event: 'Black Monday: the largest single-day stock market crash in history.' },
  1988: { song: 'Faith',                    artist: 'George Michael',               movie: 'Rain Man',                             topTV: 'The Cosby Show',                   ticket: '$4.11', gas: '$0.90', stamp: '$0.25', newCar: '$13,300', minWage: '$3.35', population: '5.1B', nobel: 'UN Peacekeeping Forces',                      event: 'The first transatlantic fiber-optic cable goes live.' },
  1989: { song: 'Look Away',                artist: 'Chicago',                      movie: 'Batman',                               topTV: 'Roseanne',                         ticket: '$3.99', gas: '$1.00', stamp: '$0.25', newCar: '$14,400', minWage: '$3.35', population: '5.2B', nobel: 'The 14th Dalai Lama',                         event: 'The Berlin Wall falls. The Cold War ends.' },
  1990: { song: 'Hold On',                  artist: 'Wilson Phillips',              movie: 'Home Alone',                           topTV: 'Roseanne',                         ticket: '$4.23', gas: '$1.16', stamp: '$0.25', newCar: '$14,900', minWage: '$3.80', population: '5.3B', nobel: 'Mikhail Gorbachev (ending Cold War)',          event: 'Hubble Space Telescope launches. The web is just being invented.' },
  1991: { song: '(Everything I Do) I Do It for You', artist: 'Bryan Adams',         movie: 'Terminator 2: Judgment Day',           topTV: 'Cheers',                           ticket: '$4.21', gas: '$1.14', stamp: '$0.29', newCar: '$15,500', minWage: '$4.25', population: '5.4B', nobel: 'Aung San Suu Kyi (democracy, Myanmar)',        event: 'The Soviet Union collapses. The Cold War is officially over.' },
  1992: { song: 'End of the Road',          artist: 'Boyz II Men',                  movie: 'Aladdin',                              topTV: '60 Minutes',                       ticket: '$4.15', gas: '$1.13', stamp: '$0.29', newCar: '$16,200', minWage: '$4.25', population: '5.5B', nobel: 'Rigoberta Menchú (indigenous rights, Guatemala)', event: 'The World Wide Web opens to the public. Nothing is the same.' },
  1993: { song: 'I Will Always Love You',   artist: 'Whitney Houston',              movie: 'Jurassic Park',                        topTV: '60 Minutes',                       ticket: '$4.14', gas: '$1.11', stamp: '$0.29', newCar: '$16,700', minWage: '$4.25', population: '5.6B', nobel: 'Nelson Mandela & F.W. de Klerk (South Africa)', event: 'Jurassic Park terrifies the world. The internet starts growing.' },
  1994: { song: 'The Sign',                 artist: 'Ace of Base',                  movie: 'The Lion King',                        topTV: 'Home Improvement',                 ticket: '$4.08', gas: '$1.11', stamp: '$0.29', newCar: '$17,200', minWage: '$4.25', population: '5.7B', nobel: 'Yasser Arafat, Rabin & Peres (Oslo Accords)',  event: 'Amazon and Yahoo are founded. Mandela becomes president of South Africa.' },
  1995: { song: "Gangsta's Paradise",       artist: 'Coolio ft. L.V.',              movie: 'Toy Story',                            topTV: 'Seinfeld',                         ticket: '$4.35', gas: '$1.15', stamp: '$0.32', newCar: '$17,800', minWage: '$4.25', population: '5.7B', nobel: 'Pugwash Conferences (against nuclear weapons)', event: 'Windows 95 launches. Everyone gets a computer. eBay is born.' },
  1996: { song: 'Macarena (Bayside Boys Mix)', artist: 'Los Del Rio',               movie: 'Independence Day',                     topTV: 'ER',                               ticket: '$4.42', gas: '$1.23', stamp: '$0.32', newCar: '$18,400', minWage: '$4.75', population: '5.8B', nobel: 'Carlos Belo & José Ramos-Horta (East Timor)',  event: "Dolly the sheep is cloned. Scientists cross a line." },
  1997: { song: 'Candle in the Wind 1997',  artist: 'Elton John',                   movie: 'Titanic',                              topTV: 'Seinfeld',                         ticket: '$4.59', gas: '$1.23', stamp: '$0.32', newCar: '$18,700', minWage: '$5.15', population: '5.9B', nobel: 'International Campaign to Ban Landmines',     event: 'Princess Diana dies. The world mourns together. Harry Potter is published.' },
  1998: { song: 'Too Close',                artist: 'Next',                         movie: 'Saving Private Ryan',                  topTV: 'Seinfeld',                         ticket: '$4.69', gas: '$1.06', stamp: '$0.32', newCar: '$19,400', minWage: '$5.15', population: '5.9B', nobel: 'John Hume & David Trimble (Northern Ireland)', event: 'Google is founded in a garage. The search era begins.' },
  1999: { song: 'Believe',                  artist: 'Cher',                         movie: 'Star Wars: The Phantom Menace',        topTV: 'Who Wants to Be a Millionaire',    ticket: '$5.08', gas: '$1.17', stamp: '$0.33', newCar: '$20,500', minWage: '$5.15', population: '6.0B', nobel: 'Médecins Sans Frontières (Doctors Without Borders)', event: 'Y2K panic grips the world. The dot-com bubble inflates.' },
  2000: { song: 'Breathe',                  artist: 'Faith Hill',                   movie: 'Mission: Impossible 2',                topTV: 'Who Wants to Be a Millionaire',    ticket: '$5.39', gas: '$1.51', stamp: '$0.33', newCar: '$21,800', minWage: '$5.15', population: '6.1B', nobel: 'Kim Dae-jung (democracy & human rights, Korea)', event: 'The dot-com bubble begins to burst. The millennium arrives without apocalypse.' },
  2001: { song: 'Hanging by a Moment',      artist: 'Lifehouse',                    movie: "Harry Potter and the Philosopher's Stone", topTV: 'Survivor',                    ticket: '$5.65', gas: '$1.46', stamp: '$0.34', newCar: '$22,200', minWage: '$5.15', population: '6.2B', nobel: 'UN & Kofi Annan',                             event: '9/11 reshapes the world. Wikipedia is launched.' },
  2002: { song: 'How You Remind Me',        artist: 'Nickelback',                   movie: 'Spider-Man',                           topTV: 'CSI',                              ticket: '$5.80', gas: '$1.36', stamp: '$0.37', newCar: '$22,400', minWage: '$5.15', population: '6.2B', nobel: 'Jimmy Carter (decades of peacemaking)',        event: 'The Euro currency launches across 12 European nations.' },
  2003: { song: 'In Da Club',               artist: '50 Cent',                      movie: 'The Lord of the Rings: Return of the King', topTV: 'CSI',                        ticket: '$6.03', gas: '$1.59', stamp: '$0.37', newCar: '$22,600', minWage: '$5.15', population: '6.3B', nobel: 'Shirin Ebadi (human rights, Iran)',            event: 'Iraq War begins. SpaceX is founded. The Concorde retires.' },
  2004: { song: 'Yeah!',                    artist: 'Usher ft. Lil Jon & Ludacris', movie: 'Shrek 2',                              topTV: 'CSI',                              ticket: '$6.21', gas: '$1.88', stamp: '$0.37', newCar: '$23,300', minWage: '$5.15', population: '6.4B', nobel: 'Wangari Maathai (environment & democracy, Kenya)', event: 'Facebook is founded in a Harvard dorm room.' },
  2005: { song: 'We Belong Together',       artist: 'Mariah Carey',                 movie: 'Star Wars: Revenge of the Sith',       topTV: 'American Idol',                    ticket: '$6.41', gas: '$2.30', stamp: '$0.37', newCar: '$24,100', minWage: '$5.15', population: '6.5B', nobel: 'Mohamed ElBaradei & IAEA (nuclear non-proliferation)', event: 'Hurricane Katrina devastates New Orleans. YouTube is founded.' },
  2006: { song: 'Bad Day',                  artist: 'Daniel Powter',                movie: "Pirates of the Caribbean: Dead Man's Chest", topTV: 'American Idol',             ticket: '$6.55', gas: '$2.59', stamp: '$0.39', newCar: '$24,600', minWage: '$5.15', population: '6.6B', nobel: 'Muhammad Yunus & Grameen Bank (microfinance)',  event: 'Twitter launches. Pluto is stripped of its planet status.' },
  2007: { song: 'Irreplaceable',            artist: 'Beyoncé',                      movie: 'Pirates of the Caribbean: At World\'s End', topTV: 'American Idol',              ticket: '$6.88', gas: '$2.80', stamp: '$0.41', newCar: '$25,400', minWage: '$5.85', population: '6.7B', nobel: 'Al Gore & IPCC (climate change awareness)',   event: 'The iPhone is unveiled. Everything about how we live changes.' },
  2008: { song: 'Low',                      artist: 'Flo Rida ft. T-Pain',          movie: 'The Dark Knight',                      topTV: 'American Idol',                    ticket: '$7.18', gas: '$3.27', stamp: '$0.42', newCar: '$26,300', minWage: '$6.55', population: '6.7B', nobel: 'Martti Ahtisaari (international mediation)',  event: 'Global financial crisis. Barack Obama is elected president.' },
  2009: { song: 'Boom Boom Pow',            artist: 'Black Eyed Peas',              movie: 'Avatar',                               topTV: 'American Idol',                    ticket: '$7.50', gas: '$2.35', stamp: '$0.44', newCar: '$26,900', minWage: '$7.25', population: '6.8B', nobel: 'Barack Obama (new multilateral diplomacy)',   event: 'H1N1 pandemic. Bitcoin is invented. Obama is inaugurated.' },
  2010: { song: 'Need You Now',             artist: 'Lady Antebellum',              movie: 'Toy Story 3',                          topTV: 'American Idol',                    ticket: '$7.89', gas: '$2.79', stamp: '$0.44', newCar: '$28,300', minWage: '$7.25', population: '6.9B', nobel: 'Liu Xiaobo (human rights, China — imprisoned)', event: 'iPad launches. Arab Spring begins. 33 Chilean miners rescued.' },
  2011: { song: 'Rolling in the Deep',      artist: 'Adele',                        movie: 'Harry Potter and the Deathly Hallows Part 2', topTV: 'NCIS',                    ticket: '$7.93', gas: '$3.53', stamp: '$0.44', newCar: '$29,200', minWage: '$7.25', population: '7.0B', nobel: 'Ellen Johnson Sirleaf, Leymah Gbowee & Tawakkol Karman (women\'s peace)', event: 'Osama bin Laden is killed. The Fukushima disaster rocks Japan.' },
  2012: { song: 'Somebody That I Used to Know', artist: 'Gotye ft. Kimbra',         movie: 'The Avengers',                         topTV: 'NCIS',                             ticket: '$7.96', gas: '$3.64', stamp: '$0.45', newCar: '$30,100', minWage: '$7.25', population: '7.0B', nobel: 'European Union (seven decades of peace)',     event: 'Mars Curiosity Rover lands. Gangnam Style breaks the internet.' },
  2013: { song: 'Thrift Shop',              artist: 'Macklemore & Ryan Lewis',      movie: 'Iron Man 3',                           topTV: 'NCIS',                             ticket: '$8.13', gas: '$3.53', stamp: '$0.46', newCar: '$31,000', minWage: '$7.25', population: '7.1B', nobel: 'Organization for the Prohibition of Chemical Weapons', event: 'Edward Snowden leaks NSA surveillance. Pope Francis elected.' },
  2014: { song: 'Happy',                    artist: 'Pharrell Williams',            movie: 'Transformers: Age of Extinction',      topTV: 'NCIS',                             ticket: '$8.17', gas: '$3.37', stamp: '$0.49', newCar: '$32,000', minWage: '$7.25', population: '7.2B', nobel: 'Kailash Satyarthi & Malala Yousafzai (children\'s rights)', event: 'Ice Bucket Challenge raises $220M. Ebola outbreak in West Africa.' },
  2015: { song: 'Uptown Funk',              artist: 'Mark Ronson ft. Bruno Mars',   movie: 'Star Wars: The Force Awakens',         topTV: 'NCIS',                             ticket: '$8.43', gas: '$2.45', stamp: '$0.49', newCar: '$33,500', minWage: '$7.25', population: '7.3B', nobel: 'Tunisian National Dialogue Quartet',          event: 'Same-sex marriage legalized in the US. Pluto photographed for the first time.' },
  2016: { song: 'One Dance',                artist: 'Drake',                        movie: 'Captain America: Civil War',           topTV: 'The Big Bang Theory',              ticket: '$8.65', gas: '$2.14', stamp: '$0.47', newCar: '$34,600', minWage: '$7.25', population: '7.4B', nobel: 'Juan Manuel Santos (Colombia peace deal)',    event: 'Brexit vote shocks Europe. Trump wins the US presidency.' },
  2017: { song: 'Shape of You',             artist: 'Ed Sheeran',                   movie: 'The Fate of the Furious',              topTV: 'The Big Bang Theory',              ticket: '$8.97', gas: '$2.42', stamp: '$0.49', newCar: '$35,600', minWage: '$7.25', population: '7.5B', nobel: 'ICAN (nuclear weapons abolition campaign)',   event: '#MeToo movement sweeps the globe. Hurricane Harvey devastates Houston.' },
  2018: { song: "God's Plan",               artist: 'Drake',                        movie: 'Avengers: Infinity War',               topTV: 'Roseanne (reboot) / NCIS',         ticket: '$9.11', gas: '$2.72', stamp: '$0.50', newCar: '$36,600', minWage: '$7.25', population: '7.6B', nobel: 'Denis Mukwege & Nadia Murad (survivors of war crimes)', event: "Black Panther becomes a cultural phenomenon. First baby born from a uterus transplant." },
  2019: { song: 'Old Town Road',            artist: 'Lil Nas X ft. Billy Ray Cyrus', movie: 'Avengers: Endgame',                  topTV: 'NCIS',                             ticket: '$9.16', gas: '$2.60', stamp: '$0.55', newCar: '$37,300', minWage: '$7.25', population: '7.7B', nobel: 'Abiy Ahmed (Ethiopia peace)',                 event: 'Notre-Dame cathedral burns. Hong Kong protests grip the world. COVID-19 first emerges in Wuhan.' },
  2020: { song: 'Blinding Lights',          artist: 'The Weeknd',                   movie: 'Bad Boys for Life',                    topTV: 'NCIS',                             ticket: '$8.65', gas: '$2.17', stamp: '$0.55', newCar: '$37,900', minWage: '$7.25', population: '7.8B', nobel: 'World Food Programme (fighting hunger in conflict zones)', event: 'COVID-19 pandemic halts the entire world. Black Lives Matter protests erupt globally.' },
  2021: { song: 'drivers license',          artist: 'Olivia Rodrigo',               movie: 'Spider-Man: No Way Home',              topTV: 'NCIS / Squid Game (Netflix)',       ticket: '$9.57', gas: '$3.01', stamp: '$0.58', newCar: '$42,000', minWage: '$7.25', population: '7.9B', nobel: 'Maria Ressa & Dmitry Muratov (press freedom)',  event: 'COVID vaccines roll out globally. A US Capitol riot shocks the world. Squid Game goes viral.' },
  2022: { song: 'As It Was',                artist: 'Harry Styles',                 movie: 'Top Gun: Maverick',                    topTV: 'NCIS / Yellowstone',               ticket: '$10.53', gas: '$3.99', stamp: '$0.60', newCar: '$48,000', minWage: '$7.25', population: '8.0B', nobel: 'Ales Bialiatski, Memorial & Center for Civil Liberties (human rights)', event: 'Russia invades Ukraine. Queen Elizabeth II dies after 70 years on the throne.' },
  2023: { song: 'Flowers',                  artist: 'Miley Cyrus',                  movie: 'Barbie',                               topTV: 'Sunday Night Football / NCIS',     ticket: '$11.51', gas: '$3.53', stamp: '$0.66', newCar: '$48,200', minWage: '$7.25', population: '8.1B', nobel: 'Narges Mohammadi (women\'s rights in Iran)',   event: 'ChatGPT takes over the world. Barbenheimer dominates the summer. AI changes everything.' },
  2024: { song: 'A Bar Song (Tipsy)',        artist: 'Shaboozey',                    movie: 'Inside Out 2',                         topTV: 'Sunday Night Football',            ticket: '$11.73', gas: '$3.31', stamp: '$0.68', newCar: '$47,000', minWage: '$7.25', population: '8.2B', nobel: 'Nihon Hidankyo (Japanese atomic bomb survivors)', event: 'Paris Olympics captivate the world. Trump wins the US presidency again. AI accelerates.' },
  2025: { song: 'APT.',                     artist: 'ROSÉ & Bruno Mars',            movie: 'Ne Zha 2',                             topTV: 'Sunday Night Football',            ticket: '$12.10', gas: '$3.10', stamp: '$0.73', newCar: '$46,800', minWage: '$7.25', population: '8.2B', nobel: 'TBA (Dec 2025)',                              event: 'DeepSeek shocks Silicon Valley. AI agents go mainstream. The world accelerates.' },
};

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

// Always-dark card gradients — vintage aesthetic regardless of app theme
const ERA_GRADIENT: Record<string, string> = {
  '1950s': 'from-amber-950 via-stone-900 to-zinc-900',
  '1960s': 'from-sky-950 via-zinc-900 to-stone-900',
  '1970s': 'from-orange-950 via-zinc-900 to-stone-900',
  '1980s': 'from-fuchsia-950 via-zinc-900 to-zinc-950',
  '1990s': 'from-violet-950 via-zinc-900 to-zinc-950',
  '2000s': 'from-blue-950 via-zinc-900 to-zinc-950',
  '2010s': 'from-emerald-950 via-zinc-900 to-zinc-950',
  '2020s': 'from-cyan-950 via-zinc-900 to-zinc-950',
};

const DATA_YEARS = Object.keys(YEAR_DATA).map(Number).sort((a, b) => a - b);
const MIN_YEAR   = DATA_YEARS[0];
const MAX_YEAR   = DATA_YEARS[DATA_YEARS.length - 1];

function getEra(year: number): string {
  const decade = Math.floor(year / 10) * 10;
  return `${decade}s`;
}

function getEraGradient(year: number): string {
  return ERA_GRADIENT[getEra(year)] ?? 'from-zinc-900 via-zinc-900 to-zinc-950';
}

function getDaysAlive(month: number, day: number, year: number): number {
  const birth = new Date(year, month - 1, day);
  const now   = new Date();
  return Math.floor((now.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24));
}

// ── Stat chip (always dark — lives inside the card) ─────────────
function Chip({ label, value, emoji }: { label: string; value: string; emoji: string }) {
  return (
    <div className="flex flex-col gap-0.5 px-3 py-2.5 rounded-xl"
      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <span className="text-[10px] uppercase tracking-widest font-semibold text-zinc-500 leading-tight">{label}</span>
      <div className="flex items-center gap-1.5 mt-0.5">
        <span className="text-base leading-none">{emoji}</span>
        <span className="text-[13px] font-bold text-zinc-200 leading-snug">{value}</span>
      </div>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────
export function SoundOfYourBirthApp() {
  const [month,  setMonth]  = useState('');
  const [day,    setDay]    = useState('');
  const [year,   setYear]   = useState('');
  const [shown,  setShown]  = useState(false);
  const [saving, setSaving] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const yearNum  = parseInt(year,  10);
  const monthNum = parseInt(month, 10);
  const dayNum   = parseInt(day,   10);
  const isValid  = !isNaN(yearNum) && !isNaN(monthNum) && !isNaN(dayNum)
    && yearNum >= MIN_YEAR && yearNum <= MAX_YEAR;
  const data = isValid ? YEAR_DATA[yearNum] ?? null : null;
  const daysAlive  = isValid ? getDaysAlive(monthNum, dayNum, yearNum) : 0;
  const yearsAlive = isValid ? Math.floor(daysAlive / 365.25) : 0;
  const eraGradient = isValid ? getEraGradient(yearNum) : '';

  const formattedDate = isValid
    ? `${MONTHS[monthNum - 1]} ${dayNum}, ${yearNum}`
    : '';

  const days        = Array.from({ length: 31 }, (_, i) => i + 1);
  const selectYears = Array.from({ length: MAX_YEAR - MIN_YEAR + 1 }, (_, i) => MAX_YEAR - i);

  const handleReveal = () => { if (isValid) setShown(true); };

  const handleSave = useCallback(async () => {
    if (!cardRef.current) return;
    setSaving(true);
    try {
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 3, cacheBust: true });
      const link = document.createElement('a');
      link.download = `sound-of-your-birth-${yearNum}.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.error('Failed to save card:', e);
    } finally {
      setSaving(false);
    }
  }, [yearNum]);

  return (
    <div className="py-2 sm:py-4 max-w-2xl mx-auto space-y-5">

      {/* Form — uses CSS vars for theme compat (light/dark/cosmos) */}
      <div>
        <p className="text-[10px] uppercase tracking-widest font-semibold mb-1"
          style={{ color: 'var(--curio-text-muted)' }}>Your birthday</p>
        <div className="flex flex-wrap gap-2 items-end">

          <div>
            <p className="text-[10px] mb-1" style={{ color: 'var(--curio-text-muted)' }}>Month</p>
            <select value={month} onChange={e => { setMonth(e.target.value); setShown(false); }}
              className="text-sm font-medium rounded-xl px-3 py-2 outline-none cursor-pointer"
              style={{ background: 'var(--curio-bg-secondary)', border: '1px solid var(--curio-border)', color: 'var(--curio-text)' }}>
              <option value="">—</option>
              {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
            </select>
          </div>

          <div>
            <p className="text-[10px] mb-1" style={{ color: 'var(--curio-text-muted)' }}>Day</p>
            <select value={day} onChange={e => { setDay(e.target.value); setShown(false); }}
              className="text-sm font-medium rounded-xl px-3 py-2 outline-none cursor-pointer"
              style={{ background: 'var(--curio-bg-secondary)', border: '1px solid var(--curio-border)', color: 'var(--curio-text)' }}>
              <option value="">—</option>
              {days.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <div>
            <p className="text-[10px] mb-1" style={{ color: 'var(--curio-text-muted)' }}>Year</p>
            <select value={year} onChange={e => { setYear(e.target.value); setShown(false); }}
              className="text-sm font-medium rounded-xl px-3 py-2 outline-none cursor-pointer"
              style={{ background: 'var(--curio-bg-secondary)', border: '1px solid var(--curio-border)', color: 'var(--curio-text)' }}>
              <option value="">—</option>
              {selectYears.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          <motion.button
            onClick={handleReveal}
            disabled={!isValid}
            whileTap={{ scale: 0.96 }}
            className="px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              background:    isValid ? 'linear-gradient(135deg, #f97316, #ec4899)' : 'var(--curio-bg-secondary)',
              border:        isValid ? 'none' : '1px solid var(--curio-border)',
              color:         isValid ? '#fff' : 'var(--curio-text-muted)',
              boxShadow:     isValid ? '0 4px 20px rgba(249,115,22,0.3)' : undefined,
            }}>
            Transport me back →
          </motion.button>
        </div>
      </div>

      {/* Card */}
      <AnimatePresence>
        {shown && data && (
          <motion.div key={year}
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>

            {/* ref captures only the visual card */}
            <div ref={cardRef}
              className={`rounded-2xl overflow-hidden bg-gradient-to-br ${eraGradient}`}
              style={{ border: '1px solid rgba(255,255,255,0.09)' }}>

              <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #f97316, #ec4899, #8b5cf6)' }} />

              <div className="p-5 sm:p-6 space-y-5">

                {/* Date + era */}
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-500 mb-1">The world on</p>
                  <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">{formattedDate}</h2>
                  <p className="text-xs text-zinc-500 mt-1">
                    {yearsAlive} years ago · {daysAlive.toLocaleString()} days on Earth · the {getEra(yearNum)}
                  </p>
                </div>

                <div className="h-px bg-white/[0.06]" />

                {/* #1 Song */}
                <div>
                  <p className="text-[10px] uppercase tracking-widest font-semibold text-orange-400/80 mb-2">
                    🎵 Global #1 song (Billboard Year-End)
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="relative shrink-0 w-14 h-14 rounded-full flex items-center justify-center"
                      style={{
                        background: 'radial-gradient(circle, #1a1a1a 28%, #2d2d2d 28%, #2d2d2d 40%, #1a1a1a 40%, #1a1a1a 55%, #2d2d2d 55%, #2d2d2d 70%, #1a1a1a 70%)',
                        boxShadow: '0 0 0 2px rgba(249,115,22,0.3), 0 4px 16px rgba(0,0,0,0.5)',
                      }}>
                      <div className="w-3 h-3 rounded-full bg-orange-400/60" />
                    </div>
                    <div>
                      <p className="text-lg sm:text-xl font-black text-white leading-tight">&ldquo;{data.song}&rdquo;</p>
                      <p className="text-sm text-zinc-400 mt-0.5">{data.artist}</p>
                    </div>
                  </div>
                </div>

                <div className="h-px bg-white/[0.06]" />

                {/* Film + TV side by side */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest font-semibold text-pink-400/80 mb-1.5">
                      🎬 Top film (worldwide)
                    </p>
                    <p className="text-base font-black text-white leading-tight">{data.movie}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest font-semibold text-sky-400/80 mb-1.5">
                      📺 #1 TV show
                    </p>
                    <p className="text-base font-black text-white leading-tight">{data.topTV}</p>
                  </div>
                </div>

                <div className="h-px bg-white/[0.06]" />

                {/* Nobel Peace Prize */}
                <div>
                  <p className="text-[10px] uppercase tracking-widest font-semibold text-yellow-400/70 mb-1.5">
                    🕊️ Nobel Peace Prize
                  </p>
                  <p className="text-sm font-semibold text-zinc-200 leading-snug">{data.nobel}</p>
                </div>

                <div className="h-px bg-white/[0.06]" />

                {/* US price grid — clearly labeled */}
                <div>
                  <p className="text-[10px] uppercase tracking-widest font-semibold text-zinc-500 mb-2">
                    US prices in {yearNum}
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <Chip emoji="🎟️" label="Movie ticket"    value={data.ticket} />
                    <Chip emoji="⛽" label="Gas / gallon"     value={data.gas} />
                    <Chip emoji="✉️" label="Postage stamp"    value={data.stamp} />
                    <Chip emoji="🚗" label="New car (avg)"    value={data.newCar} />
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <Chip emoji="💵" label="Min. wage / hr"    value={data.minWage} />
                    <Chip emoji="🌍" label="World population"  value={data.population} />
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

                {/* Footer */}
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <p className="text-xs text-zinc-600 italic">
                    You have lived {daysAlive.toLocaleString()} days. Make them count.
                  </p>
                  <span className="text-[10px] font-mono text-zinc-600 border border-white/[0.06] px-2 py-0.5 rounded-full">
                    {getEra(yearNum)}
                  </span>
                </div>
              </div>
            </div>

            {/* Save button — outside the card ref so it's not captured in the screenshot */}
            <motion.button
              onClick={handleSave}
              disabled={saving}
              whileTap={{ scale: 0.97 }}
              className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-50"
              style={{
                background: 'var(--curio-bg-secondary)',
                border: '1px solid var(--curio-border)',
                color: 'var(--curio-text-secondary)',
              }}>
              {saving ? (
                <>
                  <motion.span
                    className="inline-block w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} />
                  Saving…
                </>
              ) : <>⬇ Save card as image</>}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Placeholder */}
      {!shown && (
        <div className="rounded-2xl p-8 flex flex-col items-center justify-center gap-3 text-center"
          style={{ background: 'var(--curio-bg-secondary)', border: '1px solid var(--curio-border)', minHeight: 220 }}>
          <span className="text-4xl">🎵</span>
          <p className="text-sm max-w-xs" style={{ color: 'var(--curio-text-muted)' }}>
            Enter your birthday to discover the #1 song, top film, Nobel Peace Prize winner, and world events from the year you arrived — {MIN_YEAR} to {MAX_YEAR}.
          </p>
        </div>
      )}
    </div>
  );
}
