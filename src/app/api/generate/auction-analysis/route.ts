import { NextResponse } from 'next/server';
import { openai } from '@/lib/openai';

export async function POST(request: Request) {
  try {
    const { bids } = await request.json();

    if (!Array.isArray(bids) || bids.length === 0) {
      return NextResponse.json({ error: 'Invalid bids' }, { status: 400 });
    }

    // Build a readable summary of bids
    const summary = bids
      .sort((a: { tokens: number }, b: { tokens: number }) => b.tokens - a.tokens)
      .map((b: { item: string; tokens: number }) => `• ${b.item}: ${b.tokens} tokens`)
      .join('\n');

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a poetic, insightful analyst of human desire. Someone was given 100 life-tokens to bid on abstract life experiences and qualities. Their bids reveal what they value most.

Analyze their allocation in 3-4 short, punchy sentences. Be specific about what their TOP bids reveal, and what their ZERO or LOW bids say about them. End with one thought-provoking question about their choices.

Tone: warm but honest. Like a wise friend, not a therapist. No bullet points.
Keep the total response under 80 words.`,
        },
        {
          role: 'user',
          content: `Here are their bids:\n${summary}`,
        },
      ],
      temperature: 0.85,
      max_tokens: 200,
    });

    const analysis = completion.choices[0]?.message?.content?.trim() || '';

    return NextResponse.json({ analysis });
  } catch (error) {
    console.error('Auction analysis error:', error);
    // Fallback analysis
    return NextResponse.json({
      analysis: 'Your bids paint a picture of someone who knows what matters — or at least, what they think matters. The things we chase and the things we ignore say more about us than we realize.',
    });
  }
}
