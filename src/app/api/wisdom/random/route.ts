import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/wisdom/random?count=4&exclude=id1,id2
// Returns random sayings for the discover section
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const count = Math.min(parseInt(searchParams.get('count') ?? '4'), 20);
    const excludeRaw = searchParams.get('exclude') ?? '';
    const excludeIds = excludeRaw.split(',').filter(Boolean);

    // Get total count for random offset
    const total = await prisma.wisdomSaying.count({
      where: {
        active: true,
        ...(excludeIds.length > 0 ? { id: { notIn: excludeIds } } : {}),
      },
    });

    if (total === 0) {
      return NextResponse.json({ sayings: [] });
    }

    // Pick random offsets
    const offsets = new Set<number>();
    while (offsets.size < Math.min(count, total)) {
      offsets.add(Math.floor(Math.random() * total));
    }

    // Fetch each random saying
    const sayings = await Promise.all(
      [...offsets].map(offset =>
        prisma.wisdomSaying.findFirst({
          where: {
            active: true,
            ...(excludeIds.length > 0 ? { id: { notIn: excludeIds } } : {}),
          },
          skip: offset,
          select: {
            id: true,
            text: true,
            originalText: true,
            attribution: true,
            origin: true,
            region: true,
            category: true,
            totalReflections: true,
          },
        })
      )
    );

    return NextResponse.json({
      sayings: sayings.filter(Boolean),
    });
  } catch (err) {
    console.error('/api/wisdom/random error:', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
