import { z } from 'zod';

// Shared validation schemas for API routes

export const dilemmaVoteSchema = z.object({
  dilemmaId: z.string().min(1, 'dilemmaId is required'),
  choice: z.enum(['A', 'B'], { message: 'choice must be A or B' }),
  sessionId: z.string().min(1, 'sessionId is required'),
});

export const deleteVoteSchema = z.object({
  deleteChoiceId: z.string().min(1, 'deleteChoiceId is required'),
  choice: z.enum(['A', 'B'], { message: 'choice must be A or B' }),
  sessionId: z.string().min(1, 'sessionId is required'),
});

export const visitorSchema = z.object({
  sessionId: z.string().min(1, 'sessionId is required'),
});

// Safely parse JSON from AI completion text
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function safeParseJSON(text: string): Record<string, any> | null {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;
  try {
    return JSON.parse(jsonMatch[0]);
  } catch {
    return null;
  }
}
