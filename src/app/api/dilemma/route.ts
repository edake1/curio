import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { openai } from '@/lib/openai';
import { SEED_DILEMMAS } from '@/data/seed';

async function generateAIDilemma() {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You generate moral dilemmas that feel REAL, specific, and modern — the kind that start arguments at dinner tables.

RULES:
- NO trolley problems, button scenarios, simulation theory, time travel, magic pills, or "save X vs Y strangers"
- Set dilemmas in REAL situations: workplaces, families, friendships, dating, social media, money, housing, health
- Both options must have genuine, defensible reasoning — no obvious right answer
- Use specific concrete details (dollar amounts, ages, time periods) to make it feel lived-in
- The question should read like someone venting to a friend, not a philosophy textbook
- Keep options to 3-10 words, punchy and clear

Categories: family, relationships, career, ethics, society, technology, money, health

Return ONLY valid JSON:
{
  "question": "A real-world scenario in 2-3 sentences with specific details",
  "optionA": "Punchy first choice",
  "optionB": "Punchy second choice",
  "argumentA": "The best 1-2 sentence case for option A",
  "argumentB": "The best 1-2 sentence case for option B",
  "category": "one of the categories above",
  "difficulty": "easy, medium, or hard"
}`
        },
        {
          role: 'user',
          content: 'Generate a dilemma that would genuinely divide a group chat. Make it uncomfortable and specific.'
        }
      ],
      temperature: 0.95,
      max_tokens: 300,
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
async function ensureDilemmas() {
  const count = await prisma.dilemma.count();
  if (count === 0) {
    await prisma.dilemma.createMany({
      data: SEED_DILEMMAS.map(d => ({
        ...d,
        isDaily: false,
      }))
    });
  }

  // Set today's daily dilemma if not set
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dailyExists = await prisma.dilemma.findFirst({
    where: {
      isDaily: true,
      dailyDate: {
        gte: today
      }
    }
  });

  if (!dailyExists) {
    // Pick a random active dilemma for today
    const randomDilemma = await prisma.dilemma.findFirst({
      where: { active: true },
      orderBy: { totalVotes: 'asc' } // Pick less voted ones
    });

    if (randomDilemma) {
      await prisma.dilemma.update({
        where: { id: randomDilemma.id },
        data: {
          isDaily: true,
          dailyDate: new Date()
        }
      });
    }
  }
}

// GET - Get today's dilemma or a random one (excluding seen)
export async function GET(request: Request) {
  try {
    await ensureDilemmas();

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'daily';
  const sessionId = searchParams.get('sessionId') || '';

  // Gather IDs this session already voted on (never repeat those)
  let votedIds: string[] = [];
  if (sessionId) {
    const votes = await prisma.vote.findMany({
      where: { sessionId },
      select: { dilemmaId: true },
    });
    votedIds = votes.map(v => v.dilemmaId);
  }

  // Also respect explicit "seen" param (client-side buffer for skipped dilemmas)
  const seenParam = searchParams.get('seen') || '';
  const seenIds = seenParam ? seenParam.split(',').filter(Boolean) : [];
  const excludeIds = [...new Set([...votedIds, ...seenIds])];

  if (type === 'daily') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const daily = await prisma.dilemma.findFirst({
      where: {
        isDaily: true,
        dailyDate: {
          gte: today
        }
      }
    });

    // Show daily even if voted (so history makes sense), but flag it
    if (daily) {
      const alreadyVoted = votedIds.includes(daily.id);
      return NextResponse.json({ ...daily, alreadyVoted });
    }
  }

  // Get random dilemma — excluding already seen/voted
  const whereClause = {
    active: true,
    ...(excludeIds.length > 0 && { id: { notIn: excludeIds } }),
  };

  const count = await prisma.dilemma.count({ where: whereClause });
  if (count === 0) {
    // All dilemmas seen — reset by returning any random one
    const totalCount = await prisma.dilemma.count({ where: { active: true } });
    if (totalCount === 0) {
      return NextResponse.json({ error: 'No dilemmas available' }, { status: 404 });
    }
    const skip = Math.floor(Math.random() * totalCount);
    const fallback = await prisma.dilemma.findFirst({ where: { active: true }, skip });
    return NextResponse.json({ ...fallback, allSeen: true });
  }

  const skip = Math.floor(Math.random() * count);
  const random = await prisma.dilemma.findFirst({ where: whereClause, skip });

  if (!random) {
    return NextResponse.json({ error: 'No dilemma found' }, { status: 404 });
  }

  // Proactively generate a fresh AI dilemma in the background when pool is running low
  if (count <= 3) {
    generateAIDilemma().then(async (ai) => {
      if (ai?.question && ai?.optionA && ai?.optionB) {
        await prisma.dilemma.create({
          data: {
            question: ai.question,
            optionA: ai.optionA,
            optionB: ai.optionB,
            argumentA: ai.argumentA || null,
            argumentB: ai.argumentB || null,
            category: ai.category || 'ethics',
            difficulty: ai.difficulty || 'medium',
            isDaily: false,
          }
        }).catch(() => { /* silent */ });
      }
    }).catch(() => { /* silent */ });
  }

  return NextResponse.json(random);
  } catch (error) {
    console.error('Dilemma GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch dilemma' }, { status: 500 });
  }
}

// POST - Generate a new AI dilemma
export async function POST() {
  const aiDilemma = await generateAIDilemma();

  if (aiDilemma && aiDilemma.question && aiDilemma.optionA && aiDilemma.optionB) {
    const created = await prisma.dilemma.create({
      data: {
        question: aiDilemma.question,
        optionA: aiDilemma.optionA,
        optionB: aiDilemma.optionB,
        argumentA: aiDilemma.argumentA || null,
        argumentB: aiDilemma.argumentB || null,
        category: aiDilemma.category || 'ethics',
        difficulty: aiDilemma.difficulty || 'medium',
        isDaily: false,
      }
    });
    return NextResponse.json(created);
  }

  // Fallback to random existing
  const count = await prisma.dilemma.count({ where: { active: true } });
  const skip = Math.floor(Math.random() * count);
  const fallback = await prisma.dilemma.findFirst({
    where: { active: true },
    skip,
  });

  return NextResponse.json(fallback);
}
