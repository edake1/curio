import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { dilemmaVoteSchema } from '@/lib/validation';

// POST - Vote on a dilemma
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = dilemmaVoteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid input' }, { status: 400 });
    }
    const { dilemmaId, choice, sessionId } = parsed.data;

    // Check if already voted
    const existingVote = await prisma.vote.findFirst({
      where: {
        dilemmaId,
        sessionId,
      }
    });

    if (existingVote) {
      // Return current stats without allowing re-vote
      const dilemma = await prisma.dilemma.findUnique({
        where: { id: dilemmaId }
      });
      return NextResponse.json({
        alreadyVoted: true,
        choice: existingVote.choice,
        dilemma
      });
    }

    // Create vote and update counters in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the vote
      const vote = await tx.vote.create({
        data: {
          dilemmaId,
          choice,
          sessionId,
        }
      });

      // Update dilemma vote counts
      const dilemma = await tx.dilemma.update({
        where: { id: dilemmaId },
        data: {
          votesA: choice === 'A' ? { increment: 1 } : undefined,
          votesB: choice === 'B' ? { increment: 1 } : undefined,
          totalVotes: { increment: 1 },
        }
      });

      // Update global stats
      await tx.siteStats.upsert({
        where: { id: 'default' },
        update: {
          totalDilemmaVotes: { increment: 1 }
        },
        create: {
          id: 'default',
          totalDilemmaVotes: 1,
        }
      });

      return { vote, dilemma };
    });

    return NextResponse.json({
      success: true,
      dilemma: result.dilemma,
      yourChoice: choice
    });
  } catch (error) {
    console.error('Vote error:', error);
    return NextResponse.json({ error: 'Failed to record vote' }, { status: 500 });
  }
}

// GET - Get voting stats for a dilemma
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dilemmaId = searchParams.get('dilemmaId');

  if (!dilemmaId) {
    return NextResponse.json({ error: 'Missing dilemmaId' }, { status: 400 });
  }

  const dilemma = await prisma.dilemma.findUnique({
    where: { id: dilemmaId }
  });

  if (!dilemma) {
    return NextResponse.json({ error: 'Dilemma not found' }, { status: 404 });
  }

  const totalVotes = dilemma.votesA + dilemma.votesB;
  const percentA = totalVotes > 0 ? Math.round((dilemma.votesA / totalVotes) * 100) : 50;
  const percentB = totalVotes > 0 ? Math.round((dilemma.votesB / totalVotes) * 100) : 50;

  return NextResponse.json({
    dilemma,
    stats: {
      votesA: dilemma.votesA,
      votesB: dilemma.votesB,
      totalVotes,
      percentA,
      percentB,
    }
  });
}
