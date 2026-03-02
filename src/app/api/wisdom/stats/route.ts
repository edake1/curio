import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/wisdom/stats — region counts + total
export async function GET() {
  try {
    const [total, regionCounts] = await Promise.all([
      prisma.wisdomSaying.count({ where: { active: true } }),
      prisma.wisdomSaying.groupBy({
        by: ['region'],
        where: { active: true },
        _count: { id: true },
      }),
    ]);

    const regions: Record<string, number> = {};
    for (const r of regionCounts) {
      regions[r.region] = r._count.id;
    }

    return NextResponse.json({ total, regions });
  } catch (err) {
    console.error('/api/wisdom/stats error:', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
