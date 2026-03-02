import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/wisdom/browse?region=africa&category=resilience&page=0&search=bamboo
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const region   = searchParams.get('region');
    const category = searchParams.get('category');
    const search   = searchParams.get('search');
    const page     = parseInt(searchParams.get('page') ?? '0');
    const limit    = 12;

    // Build where clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { active: true };
    if (region && region !== 'all') where.region = region;
    if (category && category !== 'all') where.category = category;
    if (search?.trim()) {
      where.OR = [
        { text: { contains: search.trim(), mode: 'insensitive' } },
        { attribution: { contains: search.trim(), mode: 'insensitive' } },
        { origin: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }

    const [sayings, total] = await Promise.all([
      prisma.wisdomSaying.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: page * limit,
        take: limit,
        select: {
          id: true,
          text: true,
          originalText: true,
          attribution: true,
          origin: true,
          region: true,
          category: true,
          totalReflections: true,
          dailyDate: true,
        },
      }),
      prisma.wisdomSaying.count({ where }),
    ]);

    return NextResponse.json({ sayings, total, page, limit });
  } catch (err) {
    console.error('/api/wisdom/browse error:', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
