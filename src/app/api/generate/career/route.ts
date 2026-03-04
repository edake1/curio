import { NextResponse } from 'next/server';
import { openai } from '@/lib/openai';
import { safeParseJSON } from '@/lib/validation';
import { CAREER_TEMPLATES, CAREER_SKILLS } from '@/data/careers';

async function generateWithAI() {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a creative job title generator. Generate a FAKE but PLAUSIBLE-SOUNDING job title and description.
The job should be quirky, specific, and sound like it could exist but is probably made up.
Make it humorous but professional-sounding.

Return ONLY a JSON object with this structure:
{
  "title": "Job Title Here",
  "description": "One sentence description of what they do",
  "salary": "$XX,000 - $XX,000",
  "skills": ["skill1", "skill2", "skill3"]
}

No explanation, just the JSON.`
        },
        {
          role: 'user',
          content: 'Generate a unique fake career.'
        }
      ],
      temperature: 0.9,
      max_tokens: 200,
    });

    const text = completion.choices[0]?.message?.content || '';
    return safeParseJSON(text);
  } catch {
    return null;
  }
}

function generateFallback() {
  const template = CAREER_TEMPLATES[Math.floor(Math.random() * CAREER_TEMPLATES.length)];
  const salary = `${Math.floor(Math.random() * 50 + 30)},000 - ${Math.floor(Math.random() * 50 + 60)},000`;
  const numSkills = Math.floor(Math.random() * 2) + 2;
  const skills: string[] = [];
  for (let i = 0; i < numSkills; i++) {
    const skill = CAREER_SKILLS[Math.floor(Math.random() * CAREER_SKILLS.length)];
    if (!skills.includes(skill)) skills.push(skill);
  }

  return {
    title: template.title,
    description: `${template.prefix} ${template.suffix}. Must be able to maintain focus for extended periods.`,
    salary: `$${salary}`,
    skills,
  };
}

export async function POST() {
  // Try AI generation first, fallback to template
  const aiResult = await generateWithAI();

  if (aiResult && aiResult.title && aiResult.description) {
    return NextResponse.json(aiResult);
  }

  return NextResponse.json(generateFallback());
}
