import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/dao-debate?id=xxx  → { votesA, votesB }
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const row = await prisma.daoDebate.findUnique({ where: { id } });
  return NextResponse.json({ votesA: row?.votesA ?? 0, votesB: row?.votesB ?? 0 });
}

// POST /api/dao-debate  body: { id, side: 'A' | 'B' }  → { votesA, votesB }
export async function POST(request: Request) {
  try {
    const { id, side } = await request.json();
    if (!id || (side !== 'A' && side !== 'B')) {
      return NextResponse.json({ error: 'id and side (A|B) required' }, { status: 400 });
    }

    const row = await prisma.daoDebate.upsert({
      where: { id },
      create: {
        id,
        votesA: side === 'A' ? 1 : 0,
        votesB: side === 'B' ? 1 : 0,
      },
      update:
        side === 'A'
          ? { votesA: { increment: 1 } }
          : { votesB: { increment: 1 } },
    });

    return NextResponse.json({ votesA: row.votesA, votesB: row.votesB });
  } catch (err) {
    console.error('[dao-debate]', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
