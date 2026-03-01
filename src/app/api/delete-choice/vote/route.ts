import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { deleteVoteSchema } from '@/lib/validation';

// POST - Vote on a delete choice
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = deleteVoteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid input' }, { status: 400 });
    }
    const { deleteChoiceId, choice, sessionId } = parsed.data;

    // Check if already voted
    const existingVote = await prisma.deleteVote.findFirst({
      where: {
        deleteChoiceId,
        sessionId,
      }
    });

    if (existingVote) {
      const deleteChoice = await prisma.deleteChoice.findUnique({
        where: { id: deleteChoiceId }
      });
      return NextResponse.json({
        alreadyVoted: true,
        choice: existingVote.choice,
        deleteChoice
      });
    }

    // Create vote and update counters
    const result = await prisma.$transaction(async (tx) => {
      const vote = await tx.deleteVote.create({
        data: {
          deleteChoiceId,
          choice,
          sessionId,
        }
      });

      const deleteChoice = await tx.deleteChoice.update({
        where: { id: deleteChoiceId },
        data: {
          votesA: choice === 'A' ? { increment: 1 } : undefined,
          votesB: choice === 'B' ? { increment: 1 } : undefined,
          totalVotes: { increment: 1 },
        }
      });

      await tx.siteStats.upsert({
        where: { id: 'default' },
        update: {
          totalDeleteVotes: { increment: 1 }
        },
        create: {
          id: 'default',
          totalDeleteVotes: 1,
        }
      });

      return { vote, deleteChoice };
    });

    return NextResponse.json({
      success: true,
      deleteChoice: result.deleteChoice,
      yourChoice: choice
    });
  } catch (error) {
    console.error('Delete vote error:', error);
    return NextResponse.json({ error: 'Failed to record vote' }, { status: 500 });
  }
}

// GET - Get voting stats for a delete choice
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const deleteChoiceId = searchParams.get('deleteChoiceId');

  if (!deleteChoiceId) {
    return NextResponse.json({ error: 'Missing deleteChoiceId' }, { status: 400 });
  }

  const deleteChoice = await prisma.deleteChoice.findUnique({
    where: { id: deleteChoiceId }
  });

  if (!deleteChoice) {
    return NextResponse.json({ error: 'Delete choice not found' }, { status: 404 });
  }

  const totalVotes = deleteChoice.votesA + deleteChoice.votesB;
  const percentA = totalVotes > 0 ? Math.round((deleteChoice.votesA / totalVotes) * 100) : 50;
  const percentB = totalVotes > 0 ? Math.round((deleteChoice.votesB / totalVotes) * 100) : 50;

  return NextResponse.json({
    deleteChoice,
    stats: {
      votesA: deleteChoice.votesA,
      votesB: deleteChoice.votesB,
      totalVotes,
      percentA,
      percentB,
    }
  });
}
