import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request: Request) {
  try {
    const { type, name, trait } = await request.json();

    let systemPrompt = '';
    let userPrompt = '';

    if (type === 'dao-name') {
      if (!name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 });
      systemPrompt =
        'You are a naming master from a xianxia cultivation universe. You bestow Dao Names — cosmic titles that capture a cultivator\'s fundamental nature. Your titles are grandiose, evocative, and 3–6 words long. You write in the register of ISSTH and Reverend Insanity.';
      userPrompt =
        `Bestow a Dao Name upon the cultivator "${name.trim()}". ` +
        `Format your response as exactly two parts separated by a line break:\n` +
        `Line 1: The Dao Name itself (3–6 words, dramatic — e.g. "Sovereign of the Undying Flame" or "Eternal Watcher of the Void Abyss").\n` +
        `Line 2: One sentence explaining the cosmic principle they embody. Be poetic and profound. No extra commentary.`;
    } else if (type === 'verdict') {
      if (!trait?.trim()) return NextResponse.json({ error: 'Trait required' }, { status: 400 });
      systemPrompt =
        'You are an ancient cultivation sage who speaks in profound, poetic utterances from a xianxia world. You see through the mortal veil to the cultivator\'s Dao heart.';
      userPrompt =
        `A cultivator\'s deepest nature is: "${trait.trim()}". ` +
        `Speak their Dao verdict — 2 to 3 sentences of ancient wisdom about their cultivation path. ` +
        `Address them directly as "you". Sound like a passage from ISSTH or Reverend Insanity. ` +
        `Be profound, slightly unsettling, and ultimately illuminating. No platitudes.`;
    } else if (type === 'quote') {
      systemPrompt =
        'You craft original cultivation philosophy quotes in the style of ISSTH, Reverend Insanity, and Lord of Mysteries. Your quotes are striking, paradoxical, and feel ancient.';
      userPrompt =
        'Generate one original, profound cultivation-novel style quote about the nature of power, mortality, the Dao, time, or identity. ' +
        '1 to 3 sentences. Avoid clichés. No attribution needed. Do not use quotation marks.';
    } else {
      return NextResponse.json({ error: 'Unknown type' }, { status: 400 });
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.92,
      max_tokens: 220,
    });

    const result = response.choices[0]?.message?.content?.trim() ?? '';
    return NextResponse.json({ result });
  } catch (err) {
    console.error('[grand-dao]', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
