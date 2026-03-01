import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/last-words/gallery?filter=world&sort=top&page=0
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const filter = searchParams.get('filter');  // addressedTo value or null for all
    const sort   = searchParams.get('sort') ?? 'top'; // 'top' | 'recent'
    const page   = parseInt(searchParams.get('page') ?? '0');
    const limit  = 5;

    const where = filter && filter !== 'all' ? { addressedTo: filter } : {};
    const orderBy = sort === 'recent'
      ? { createdAt: 'desc' as const }
      : { upvotes: 'desc' as const };

    const [entries, total] = await Promise.all([
      prisma.lastWords.findMany({
        where,
        orderBy,
        skip: page * limit,
        take: limit,
        select: { id: true, text: true, addressedTo: true, upvotes: true, createdAt: true },
      }),
      prisma.lastWords.count({ where }),
    ]);

    return NextResponse.json({ entries, total, page, limit });
  } catch (err) {
    console.error('/api/last-words/gallery error:', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
