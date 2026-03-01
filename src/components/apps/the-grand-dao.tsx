'use client';

import { useState, useCallback, useEffect, useRef, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toPng } from 'html-to-image';

// ─────────────────────────────────────────────────────────────────
// THE GRAND DAO — cultivation wisdom, Dao Names, debates, verdicts
// ─────────────────────────────────────────────────────────────────

const GOLD        = '#c9a227';
const GOLD_DIM    = 'rgba(201,162,39,0.09)';
const GOLD_BORDER = 'rgba(201,162,39,0.2)';
const CREAM       = 'rgba(255,245,210,0.88)';
const MUTED       = 'rgba(201,162,39,0.55)';
const FAINT       = 'rgba(201,162,39,0.28)';

// ─────────────────────────────────────────────────────────────────
// REALM SYSTEM — 10 realms, advance every 3 days streak
// ─────────────────────────────────────────────────────────────────

const REALMS = [
  'Body Tempering',
  'Qi Condensation',
  'Foundation Establishment',
  'Core Formation',
  'Nascent Soul',
  'Spirit Severing',
  'Dao Seeking',
  'Ancient Realm',
  'Immortal Realm',
  'Transcendent',
];

interface StreakInfo {
  streak: number;
  realmIdx: number;
  realm: string;
  justBrokeThrough: boolean;
  daysToNext: number;
}

function updateAndGetStreak(): StreakInfo {
  const today    = new Date().toDateString();
  const lastVisit  = localStorage.getItem('curio-dao-lastvisit') ?? '';
  const prevStreak = parseInt(localStorage.getItem('curio-dao-streak') ?? '0');
  const prevRealm  = parseInt(localStorage.getItem('curio-dao-realm-idx') ?? '0');

  let newStreak = prevStreak;

  if (lastVisit !== today) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const isConsecutive = lastVisit === yesterday.toDateString();
    newStreak = isConsecutive ? prevStreak + 1 : 1;
    localStorage.setItem('curio-dao-lastvisit', today);
    localStorage.setItem('curio-dao-streak', String(newStreak));
  }

  const newRealmIdx      = Math.min(REALMS.length - 1, Math.floor(newStreak / 3));
  const justBrokeThrough = lastVisit !== today && newRealmIdx > prevRealm;
  if (justBrokeThrough) localStorage.setItem('curio-dao-realm-idx', String(newRealmIdx));

  const daysToNext = newRealmIdx < REALMS.length - 1
    ? (newRealmIdx + 1) * 3 - newStreak
    : 0;

  return { streak: newStreak, realmIdx: newRealmIdx, realm: REALMS[newRealmIdx], justBrokeThrough, daysToNext };
}

// ─────────────────────────────────────────────────────────────────
// HISTORY
// ─────────────────────────────────────────────────────────────────

export interface SavedItem {
  id: string;
  type: 'quote' | 'dao-name' | 'verdict';
  label: string;
  content: string;
  sub?: string;
  savedAt: number;
}

const HISTORY_KEY = 'curio-dao-history';

function loadHistory(): SavedItem[] {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]'); }
  catch { return []; }
}

function addToHistory(item: Omit<SavedItem, 'id' | 'savedAt'>) {
  const existing = loadHistory();
  const newItem: SavedItem = { ...item, id: String(Date.now()), savedAt: Date.now() };
  const updated = [newItem, ...existing].slice(0, 30);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  return updated;
}

