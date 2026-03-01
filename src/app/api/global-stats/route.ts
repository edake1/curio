import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { GLOBAL_RATES, computeGlobalStats } from '@/data/global-rates';
import { visitorSchema } from '@/lib/validation';

// GET - Get global statistics
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const elapsedSeconds = parseFloat(searchParams.get('seconds') || '0');

  const stats = {
    elapsed: elapsedSeconds,
    ...computeGlobalStats(elapsedSeconds),
  };

  // Get site-wide stats from database
  const siteStats = await prisma.siteStats.findUnique({
    where: { id: 'default' }
  });

  return NextResponse.json({
    global: stats,
    site: {
      totalDilemmaVotes: siteStats?.totalDilemmaVotes || 0,
      totalDeleteVotes: siteStats?.totalDeleteVotes || 0,
      totalVisitors: siteStats?.totalVisitors || 0,
    },
    rates: GLOBAL_RATES,
  });
}

// POST - Track a visitor
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = visitorSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid input' }, { status: 400 });
    }
    const { sessionId } = parsed.data;

    // Update or create visitor session
    const visitor = await prisma.visitorSession.upsert({
      where: { sessionId },
      update: {
        lastVisit: new Date(),
        visitCount: { increment: 1 }
      },
      create: {
        sessionId,
      }
    });

    // Update global visitor count if new visitor
    if (visitor.visitCount === 1) {
      await prisma.siteStats.upsert({
        where: { id: 'default' },
        update: {
          totalVisitors: { increment: 1 }
        },
        create: {
          id: 'default',
          totalVisitors: 1,
        }
      });
    }

    return NextResponse.json({ success: true, visitor });
  } catch (error) {
    console.error('Visitor tracking error:', error);
    return NextResponse.json({ error: 'Failed to track visitor' }, { status: 500 });
  }
}
