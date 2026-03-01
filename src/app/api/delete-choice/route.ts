import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { openai } from '@/lib/openai';
import { SEED_DELETE_CHOICES } from '@/data/seed';

async function generateAIDeleteChoice() {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are creating thought-provoking "Pick One to Delete" choices.
Each choice presents two things - deleting either one has major consequences.
The choices should be difficult and reveal values, not just trivial preferences.

Categories: technology, society, existence, culture, nature

Return ONLY a JSON object:
{
  "optionA": "First thing to delete (2-5 words)",
  "optionB": "Second thing to delete (2-5 words)",
  "description": "Brief context (one short sentence)",
  "category": "one of the categories"
}

Make both options meaningful to erase. No explanation, just the JSON.`
        },
        {
          role: 'user',
          content: 'Create a unique "pick one to delete" choice that would make people debate.'
        }
      ],
      temperature: 0.95,
      max_tokens: 150,
    });

    const text = completion.choices[0]?.message?.content || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try { return JSON.parse(jsonMatch[0]); } catch { return null; }
    }
    return null;
  } catch {
    return null;
  }
}

// Seed database if empty
async function ensureDeleteChoices() {
  const count = await prisma.deleteChoice.count();
  if (count === 0) {
    await prisma.deleteChoice.createMany({
      data: SEED_DELETE_CHOICES
    });
  }
}

// GET - Get a random delete choice
export async function GET() {
  try {
    await ensureDeleteChoices();

  const count = await prisma.deleteChoice.count({ where: { active: true } });
  if (count === 0) {
    return NextResponse.json({ error: 'No delete choices available' }, { status: 404 });
  }
  const skip = Math.floor(Math.random() * count);
  const random = await prisma.deleteChoice.findFirst({
    where: { active: true },
    skip,
  });

  if (!random) {
    return NextResponse.json({ error: 'No delete choice found' }, { status: 404 });
  }

  return NextResponse.json(random);
  } catch (error) {
    console.error('DeleteChoice GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch delete choice' }, { status: 500 });
  }
}

// POST - Generate a new AI delete choice
export async function POST() {
  const aiChoice = await generateAIDeleteChoice();

  if (aiChoice && aiChoice.optionA && aiChoice.optionB) {
    const created = await prisma.deleteChoice.create({
      data: {
        optionA: aiChoice.optionA,
        optionB: aiChoice.optionB,
        description: aiChoice.description || 'Which would you erase forever?',
        category: aiChoice.category || 'society',
      }
    });
    return NextResponse.json(created);
  }

  // Fallback to random existing
  await ensureDeleteChoices();
  const count = await prisma.deleteChoice.count({ where: { active: true } });
  const skip = Math.floor(Math.random() * count);
  const fallback = await prisma.deleteChoice.findFirst({
    where: { active: true },
    skip,
  });

  return NextResponse.json(fallback);
}