function formatSavedAt(ts: number) {
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ─────────────────────────────────────────────────────────────────
// AUDIO HOOK — OpenAI onyx TTS
// ─────────────────────────────────────────────────────────────────

type AudioState = 'idle' | 'loading' | 'playing';

function useAudio() {
  const [state, setState] = useState<AudioState>('idle');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const play = useCallback(async (text: string) => {
    if (state === 'playing') {
      audioRef.current?.pause();
      setState('idle');
      return;
    }
    setState('loading');
    try {
      const res = await fetch('/api/generate/dao-tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      if (audioRef.current) { audioRef.current.pause(); URL.revokeObjectURL(audioRef.current.src); }
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => setState('idle');
      audio.onerror = () => setState('idle');
      await audio.play();
      setState('playing');
    } catch { setState('idle'); }
  }, [state]);

  useEffect(() => () => { audioRef.current?.pause(); }, []);
  return { state, play };
}

// ─────────────────────────────────────────────────────────────────
// SHARE
// ─────────────────────────────────────────────────────────────────

async function copyToClipboard(text: string, attr?: string): Promise<boolean> {
  const full = attr ? `"${text}"\n— ${attr}\n\nfrom The Grand Dao` : `${text}\n\nfrom The Grand Dao`;
  try { await navigator.clipboard.writeText(full); return true; }
  catch { return false; }
}

// ─────────────────────────────────────────────────────────────────
// DOWNLOAD CARD — renders an off-screen div and captures as PNG
// ─────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────
// INLINE ACTION BUTTONS
// ─────────────────────────────────────────────────────────────────

function AudioBtn({ text, small }: { text: string; small?: boolean }) {
  const { state, play } = useAudio();
  const sz = small ? 'px-2 py-1 text-[10px]' : 'px-2.5 py-1.5 text-xs';
  return (
    <button
      onClick={() => play(text)}
      title={state === 'playing' ? 'Stop' : 'Hear the Dao (onyx voice)'}
      className={`dao-icon-btn ${sz} rounded-lg font-medium`}
      style={{ opacity: state === 'loading' ? 0.5 : 1 }}
    >
      {state === 'loading' ? '◌' : state === 'playing' ? '⏹' : '🔊'}
    </button>
  );
}

function CopyBtn({ content, attr, small }: { content: string; attr?: string; small?: boolean }) {
  const [copied, setCopied] = useState(false);
  const sz = small ? 'px-2 py-1 text-[10px]' : 'px-2.5 py-1.5 text-xs';
  return (
    <button
      onClick={async () => { if (await copyToClipboard(content, attr)) { setCopied(true); setTimeout(() => setCopied(false), 2000); } }}
      className={`dao-icon-btn ${sz} rounded-lg font-medium`}
    >
      {copied ? '✓' : '⧉'}
    </button>
  );
}

function SaveBtn({ item, onSaved, small }: { item: Omit<SavedItem, 'id' | 'savedAt'>; onSaved: () => void; small?: boolean }) {
  const [saved, setSaved] = useState(false);
  const sz = small ? 'px-2 py-1 text-[10px]' : 'px-2.5 py-1.5 text-xs';
  return (
    <button
      onClick={() => { if (!saved) { addToHistory(item); setSaved(true); onSaved(); setTimeout(() => setSaved(false), 2500); } }}
      className={`dao-icon-btn ${sz} rounded-lg font-medium`}
      style={{ color: saved ? GOLD : undefined }}
    >
      {saved ? '✦ saved' : '✦'}
    </button>
  );
}

// Proven pattern: always-in-DOM off-screen card captured by toPng via ref
const DaoExportCard = forwardRef<HTMLDivElement, {
  typeLabel: string;
  headline?: string;   // for Dao Name (large title treatment)
  content: string;
  attr?: string;
}>(({ typeLabel, headline, content, attr }, ref) => (
  <div style={{ position: 'fixed', left: '-9999px', top: 0, pointerEvents: 'none', zIndex: -1 }}>
    <div ref={ref} style={{
      width: '800px',
      padding: '64px 72px 56px',
      background: '#0d0b04',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      position: 'relative',
    }}>
      <div style={{
        border: '1px solid rgba(201,162,39,0.22)',
        borderRadius: '16px',
        padding: '52px 56px 48px',
        background: 'rgba(201,162,39,0.05)',
      }}>
        <p style={{
          fontSize: '11px', letterSpacing: '0.22em', textTransform: 'uppercase',
          color: 'rgba(201,162,39,0.5)', margin: '0 0 28px', textAlign: 'center',
        }}>❧ &nbsp; {typeLabel} &nbsp; ❧</p>

        {headline ? (
          <>
            <p style={{
              fontSize: '38px', fontWeight: 700, letterSpacing: '-0.01em',
              color: '#c9a227', textAlign: 'center', margin: '0 0 20px',
              textShadow: '0 0 40px rgba(201,162,39,0.35)',
            }}>{headline}</p>
            {content && (
              <p style={{
                fontSize: '16px', fontStyle: 'italic', lineHeight: 1.75,
                color: 'rgba(255,245,210,0.85)', textAlign: 'center', margin: '0 0 36px',
              }}>{content}</p>
            )}
          </>
        ) : (
          <p style={{
            fontSize: '22px', fontStyle: 'italic', lineHeight: 1.8,
            color: 'rgba(255,245,210,0.9)', textAlign: 'center', margin: '0 0 28px',
          }}>&ldquo;{content}&rdquo;</p>
        )}

        {attr && (
          <p style={{
            fontSize: '12px', letterSpacing: '0.1em',
            color: 'rgba(201,162,39,0.45)', textAlign: 'center', margin: '0 0 40px',
          }}>&mdash; {attr}</p>
        )}

        <div style={{
          height: '1px', margin: '0 0 24px',
          background: 'linear-gradient(to right, transparent, rgba(201,162,39,0.2), transparent)',
        }} />
        <p style={{
          fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase',
          color: 'rgba(201,162,39,0.28)', textAlign: 'center',
        }}>The Grand Dao &middot; curio</p>
      </div>
    </div>
  </div>
));
DaoExportCard.displayName = 'DaoExportCard';

function DownloadBtn({ cardRef, filename, small }: {
  cardRef: React.RefObject<HTMLDivElement>;
  filename: string;
  small?: boolean;
}) {
  const [exporting, setExporting] = useState(false);
  const sz = small ? 'px-2 py-1 text-[10px]' : 'px-2.5 py-1.5 text-xs';
  const download = async () => {
    if (!cardRef.current || exporting) return;
    setExporting(true);
    try {
      const url = await toPng(cardRef.current, { pixelRatio: 2, cacheBust: true });
      const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent);
      if (isMobile && navigator.canShare) {
        try {
          const blob = await (await fetch(url)).blob();
          const file = new File([blob], `${filename}.png`, { type: 'image/png' });
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({ files: [file], title: 'The Grand Dao' });
            return; // share succeeded or user dismissed — either way, done
          }
        } catch (e) {
          // AbortError = user dismissed the share sheet — do nothing
          if (e instanceof Error && e.name === 'AbortError') return;
          // Any other share error falls through to desktop download below
        }
      }
      const link = document.createElement('a');
      link.download = `${filename}.png`;
      link.href = url;
      link.click();
    } catch (e) { console.error('Export failed', e); }
    finally { setExporting(false); }
  };
  return (
    <button
      onClick={download}
      title="Download as image"
      className={`dao-icon-btn ${sz} rounded-lg font-medium`}
      style={{ opacity: exporting ? 0.5 : 1 }}
    >
      {exporting ? '◌' : '↓'}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────
// VAULT — 32 quotes with real MC attributions
// ─────────────────────────────────────────────────────────────────

const VAULT: { text: string; attr: string }[] = [
  { text: 'Spiritual stones are the foundation of all cultivation. Without wealth, the Dao is inaccessible to even the most gifted.', attr: 'Meng Hao (ISSTH), upon opening his first shop on the Reliance Sect' },
  { text: 'True power requires only the will to devour and surpass. Resources are a crutch invented by those too weak to simply take.', attr: 'Fang Yuan (Reverend Insanity), 500 years after his first reincarnation' },
  { text: 'Maintain sufficient composure at all times. The moment sentiment guides your blade, you have already been defeated.', attr: 'Klein Moretti (Lord of Mysteries), written in his private journal as the Fool' },
  { text: 'I may be terrified. I may retreat. But I never forget who I am or where I came from. The self is not an obstacle to the Dao — it is the Dao.', attr: 'Bai Xiaochun (A Will Eternal), year 41 of his Heaven Dao cultivation' },
  { text: 'The fire that ignites in the face of injustice is the purest Dao Heart. A thousand techniques cannot match one moment of righteous fury.', attr: 'Chu Feng (Martial God Asura), before his third Taboo Martial Skill' },
  { text: 'The Heavens are neither merciful nor cruel. They simply are. It is cultivators who mistake indifference for justice.', attr: 'Patriarch Reliance (ISSTH), final sermon before departing for the stars' },
  { text: 'A cultivator who fears death will spend their immortality living as though already dead.', attr: 'Yao Chen (Battle Through the Heavens), addressing his disciples before ascending' },
  { text: 'A sword without a wielder is iron. A cultivator without conviction is the same.', attr: 'Xiao Yan (Battle Through the Heavens), at the peak of Douhuang' },
  { text: 'I will not advance until I am absolutely certain nothing can kill me at this stage. Shallow foundations crack under their own weight.', attr: 'Bai Xiaochun (A Will Eternal), refusing his third premature breakthrough' },
  { text: 'Keep your secrets close and your true face hidden. In a world where everyone wears a mask, trust is a luxury the strong cannot afford.', attr: 'Klein Moretti (Lord of Mysteries), the Fool\'s first rule of survival' },
  { text: 'My attachment to those I love does not weaken my Dao — it is the very heart of why I cultivate. Severing emotion is severing yourself.', attr: 'Meng Hao (ISSTH), before severing his seventh lifetime' },
  { text: 'Legacy is a story told by those who remain. True transcendence means leaving the story entirely. There is no audience beyond the apex.', attr: 'Klein Moretti (Lord of Mysteries), in a letter sent to no one' },
  { text: 'The greatest tribulation a cultivator faces is not lightning from the heavens. It is the silence within.', attr: 'Nameless Inscription, Shattered Vault of Ten Thousand Trials' },
  { text: 'Power is a river. Those who seek to dam it drown. Those who learn to flow with it become the river itself.', attr: 'Ancient Stele, Sect of the Eternal Current' },
  { text: 'To cultivate is not to acquire power. It is to shed everything that prevents you from seeing what you already are.', attr: 'The Void Patriarch, Third Sermon' },
  { text: 'The Dao does not reward talent. It rewards the one who endures long after talent has abandoned them.', attr: 'Inscription on the Gate of Ten Thousand Trials' },
  { text: 'To shatter the sky, you must first shatter every belief you hold about what the sky is.', attr: 'Elder Huang, upon reaching Immortal Ascension — last recorded words' },
  { text: 'An immortal who has forgotten mortality is not immortal. They are simply a mortal who has not yet learned that they will die.', attr: 'The Hollow Sage, Fragment XII' },
  { text: 'The mountain does not move because it wishes stillness. The mountain does not move because it has become the ground.', attr: 'Dao of the Unmoving, Fragment III' },
  { text: 'Every cultivator believes their path is unique. This is both the greatest truth and the gravest delusion.', attr: 'Records of the Ten Thousand Paths' },
  { text: 'One thousand years of cultivation cannot buy a single honest moment of self-knowledge.', attr: 'The Silent Ancestor, before his final seclusion' },
  { text: 'You will know you have found your Dao when the pursuit of it costs you everything you once were.', attr: 'Wall Inscription, Dao Heart Proving Ground' },
  { text: 'The void is not empty. It is so full that nothing further can be added.', attr: 'Text on the First Heaven\'s Gate' },
  { text: 'Destiny is the story the weak tell themselves. The strong are too busy writing.', attr: 'Words of Patriarch Wuji, carved into the threshold of the Sovereign Hall' },
  { text: 'That which appears as loss to the mortal eye often appears as refinement to the eternal one.', attr: 'Scripture of the Ten Thousand Sorrows' },
  { text: 'Control nothing. Influence everything. This is the first mystery of the Grand Dao.', attr: 'The Grand Dao, Opening Line' },
  { text: 'The cultivator who chases power chases a shadow. The cultivator who understands emptiness holds the shadow\'s source.', attr: 'Teachings of the Formless Hall' },
  { text: 'Ten thousand years of karma do not arrive as thunder. They arrive as a quiet decision on an ordinary day.', attr: 'Karmic Record, Celestial Bureau' },
  { text: 'A river does not mourn the water it no longer holds. Neither should you mourn the self you are transcending.', attr: 'The River Sutra, Verse 9' },
  { text: 'Those who cultivate in pursuit of longevity often achieve it, only to discover they have outlived every reason they had to live.', attr: 'The Hollow Immortal\'s Lament' },
  { text: 'The first breakthrough costs effort. The second costs blood. The third costs identity. After that, the price changes.', attr: 'What They Do Not Tell Disciples — anonymous scroll' },
  { text: 'The cosmos was not built for your suffering, nor for your joy. This should terrify you — and then free you.', attr: 'The Wanderer\'s Last Sutra' },
];

function pickRandom<T>(arr: T[], exclude?: T): T {
  const pool = exclude !== undefined ? arr.filter(x => x !== exclude) : arr;
  return pool[Math.floor(Math.random() * pool.length)];
}

// Shuffled-deck iterator — cycles through all items before repeating
function makeDeck<T>(arr: T[]): { next: (exclude?: T) => T } {
  let deck: T[] = [];
  const reshuffle = (exclude?: T) => {
    deck = [...arr].sort(() => Math.random() - 0.5);
    if (exclude !== undefined && deck[0] === exclude && deck.length > 1) {
      // avoid immediate repeat across reshuffles
      const swap = Math.floor(Math.random() * (deck.length - 1)) + 1;
      [deck[0], deck[swap]] = [deck[swap], deck[0]];
    }
  };
  return {
    next(exclude?: T) {
      if (deck.length === 0) reshuffle(exclude);
      return deck.pop()!;
    },
  };
}

// ─────────────────────────────────────────────────────────────────
// DEBATES — 8 MC philosophical clashes, rotate by day of year
// ─────────────────────────────────────────────────────────────────

interface Debate {
  id: string;
  theme: string;
  mcA: string; novelA: string; philosophyA: string;
  mcB: string; novelB: string; philosophyB: string;
}

const DEBATES: Debate[] = [
  { id: 'wealth-vs-will',         theme: 'The Root of Power',
    mcA: 'Meng Hao',           novelA: 'ISSTH',
    philosophyA: 'Spiritual stones are the foundation of all cultivation. Without wealth, the Dao is inaccessible to even the most gifted.',
    mcB: 'Fang Yuan',           novelB: 'Reverend Insanity',
    philosophyB: 'True power requires only the will to devour and surpass. Resources are a crutch invented by those too weak to simply take.' },
  { id: 'emotion-vs-composure',   theme: 'The Cultivator\'s Heart',
    mcA: 'Meng Hao',           novelA: 'ISSTH',
    philosophyA: 'My attachment to those I love does not weaken my Dao — it is the heart of why I cultivate. Severing emotion is severing yourself.',
    mcB: 'Klein Moretti',       novelB: 'Lord of Mysteries',
    philosophyB: 'Maintain sufficient composure at all times. The moment sentiment guides your decisions, you have already lost.' },
  { id: 'speed-vs-foundation',    theme: 'The Path Forward',
    mcA: 'Xiao Yan',            novelA: 'BTTH',
    philosophyA: 'Speed fueled by conviction is not recklessness — it is efficiency. Talent that moves fast builds faster foundations than caution ever can.',
    mcB: 'Bai Xiaochun',        novelB: 'A Will Eternal',
    philosophyB: 'I will not advance until I am absolutely certain nothing at this stage can kill me. A shallow foundation cracks under its own ambition.' },
  { id: 'righteousness-vs-power', theme: 'The Dao\'s Justification',
    mcA: 'Chu Feng',            novelA: 'Martial God Asura',
    philosophyA: 'The fire that ignites in the face of injustice is the purest cultivation. A righteous Dao Heart outweighs all the techniques in the world.',
    mcB: 'Fang Yuan',           novelB: 'Reverend Insanity',
    philosophyB: 'Righteousness is a story the powerful tell the weak to keep them compliant. Power is its own justification. Nothing else matters.' },
  { id: 'solitude-vs-fellowship', theme: 'The Cost of Trust',
    mcA: 'Klein Moretti',       novelA: 'Lord of Mysteries',
    philosophyA: 'Keep your secrets and your true face hidden. In a world where everyone wears a mask, trust is a luxury the strong cannot afford.',
    mcB: 'Meng Hao',            novelB: 'ISSTH',
    philosophyB: 'Every great cultivator I know has someone they refused to abandon. That is not weakness. That is the mountain that does not move.' },
  { id: 'legacy-vs-ascension',    theme: 'What You Leave Behind',
    mcA: 'Chu Feng',            novelA: 'Martial God Asura',
    philosophyA: 'I fight for those who cannot fight. My legacy is the name carved into the hearts of the weak. That is a cultivation worth any cost.',
    mcB: 'Klein Moretti',       novelB: 'Lord of Mysteries',
    philosophyB: 'Legacy is a story told by those who remain. True transcendence means leaving the story entirely. There is no audience beyond the apex.' },
  { id: 'survival-vs-morality',   theme: 'The Nature of Virtue',
    mcA: 'Patriarch Reliance',  novelA: 'ISSTH',
    philosophyA: 'The Heavens do not care about morality. They care about results. Survival is not a virtue — it is the prerequisite to all virtues.',
    mcB: 'Yao Chen',            novelB: 'BTTH',
    philosophyB: 'A cultivator without morality is a sword without purpose — powerful, perhaps, but ultimately a tool in search of a hand that never arrives.' },
  { id: 'identity-vs-transformation', theme: 'The Self and the Dao',
    mcA: 'Bai Xiaochun',        novelA: 'A Will Eternal',
    philosophyA: 'I may be terrified. I may retreat. But I never forget who I am. The self is not an obstacle to the Dao — it is the Dao walking.',
    mcB: 'Fang Yuan',           novelB: 'Reverend Insanity',
    philosophyB: 'The self that exists today must be willing to destroy every prior version of itself. Attachment to identity is the final chain.' },
];

function getTodaysDebate(): Debate {
  const now   = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const day   = Math.floor((now.getTime() - start.getTime()) / 86_400_000);
  return DEBATES[day % DEBATES.length];
}

// ─────────────────────────────────────────────────────────────────
// CULTIVATION HEADER — streak + realm + progress
// ─────────────────────────────────────────────────────────────────

function CultivationHeader({ info }: { info: StreakInfo }) {
  const progress = info.realmIdx < REALMS.length - 1
    ? Math.min(100, ((3 - info.daysToNext) / 3) * 100)
    : 100;

  return (
    <div className="rounded-xl px-4 py-3 flex items-center justify-between gap-4"
      style={{ background: GOLD_DIM, border: `1px solid ${GOLD_BORDER}` }}>
      <div className="space-y-0.5">
        <p className="text-[10px] tracking-widest uppercase" style={{ color: MUTED }}>Cultivation</p>
        <p className="text-sm font-bold" style={{ color: GOLD }}>{info.realm}</p>
      </div>
      <div className="flex-1 flex flex-col gap-1 max-w-[160px]">
        <div className="flex items-center justify-between text-[10px]" style={{ color: MUTED }}>
          <span>Day {info.streak}</span>
          {info.realmIdx < REALMS.length - 1
            ? <span>{info.daysToNext}d → {REALMS[info.realmIdx + 1]}</span>
            : <span>Peak attained</span>}
        </div>
        <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(201,162,39,0.12)' }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg, ${GOLD}, #e8c547)` }}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </div>
      </div>
      <div className="text-right space-y-0.5">
        <p className="text-[10px] tracking-widest uppercase" style={{ color: MUTED }}>Streak</p>
        <p className="text-sm font-bold tabular-nums" style={{ color: CREAM }}>{info.streak} 🔥</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// BREAKTHROUGH TOAST
// ─────────────────────────────────────────────────────────────────

function BreakthroughToast({ realm, onDismiss }: { realm: string; onDismiss: () => void }) {
  useEffect(() => { const t = setTimeout(onDismiss, 6000); return () => clearTimeout(t); }, [onDismiss]);
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 24 }}
      onClick={onDismiss}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl text-sm font-semibold text-center cursor-pointer"
      style={{ background: 'rgba(10,8,2,0.97)', border: `1px solid ${GOLD}`,
        boxShadow: `0 0 30px rgba(201,162,39,0.4), 0 4px 24px rgba(0,0,0,0.6)`, color: GOLD, whiteSpace: 'nowrap' }}
    >
      ⚡ Tribulation survived. You have entered the&nbsp;
      <span style={{ color: CREAM }}>{realm}</span>&nbsp;realm.
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────
// DAO CODEX — 30s rotation, AI invoke, audio, save
// ─────────────────────────────────────────────────────────────────

// One shared deck instance per mount — persists across interval ticks
const vaultDeck = makeDeck(VAULT);

function DaoCodex({ onHistoryUpdate }: { onHistoryUpdate: () => void }) {
  const deckRef              = useRef(vaultDeck);
  const exportRef            = useRef<HTMLDivElement>(null);
  const [quote,   setQuote]  = useState<{ text: string; attr: string }>(() => deckRef.current.next());
  const [isAi,    setIsAi]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [key,     setKey]    = useState(0);
  const [deckPos, setDeckPos] = useState(1); // how many vault quotes shown this cycle

  // 30-second auto-rotation (vault only, not AI quotes)
  // Uses shuffled deck — no repeated quote until all 32 are seen
  useEffect(() => {
    const id = setInterval(() => {
      if (isAi) return;
      setQuote(() => {
        const next = deckRef.current.next();
        setDeckPos(p => p < VAULT.length ? p + 1 : 1);
        setKey(k => k + 1);
        return next;
      });
    }, 30_000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAi]);

  const shuffle = () => {
    const next = deckRef.current.next(quote);
    setQuote(next);
    setDeckPos(p => p < VAULT.length ? p + 1 : 1);
    setIsAi(false);
    setKey(k => k + 1);
  };

  const invokeAi = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch('/api/generate/grand-dao', { method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'quote' }) });
      const data = await res.json();
      const lines = (data.result as string).split('\n').filter(Boolean);
      setQuote({ text: lines[0] ?? data.result, attr: lines[1] ?? 'The Dao Speaks' });
      setIsAi(true);
      setKey(k => k + 1);
    } finally { setLoading(false); }
  }, []);

  return (
    <div className="rounded-2xl p-6 space-y-5" style={{ background: GOLD_DIM, border: `1px solid ${GOLD_BORDER}` }}>
      <p className="text-xs font-semibold tracking-[0.22em] uppercase text-center" style={{ color: MUTED }}>
        ❧ &nbsp; The Codex &nbsp; ❧
      </p>
      <AnimatePresence mode="wait">
        <motion.div key={key} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.4 }} className="space-y-3 text-center">
          <p className="text-base sm:text-lg leading-relaxed" style={{ color: CREAM, fontStyle: 'italic', lineHeight: 1.8 }}>
            &ldquo;{quote.text}&rdquo;
          </p>
          <p className="text-xs tracking-widest" style={{ color: FAINT }}>
            — {quote.attr}
            {isAi && <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-semibold"
              style={{ background: GOLD_DIM, color: GOLD, border: `1px solid ${FAINT}` }}>AI</span>}
          </p>
        </motion.div>
      </AnimatePresence>
      <div className="flex gap-1.5 justify-center flex-wrap">
        <button onClick={shuffle} className="dao-btn-ghost px-4 py-2 rounded-xl text-xs font-semibold tracking-wider">Shuffle</button>
        <button onClick={invokeAi} disabled={loading} className="dao-btn-gold px-4 py-2 rounded-xl text-xs font-semibold tracking-wider disabled:opacity-40">
          {loading ? 'Summoning…' : 'Invoke AI Wisdom'}
        </button>
        <AudioBtn text={`${quote.text}. Spoken by ${quote.attr}.`} />
        <CopyBtn content={quote.text} attr={quote.attr} />
        <DownloadBtn cardRef={exportRef} filename="dao-codex" />
        <SaveBtn item={{ type: 'quote', label: 'Codex', content: quote.text, sub: quote.attr }} onSaved={onHistoryUpdate} />
      </div>
      <p className="text-center text-[10px]" style={{ color: FAINT }}>
        cycles every 30s · {deckPos} / {VAULT.length} this pass · AI invoke for fresh wisdom
      </p>
      <DaoExportCard ref={exportRef} typeLabel="The Codex" content={quote.text} attr={quote.attr} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// DEBATE SECTION — global DB vote tallies
