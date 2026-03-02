import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { prisma } from '@/lib/db';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// GET /api/wisdom/context?id=xxx — get or generate AI context for a saying
export async function GET(req: NextRequest) {
  try {
    const id = new URL(req.url).searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const saying = await prisma.wisdomSaying.findUnique({ where: { id } });
    if (!saying) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // If context already exists, return it
    if (saying.contextOrigin && saying.contextMeaning && saying.contextPractice) {
      return NextResponse.json({
        origin: saying.contextOrigin,
        meaning: saying.contextMeaning,
        practice: saying.contextPractice,
      });
    }

    // Generate context via AI
    const prompt = `You are a cultural scholar. A user is reading this saying:

"${saying.text}"
— ${saying.attribution} (from ${saying.origin})

Write three sections. Be rich, respectful of the culture, warm but not preachy. Write as if explaining to a curious, intelligent adult.

ORIGIN: [2-3 sentences. Where does this saying come from? What tradition, era, or cultural context produced it? What makes this culture's wisdom unique?]

MEANING: [2-3 sentences. What does this saying really mean beneath the surface? What insight about human nature or life does it capture? Go deeper than the obvious.]

PRACTICE: [2-3 sentences. How can someone apply this wisdom today? Give a concrete, relatable example. Make it feel personal and actionable, not generic.]`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
      max_tokens: 500,
    });

    const raw = completion.choices[0]?.message?.content ?? '';
    const originMatch  = raw.match(/ORIGIN:\s*([\s\S]*?)(?=MEANING:|$)/);
    const meaningMatch = raw.match(/MEANING:\s*([\s\S]*?)(?=PRACTICE:|$)/);
    const practiceMatch = raw.match(/PRACTICE:\s*([\s\S]*?)$/);

    const contextOrigin  = originMatch?.[1]?.trim() || 'This saying carries centuries of cultural weight.';
    const contextMeaning = meaningMatch?.[1]?.trim() || 'Its meaning runs deeper than the words suggest.';
    const contextPractice = practiceMatch?.[1]?.trim() || 'Sit with these words. Let them find you where you are.';

    // Persist so we don't regenerate
    await prisma.wisdomSaying.update({
      where: { id },
      data: { contextOrigin, contextMeaning, contextPractice },
    });

    return NextResponse.json({
      origin: contextOrigin,
      meaning: contextMeaning,
      practice: contextPractice,
    });
  } catch (err) {
    console.error('/api/wisdom/context error:', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
