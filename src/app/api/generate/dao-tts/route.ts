import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request: Request) {
  try {
    const { text } = await request.json();
    if (!text?.trim()) return new Response('No text', { status: 400 });

    // Trim to 500 chars to keep latency low
    const input = (text as string).trim().slice(0, 500);

    const mp3 = await openai.audio.speech.create({
      model: 'tts-1',
      voice: 'onyx',      // Deep, resonant, authoritative
      input,
      speed: 0.88,        // Slightly slower — more solemn
    });

    const buffer = Buffer.from(await mp3.arrayBuffer());
    return new Response(buffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    console.error('[dao-tts]', err);
    return new Response('TTS failed', { status: 500 });
  }
}
