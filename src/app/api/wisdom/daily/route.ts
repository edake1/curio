import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/wisdom/daily — get today's daily saying
// Also assigns a daily saying if none exists for today
export async function GET(req: NextRequest) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if we already have a daily saying for today
    let daily = await prisma.wisdomSaying.findFirst({
      where: {
        dailyDate: today,
        active: true,
      },
    });

    if (!daily) {
      // Pick a random saying that hasn't been featured yet
      const unfeatured = await prisma.wisdomSaying.findMany({
        where: { dailyDate: null, active: true },
        select: { id: true },
      });

      if (unfeatured.length === 0) {
        // All sayings have been featured — reset and pick from all
        const all = await prisma.wisdomSaying.findMany({
          where: { active: true },
          select: { id: true },
        });
        if (all.length === 0) {
          return NextResponse.json({ error: 'No sayings available' }, { status: 404 });
        }
        const pick = all[Math.floor(Math.random() * all.length)];
        daily = await prisma.wisdomSaying.update({
          where: { id: pick.id },
          data: { dailyDate: today },
        });
      } else {
        const pick = unfeatured[Math.floor(Math.random() * unfeatured.length)];
        daily = await prisma.wisdomSaying.update({
          where: { id: pick.id },
          data: { dailyDate: today },
        });
      }
    }

    return NextResponse.json({ saying: daily });
  } catch (err) {
    console.error('/api/wisdom/daily error:', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
