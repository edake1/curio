import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { prisma } from '@/lib/db';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const ADDRESS_LABELS: Record<string, string> = {
  'world':          'the world',
  'someone-i-love': 'someone they love',
  'myself':         'themselves',
  'my-children':    'their children',
  'a-stranger':     'a stranger they\'ll never meet',
};

export async function POST(req: NextRequest) {
  try {
    const { text, addressedTo } = await req.json();
    if (!text || typeof text !== 'string' || text.trim().length < 3) {
      return NextResponse.json({ error: 'Text required' }, { status: 400 });
    }

    const trimmed = text.trim().slice(0, 500);
    const addrLabel = addressedTo ? ADDRESS_LABELS[addressedTo] ?? 'the world' : 'the world';

    // Save to DB first (fire and forget reflection if AI fails)
    const entry = await prisma.lastWords.create({
      data: { text: trimmed, addressedTo: addressedTo ?? null },
    });

    // AI reflection — two parts
    const prompt = `A person is practicing their last words. They are addressed to ${addrLabel}.

Their last words: "${trimmed}"

Write two distinct reflections. Be incisive, quiet, and honest — not therapeutic or soft. Respond in exactly this format:

MIRROR: [2-3 sentences. What do these words reveal about who this person is or what they value? Go beneath the surface. Surface the thing they might not have consciously realized they were saying.]

UNSAID: [1-2 sentences. What did they not say — but wanted to? The absence is sometimes louder than the words.]`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.85,
      max_tokens: 300,
    });

    const raw = completion.choices[0]?.message?.content ?? '';
    const mirrorMatch = raw.match(/MIRROR:\s*([\s\S]*?)(?=UNSAID:|$)/);
    const unsaidMatch = raw.match(/UNSAID:\s*([\s\S]*?)$/);

    const mirror = mirrorMatch?.[1]?.trim() ?? 'Your words carry something harder to name.';
    const unsaid = unsaidMatch?.[1]?.trim() ?? 'There is always something left unspoken.';

    return NextResponse.json({ id: entry.id, mirror, unsaid });
  } catch (err) {
    console.error('/api/last-words/submit error:', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
