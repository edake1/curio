import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// POST /api/wisdom/reflections/upvote — upvote a reflection
export async function POST(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const updated = await prisma.wisdomReflection.update({
      where: { id },
      data: { upvotes: { increment: 1 } },
    });

    return NextResponse.json({ upvotes: updated.upvotes });
  } catch (err) {
    console.error('/api/wisdom/reflections/upvote error:', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
