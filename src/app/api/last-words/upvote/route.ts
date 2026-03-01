import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// POST /api/last-words/upvote  body: { id }
export async function POST(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'id required' }, { status: 400 });
    }

    const updated = await prisma.lastWords.update({
      where: { id },
      data: { upvotes: { increment: 1 } },
      select: { id: true, upvotes: true },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error('/api/last-words/upvote error:', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
