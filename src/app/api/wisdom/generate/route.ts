import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { prisma } from '@/lib/db';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// POST /api/wisdom/generate — AI-generate new sayings for a region/category
// This expands the database beyond the seed data.
export async function POST(req: NextRequest) {
  try {
    const { region, category, count = 10 } = await req.json();

    const regionLabel = region && region !== 'all' ? region : 'diverse global regions';
    const categoryLabel = category && category !== 'all' ? category : 'various themes of life';

    const prompt = `You are a scholar of global wisdom traditions. Generate ${Math.min(count, 20)} REAL proverbs, sayings, or wisdom quotes from ${regionLabel} about ${categoryLabel}.

IMPORTANT: Only include REAL, historically documented sayings or quotes from known thinkers. Do NOT invent new sayings. Each should be properly attributed.

Return as a JSON array with this structure:
[
  {
    "text": "The saying in English",
    "originalText": "Original language text if applicable (native script), or null",
    "attribution": "Source — e.g. 'Japanese Proverb', 'Rumi', 'Yoruba Proverb'",
    "origin": "Specific country or culture",
    "region": "${region && region !== 'all' ? region : 'the appropriate region id: africa, east-asia, south-asia, southeast-asia, middle-east, europe, americas, oceania'}",
    "category": "${category && category !== 'all' ? category : 'the most fitting category: resilience, patience, love, death, wisdom, justice, community, humility, nature, truth, action, knowledge, gratitude, unity, courage, time, change, character'}"
  }
]

Return ONLY the JSON array, no other text.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.9,
      max_tokens: 3000,
    });

    const raw = completion.choices[0]?.message?.content ?? '[]';

    // Parse JSON from response (handle markdown code blocks)
    let sayings;
    try {
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      sayings = JSON.parse(cleaned);
    } catch {
      console.error('Failed to parse AI sayings response');
      return NextResponse.json({ error: 'AI response parsing failed' }, { status: 500 });
    }

    if (!Array.isArray(sayings) || sayings.length === 0) {
      return NextResponse.json({ error: 'No sayings generated' }, { status: 500 });
    }

    // Deduplicate against existing sayings (by text)
    const existingTexts = new Set(
      (await prisma.wisdomSaying.findMany({ select: { text: true } }))
        .map(s => s.text.toLowerCase().trim())
    );

    const newSayings = sayings.filter(
      (s: { text?: string }) => s.text && !existingTexts.has(s.text.toLowerCase().trim())
    );

    if (newSayings.length === 0) {
      return NextResponse.json({ added: 0, message: 'All generated sayings already exist' });
    }

    // Insert new sayings
    const created = await prisma.wisdomSaying.createMany({
      data: newSayings.map((s: { text: string; originalText?: string; attribution: string; origin: string; region: string; category: string }) => ({
        text: s.text.trim(),
        originalText: s.originalText || null,
        attribution: s.attribution || 'Unknown',
        origin: s.origin || 'Unknown',
        region: s.region || 'europe',
        category: s.category || 'wisdom',
        aiGenerated: true,
      })),
    });

    return NextResponse.json({ added: created.count, total: newSayings.length });
  } catch (err) {
    console.error('/api/wisdom/generate error:', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
