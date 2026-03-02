import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/wisdom/reflections?sayingId=xxx&page=0&sort=top
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sayingId = searchParams.get('sayingId');
    const sort     = searchParams.get('sort') ?? 'top';
    const page     = parseInt(searchParams.get('page') ?? '0');
    const limit    = 5;

    if (!sayingId) return NextResponse.json({ error: 'sayingId required' }, { status: 400 });

    const where = { sayingId };
    const orderBy = sort === 'recent'
      ? { createdAt: 'desc' as const }
      : { upvotes: 'desc' as const };

    const [reflections, total] = await Promise.all([
      prisma.wisdomReflection.findMany({
        where,
        orderBy,
        skip: page * limit,
        take: limit,
        select: { id: true, text: true, tag: true, upvotes: true, createdAt: true },
      }),
      prisma.wisdomReflection.count({ where }),
    ]);

    return NextResponse.json({ reflections, total, page, limit });
  } catch (err) {
    console.error('/api/wisdom/reflections GET error:', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

// POST /api/wisdom/reflections — submit a reflection
export async function POST(req: NextRequest) {
  try {
    const { sayingId, text, tag, sessionId } = await req.json();

    if (!sayingId || !text?.trim() || text.trim().length < 3) {
      return NextResponse.json({ error: 'Text required (min 3 chars)' }, { status: 400 });
    }
    if (!sessionId) {
      return NextResponse.json({ error: 'Session required' }, { status: 400 });
    }

    const trimmed = text.trim().slice(0, 500);

    // Upsert — one reflection per user per saying
    const existing = await prisma.wisdomReflection.findFirst({
      where: { sayingId, sessionId },
    });

    let reflection;
    if (existing) {
      reflection = await prisma.wisdomReflection.update({
        where: { id: existing.id },
        data: { text: trimmed, tag: tag || null },
      });
    } else {
      reflection = await prisma.wisdomReflection.create({
        data: { sayingId, text: trimmed, tag: tag || null, sessionId },
      });
      // Increment total reflections count
      await prisma.wisdomSaying.update({
        where: { id: sayingId },
        data: { totalReflections: { increment: 1 } },
      });
    }

    return NextResponse.json({ id: reflection.id });
  } catch (err) {
    console.error('/api/wisdom/reflections POST error:', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