// ─────────────────────────────────────────────────────────────────

function DebateSection() {
  const debate  = getTodaysDebate();
  const voteKey = `curio-dao-voted-${debate.id}`;
  const [votedSide, setVotedSide] = useState<'A' | 'B' | null>(null);
  const [votes,     setVotes]     = useState<{ votesA: number; votesB: number } | null>(null);
  const [voting,    setVoting]    = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(voteKey) as 'A' | 'B' | null;
    setVotedSide(stored);
    fetch(`/api/dao-debate?id=${debate.id}`).then(r => r.json()).then(setVotes).catch(() => {});
  }, [debate.id, voteKey]);

  const vote = useCallback(async (side: 'A' | 'B') => {
    if (votedSide || voting) return;
    setVoting(true);
    try {
      const res  = await fetch('/api/dao-debate', { method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: debate.id, side }) });
      const data = await res.json();
      setVotes(data);
      setVotedSide(side);
      localStorage.setItem(voteKey, side);
    } finally { setVoting(false); }
  }, [votedSide, voting, debate.id, voteKey]);

  const total = votes ? votes.votesA + votes.votesB : 0;
  const pctA  = total > 0 ? Math.round((votes!.votesA / total) * 100) : 50;
  const pctB  = 100 - pctA;

  return (
    <div className="rounded-2xl p-6 space-y-5" style={{ background: 'var(--curio-card)', border: `1px solid ${GOLD_BORDER}` }}>
      <div className="text-center space-y-1">
        <p className="text-xs font-semibold tracking-[0.22em] uppercase" style={{ color: MUTED }}>❧ &nbsp; Today&apos;s Clash &nbsp; ❧</p>
        <p className="text-base font-bold" style={{ color: CREAM }}>{debate.theme}</p>
        <p className="text-xs" style={{ color: MUTED }}>Two paths. One Dao. Who is right?</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {(['A', 'B'] as const).map(side => {
          const mc   = side === 'A' ? debate.mcA       : debate.mcB;
          const nov  = side === 'A' ? debate.novelA    : debate.novelB;
          const phil = side === 'A' ? debate.philosophyA : debate.philosophyB;
          const pct  = side === 'A' ? pctA : pctB;
          const myVote = votedSide === side;

          return (
            <div key={side} onClick={() => !votedSide && vote(side)}
              className="rounded-xl p-4 space-y-3 transition-all"
              style={{
                background: myVote ? 'rgba(201,162,39,0.12)' : GOLD_DIM,
                border: `1px solid ${myVote ? GOLD : GOLD_BORDER}`,
                cursor: votedSide ? 'default' : 'pointer',
                boxShadow: myVote ? '0 0 16px rgba(201,162,39,0.2)' : undefined,
                opacity: votedSide && !myVote ? 0.65 : 1,
              }}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-bold" style={{ color: GOLD }}>{mc}</p>
                  <p className="text-[10px] tracking-wider uppercase" style={{ color: FAINT }}>{nov}</p>
                </div>
                {myVote && <span className="text-xs" style={{ color: GOLD }}>✓ your vote</span>}
              </div>
              <p className="text-xs leading-relaxed" style={{ color: CREAM, fontStyle: 'italic' }}>
                &ldquo;{phil}&rdquo;
              </p>
              {votedSide && votes && (
                <div className="space-y-1.5">
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(201,162,39,0.1)' }}>
                    <motion.div className="h-full rounded-full"
                      style={{ background: myVote ? GOLD : FAINT }}
                      initial={{ width: '50%' }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, ease: 'easeOut' }} />
                  </div>
                  <p className="text-xs font-bold text-right" style={{ color: myVote ? GOLD : MUTED }}>{pct}%</p>
                </div>
              )}
              {!votedSide && (
                <button className="w-full py-1.5 rounded-lg text-xs font-semibold tracking-wider dao-btn-ghost">
                  {voting ? '…' : 'Side with this Dao'}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {votedSide && total > 0 && (
        <p className="text-center text-xs" style={{ color: FAINT }}>
          {total.toLocaleString()} cultivator{total !== 1 ? 's' : ''} have weighed in today
        </p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// DAO NAME SECTION
// ─────────────────────────────────────────────────────────────────

function DaoNameSection({ onHistoryUpdate }: { onHistoryUpdate: () => void }) {
  const [name,    setName]    = useState('');
  const [result,  setResult]  = useState<{ title: string; explanation: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const exportRef             = useRef<HTMLDivElement>(null);

  const reveal = useCallback(async () => {
    if (!name.trim() || loading) return;
    setLoading(true); setError(''); setResult(null);
    try {
      const res  = await fetch('/api/generate/grand-dao', { method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'dao-name', name: name.trim() }) });
      const data = await res.json();
      const lines = (data.result as string).split('\n').filter(Boolean);
      setResult({ title: lines[0] ?? data.result, explanation: lines.slice(1).join(' ') });
    } catch { setError('The Heavens did not respond. Try again.'); }
    finally { setLoading(false); }
  }, [name, loading]);

  return (
    <div className="rounded-2xl p-6 space-y-5" style={{ background: 'var(--curio-card)', border: `1px solid ${GOLD_BORDER}` }}>
      <div className="text-center space-y-1">
        <p className="text-xs font-semibold tracking-[0.22em] uppercase" style={{ color: MUTED }}>❧ &nbsp; Your Dao Name &nbsp; ❧</p>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--curio-text-secondary)' }}>
          Every cultivator carries a mortal name. Their Dao Name is what the cosmos hears.
        </p>
      </div>
      <div className="flex gap-2">
        <input type="text" value={name} onChange={e => { setName(e.target.value); setResult(null); }}
          onKeyDown={e => e.key === 'Enter' && reveal()} placeholder="Enter your mortal name…" maxLength={60}
          className="dao-input flex-1 rounded-xl px-4 py-2.5 text-sm outline-none"
          style={{ background: 'var(--curio-input)', color: 'var(--curio-text)', border: `1px solid ${GOLD_BORDER}` }} />
        <button onClick={reveal} disabled={!name.trim() || loading}
          className="dao-btn-gold px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap disabled:opacity-40">
          {loading ? 'Consulting…' : 'Reveal →'}
        </button>
      </div>
      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}
            className="rounded-xl p-5 space-y-3" style={{ background: GOLD_DIM, border: `1px solid ${FAINT}` }}>
            <p className="text-xs tracking-widest uppercase text-center" style={{ color: MUTED }}>Dao Name</p>
            <p className="text-2xl sm:text-3xl font-bold tracking-tight text-center"
              style={{ color: GOLD, textShadow: '0 0 24px rgba(201,162,39,0.4)' }}>{result.title}</p>
            {result.explanation && (
              <p className="text-sm leading-relaxed text-center" style={{ color: CREAM, fontStyle: 'italic' }}>
                {result.explanation}
              </p>
            )}
            <div className="flex gap-1.5 justify-center flex-wrap">
              <AudioBtn text={`${result.title}. ${result.explanation}`} />
              <CopyBtn content={`${result.title}. ${result.explanation}`} attr={`Dao Name of ${name}`} />
              <DownloadBtn cardRef={exportRef} filename="dao-name" />
              <SaveBtn item={{ type: 'dao-name', label: name, content: result.title, sub: result.explanation }} onSaved={onHistoryUpdate} />
            </div>
            <div className="text-center">
              <button onClick={() => { setResult(null); setName(''); }} className="text-xs" style={{ color: MUTED }}>↩ reveal another</button>
            </div>
          </motion.div>
        )}
        {error && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-center" style={{ color: 'rgba(239,68,68,0.7)' }}>
            {error}
          </motion.p>
        )}
      </AnimatePresence>
      <DaoExportCard
        ref={exportRef}
        typeLabel="Your Dao Name"
        headline={result?.title ?? ''}
        content={result?.explanation ?? ''}
        attr={name ? `Dao Name of ${name}` : undefined}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// DAO PATH SECTION
// ─────────────────────────────────────────────────────────────────

const EXAMPLE_TRAITS = ['loneliness', 'wrath', 'ambition', 'envy', 'grief', 'obsession', 'pride', 'fear'];

function DaoPathSection({ onHistoryUpdate }: { onHistoryUpdate: () => void }) {
  const [trait,   setTrait]   = useState('');
  const [verdict, setVerdict] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const exportRef             = useRef<HTMLDivElement>(null);

  const hear = useCallback(async () => {
    if (!trait.trim() || loading) return;
    setLoading(true); setError(''); setVerdict(null);
    try {
      const res  = await fetch('/api/generate/grand-dao', { method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'verdict', trait: trait.trim() }) });
      const data = await res.json();
      setVerdict(data.result);
    } catch { setError('The Dao is silent. Try again.'); }
    finally { setLoading(false); }
  }, [trait, loading]);

  return (
    <div className="rounded-2xl p-6 space-y-5" style={{ background: 'var(--curio-card)', border: `1px solid ${GOLD_BORDER}` }}>
      <div className="text-center space-y-1">
        <p className="text-xs font-semibold tracking-[0.22em] uppercase" style={{ color: MUTED }}>❧ &nbsp; Your Path &nbsp; ❧</p>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--curio-text-secondary)' }}>
          Name your deepest truth — a flaw, a desire, a fear. The Dao will speak.
        </p>
      </div>
      <div className="flex flex-wrap gap-1.5 justify-center">
        {EXAMPLE_TRAITS.map(t => (
          <button key={t} onClick={() => { setTrait(t); setVerdict(null); }}
            className="px-2.5 py-1 rounded-lg text-xs transition-all"
            style={{ background: trait === t ? GOLD_DIM : 'transparent', color: trait === t ? GOLD : MUTED,
              border: `1px solid ${trait === t ? GOLD_BORDER : 'transparent'}` }}>
            {t}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <input type="text" value={trait} onChange={e => { setTrait(e.target.value); setVerdict(null); }}
          onKeyDown={e => e.key === 'Enter' && hear()} placeholder="or name your own truth…" maxLength={60}
          className="dao-input flex-1 rounded-xl px-4 py-2.5 text-sm outline-none"
          style={{ background: 'var(--curio-input)', color: 'var(--curio-text)', border: `1px solid ${GOLD_BORDER}` }} />
        <button onClick={hear} disabled={!trait.trim() || loading}
          className="dao-btn-gold px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap disabled:opacity-40">
          {loading ? 'The Dao Considers…' : 'Hear the Dao'}
        </button>
      </div>
      <AnimatePresence>
        {verdict && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}
            className="rounded-xl p-5 space-y-3" style={{ background: GOLD_DIM, border: `1px solid ${FAINT}` }}>
            <p className="text-xs tracking-widest uppercase text-center" style={{ color: MUTED }}>The Dao Speaks</p>
            <p className="text-sm leading-relaxed text-center" style={{ color: CREAM, fontStyle: 'italic', lineHeight: 1.85 }}>
              &ldquo;{verdict}&rdquo;
            </p>
            <div className="flex gap-1.5 justify-center flex-wrap">
              <AudioBtn text={verdict} />
              <CopyBtn content={verdict} attr={`On the nature of ${trait}`} />
              <DownloadBtn cardRef={exportRef} filename="dao-path" />
              <SaveBtn item={{ type: 'verdict', label: trait, content: verdict }} onSaved={onHistoryUpdate} />
            </div>
            <div className="text-center">
              <button onClick={() => { setVerdict(null); setTrait(''); }} className="text-xs" style={{ color: MUTED }}>↩ hear another</button>
            </div>
          </motion.div>
        )}
        {error && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-center" style={{ color: 'rgba(239,68,68,0.7)' }}>
            {error}
          </motion.p>
        )}
      </AnimatePresence>
      <DaoExportCard
        ref={exportRef}
        typeLabel="Your Path"
        content={verdict ?? ''}
        attr={trait ? `On the nature of ${trait}` : undefined}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// HISTORY PANEL
// ─────────────────────────────────────────────────────────────────

const TYPE_LABEL: Record<SavedItem['type'], string> = { 'quote': 'Codex', 'dao-name': 'Dao Name', 'verdict': 'Path' };

function HistoryPanel() {
  const [open, setOpen]       = useState(false);
  const [history, setHistory] = useState<SavedItem[]>([]);

  useEffect(() => { if (open) setHistory(loadHistory()); }, [open]);

  const remove = (id: string) => {
    const updated = history.filter(h => h.id !== id);
    setHistory(updated);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  };

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${GOLD_BORDER}` }}>
      <button onClick={() => setOpen(o => !o)}
        className="w-full px-5 py-4 flex items-center justify-between text-sm font-semibold"
        style={{ background: GOLD_DIM, color: MUTED }}>
        <span>✦ Saved Scrolls {open && history.length > 0 ? `(${history.length})` : ''}</span>
        <span style={{ transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none' }}>▾</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
            <div className="p-4 space-y-3" style={{ background: 'var(--curio-card)' }}>
              {history.length === 0 ? (
                <p className="text-xs text-center py-4" style={{ color: FAINT }}>
                  No saved scrolls yet. Use ✦ on any result to save it.
                </p>
              ) : history.map(item => (
                <div key={item.id} className="rounded-xl p-3 space-y-1.5 group" style={{ background: GOLD_DIM, border: `1px solid ${FAINT}` }}>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded"
                      style={{ background: 'rgba(201,162,39,0.15)', color: GOLD }}>{TYPE_LABEL[item.type]}</span>
                    <span className="text-[10px] ml-auto" style={{ color: FAINT }}>{formatSavedAt(item.savedAt)}</span>
                    <button onClick={() => remove(item.id)}
                      className="text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ color: 'rgba(239,68,68,0.5)' }}>✕</button>
                  </div>
                  {item.label && item.type !== 'quote' && (
                    <p className="text-[10px] uppercase tracking-widest" style={{ color: MUTED }}>{item.label}</p>
                  )}
                  <p className="text-xs leading-relaxed" style={{ color: CREAM, fontStyle: 'italic' }}>
                    &ldquo;{item.content}&rdquo;
                  </p>
                  {item.sub && <p className="text-[10px]" style={{ color: FAINT }}>— {item.sub}</p>}
                  <div className="flex gap-1.5">
                    <AudioBtn text={item.content} small />
                    <CopyBtn content={item.content} attr={item.sub} small />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// DIVIDER
// ─────────────────────────────────────────────────────────────────

function DaoDivider() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-px" style={{ background: `linear-gradient(to right, transparent, ${GOLD_BORDER})` }} />
      <span className="text-xs tracking-widest" style={{ color: FAINT }}>⟡</span>
      <div className="flex-1 h-px" style={{ background: `linear-gradient(to left, transparent, ${GOLD_BORDER})` }} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────────────────────────

export function TheGrandDaoApp() {
  const [streakInfo,      setStreakInfo]      = useState<StreakInfo | null>(null);
  const [showBreakthrough, setShowBreakthrough] = useState(false);
  const [historyTick,     setHistoryTick]     = useState(0);
  const bumpHistory = useCallback(() => setHistoryTick(t => t + 1), []);

  useEffect(() => {
    const info = updateAndGetStreak();
    setStreakInfo(info);
    if (info.justBrokeThrough) setShowBreakthrough(true);
  }, []);

  return (
    <div className="max-w-2xl mx-auto py-4 px-1 space-y-6">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes daoGlow {
          0%, 100% { box-shadow: 0 0 8px 1px rgba(201,162,39,0.15); }
          50%       { box-shadow: 0 0 22px 6px rgba(201,162,39,0.38); }
        }
        @keyframes daoShimmer {
          0%   { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
        @keyframes daoFloat {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-5px); }
        }
        .dao-btn-gold {
          background: linear-gradient(135deg, #c9a227 0%, #e8c547 40%, #b8880f 80%, #c9a227 100%);
          background-size: 300% auto;
          animation: daoShimmer 5s linear infinite;
          color: #1a1200;
          font-weight: 700;
          transition: filter 0.2s, box-shadow 0.2s;
        }
        .dao-btn-gold:hover:not(:disabled) {
          filter: brightness(1.15);
          box-shadow: 0 0 18px rgba(201,162,39,0.5), 0 0 36px rgba(201,162,39,0.2);
        }
        .dao-btn-gold:disabled { animation: none; opacity: 0.4; }
        .dao-btn-ghost {
          background: transparent;
          color: rgba(201,162,39,0.55);
          border: 1px solid rgba(201,162,39,0.2);
          transition: background 0.2s, color 0.2s, box-shadow 0.2s;
        }
        .dao-btn-ghost:hover {
          background: rgba(201,162,39,0.16);
          color: #c9a227;
          box-shadow: 0 0 10px rgba(201,162,39,0.2);
        }
        .dao-icon-btn {
          background: transparent;
          color: rgba(201,162,39,0.5);
          border: 1px solid rgba(201,162,39,0.18);
          transition: background 0.15s, color 0.15s;
        }
        .dao-icon-btn:hover { background: rgba(201,162,39,0.12); color: #c9a227; }
        .dao-input:focus {
          border-color: rgba(201,162,39,0.55) !important;
          box-shadow: 0 0 0 3px rgba(201,162,39,0.1), 0 0 12px rgba(201,162,39,0.08);
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .dao-flame-icon { animation: daoFloat 3.5s ease-in-out infinite, daoGlow 3.5s ease-in-out infinite; }
      ` }} />

      <AnimatePresence>
        {showBreakthrough && streakInfo && (
          <BreakthroughToast realm={streakInfo.realm} onDismiss={() => setShowBreakthrough(false)} />
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="text-center space-y-3 pt-2">
        <div className="flex justify-center">
          <div className="dao-flame-icon w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
            style={{ background: 'linear-gradient(135deg, #7c5200 0%, #c9a227 100%)', border: `1px solid ${GOLD_BORDER}` }}>
            🔥
          </div>
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: GOLD }}>The Grand Dao</h1>
          <p className="text-sm mt-1 leading-relaxed" style={{ color: 'var(--curio-text-secondary)' }}>
            Cultivation wisdom from ten thousand years of seeking.
            <br />
            Your Dao Name awaits. Your path has already been written.
          </p>
        </div>
      </div>

      {streakInfo && <CultivationHeader info={streakInfo} />}

      <DaoDivider />
      <DaoCodex key={historyTick} onHistoryUpdate={bumpHistory} />
      <DaoDivider />
      <DebateSection />
      <DaoDivider />
      <DaoNameSection onHistoryUpdate={bumpHistory} />
      <DaoDivider />
      <DaoPathSection onHistoryUpdate={bumpHistory} />
      <DaoDivider />
      <HistoryPanel key={`history-${historyTick}`} />

      <p className="text-center text-xs pb-4" style={{ color: FAINT }}>
        The Dao that can be named is not the eternal Dao. &nbsp;·&nbsp; The Tribulation awaits.
      </p>
    </div>
  );
}
