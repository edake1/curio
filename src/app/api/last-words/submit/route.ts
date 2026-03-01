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
    const { text, addressedTo, sessionId } = await req.json();
    if (!text || typeof text !== 'string' || text.trim().length < 3) {
      return NextResponse.json({ error: 'Text required' }, { status: 400 });
    }
    if (!sessionId || typeof sessionId !== 'string') {
      return NextResponse.json({ error: 'Session required' }, { status: 400 });
    }

    const trimmed = text.trim().slice(0, 500);
    const addrLabel = addressedTo ? ADDRESS_LABELS[addressedTo] ?? 'the world' : 'the world';

    // If the user already submitted, replace their previous entry
    const existing = await prisma.lastWords.findFirst({
      where: { sessionId },
    });

    let entry;
    if (existing) {
      entry = await prisma.lastWords.update({
        where: { id: existing.id },
        data: { text: trimmed, addressedTo: addressedTo ?? null },
      });
    } else {
      entry = await prisma.lastWords.create({
        data: { text: trimmed, addressedTo: addressedTo ?? null, sessionId },
      });
    }

    // AI reflection — two parts; fall back gracefully if OpenAI is unavailable
    let mirror = 'Your words carry something harder to name.';
    let unsaid = 'There is always something left unspoken.';

    try {
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

      mirror = mirrorMatch?.[1]?.trim() || mirror;
      unsaid = unsaidMatch?.[1]?.trim() || unsaid;
    } catch (aiErr) {
      console.error('/api/last-words/submit AI error:', aiErr);
      // Entry is already saved — we return fallback reflections rather than failing the request
    }

    return NextResponse.json({ id: entry.id, mirror, unsaid });
  } catch (err) {
    console.error('/api/last-words/submit error:', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
