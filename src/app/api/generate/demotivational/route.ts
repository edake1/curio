import { NextResponse } from 'next/server';
import { openai } from '@/lib/openai';
import { safeParseJSON } from '@/lib/validation';
import { DEMOTIVATIONAL_QUOTES } from '@/data/demotivational';

const CATEGORY_PROMPTS: Record<string, string> = {
  ambition:     'about chasing dreams, hustle culture, vision boards, or "you can do anything"',
  existence:    'about consciousness, mortality, the heat death of the universe, or the absurdity of being alive',
  career:       'about promotions, performance reviews, LinkedIn, inbox zero, "being passionate about your role", or office culture',
  love:         'about romantic expectations, dating, vulnerability, attachment styles, or "finding the one"',
  time:         'about aging, wasted years, deadlines, productivity systems, or the relentless march of time',
  money:        'about wealth, passive income, financial freedom, crypto, or "doing what you love and the money will follow"',
  fitness:      'about gym goals, 30-day challenges, New Year\'s resolutions, diets, step counts, or "this time it\'ll stick"',
  selfhelp:     'about therapy, journaling, habit stacking, morning routines, the latest self-improvement book, or "becoming the best version of yourself"',
  socialmedia:  'about followers, engagement, going viral, crafting the perfect post, personal branding, or posting into the void',
  creativity:   'about the novel you\'ll write, the side project you\'ll finish, creative blocks, "finding your voice", or the art gathering dust',
  dating:       'about dating apps, swiping, matching, ghosting, situationships, "putting yourself out there", or the algorithm of loneliness',
  productivity: 'about to-do lists that grow, Pomodoro timers, "deep work", inbox management, browser tabs, or the gap between planning and doing',
};

const INTENSITY_MODIFIERS: Record<string, { temp: number; instruction: string }> = {
  dry:        { temp: 0.7,  instruction: 'Tone: dry, understated, ironic. The despair is IMPLIED — never stated outright. Favor understatement.' },
  bleak:      { temp: 0.9,  instruction: 'Tone: honest and bleak, with dark wit. State an uncomfortable truth as if it were obvious.' },
  brutal:     { temp: 1.1,  instruction: 'Tone: brutally specific, no sugarcoating. Concrete details over vague generalizations. Make it sting.' },
  nihilistic: { temp: 1.3,  instruction: 'Tone: full existential nihilism with dark comedy. Absurdist logic. Cosmic scale. The punchline is that nothing matters.' },
};

// Structural angles — chosen randomly to break repetition
const ANGLES = [
  'Write it as a fake motivational poster that reveals an ugly truth.',
  'Write it as advice from someone who\'s given up but is at peace with it.',
  'Write it as a reframe of common wisdom that turns the meaning inside out.',
  'Write it as a statistic or observation stated with clinical detachment.',
  'Write it as fake encouragement that becomes more honest with each clause.',
  'Write it as a comparison between what people expect vs. what actually happens.',
  'Write it as a motivational quote that collapses under its own logic.',
  'Write it as something a disappointed mentor might say while maintaining a smile.',
  'Write it as a productivity tip that reveals the pointlessness of productivity.',
  'Write it as a philosophical observation with a brutally mundane conclusion.',
  'Write it as a success story that went sideways, told approvingly.',
  'Write it framed as "good news" that is actually devastating.',
];

async function generateWithAI(category: string, intensity: string, recentQuotes: string[]) {
  const categoryHint = CATEGORY_PROMPTS[category] || 'about life in general';
  const { temp, instruction } = INTENSITY_MODIFIERS[intensity] || INTENSITY_MODIFIERS.brutal;
  const angle = ANGLES[Math.floor(Math.random() * ANGLES.length)];

  const avoidBlock = recentQuotes.length > 0
    ? `\nIMPORTANT: These quotes were just shown — do NOT repeat their central idea, metaphor, or message:\n${recentQuotes.map((q, i) => `${i + 1}. "${q}"`).join('\n')}\n`
    : '';

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You write anti-motivational one-liners. You twist motivational clichés until they break.

${instruction}

Structural approach: ${angle}

Rules:
- The quote is ONE sentence only, strictly under 18 words. Punch, don't sprawl.
- NEVER use metaphors about light, darkness, sparks, flames, or shadows.
- The quote could have been said sincerely — until you re-read it.
- Be specific and concrete. No vague abstractions.
- The subtext (max 7 words) is the gut-punch that lands after the quote.
${avoidBlock}
Return ONLY valid JSON, nothing else:
{"quote": "One punchy sentence, max 18 words", "subtext": "The twist, max 7 words"}`
        },
        {
          role: 'user',
          content: `Generate a quote ${categoryHint}.`
        }
      ],
      temperature: Math.min(temp, 2),
      max_tokens: 90,
    });

    const text = completion.choices[0]?.message?.content || '';
    return safeParseJSON(text);
  } catch {
    return null;
  }
}

function generateFallback() {
  return DEMOTIVATIONAL_QUOTES[Math.floor(Math.random() * DEMOTIVATIONAL_QUOTES.length)];
}

export async function POST(req: Request) {
  let category = 'ambition';
  let intensity = 'brutal';
  let recentQuotes: string[] = [];
  try {
    const body = await req.json();
    if (body?.category) category = body.category;
    if (body?.intensity) intensity = body.intensity;
    if (Array.isArray(body?.recentQuotes)) recentQuotes = body.recentQuotes.slice(0, 3);
  } catch { /* no body */ }

  const aiResult = await generateWithAI(category, intensity, recentQuotes);

  if (aiResult && aiResult.quote) {
    return NextResponse.json(aiResult);
  }

  return NextResponse.json(generateFallback());
}

