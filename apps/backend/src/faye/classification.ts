import { groq } from '@ai-sdk/groq';
import { Output, generateText, tool } from 'ai';
import { z } from 'zod';

export async function classify<L extends readonly [string, ...string[]]>(
  labels: L,
  input: string,
): Promise<{
  label: L[number];
  confidence: number;
  reason?: string;
}> {
  const { experimental_output } = await generateText({
    model: groq('openai/gpt-oss-20b'),
    experimental_output: Output.object({
      schema: z.object({
        label: z.enum(labels),
        confidence: z.number().min(0).max(1),
        reason: z.string().max(240).optional(),
      }),
    }),
    prompt: [
      `You are a strict classifier. Choose ONE label from ${labels.join(', ')}.`,
      `Definitions:`,
      `- Thought: freeform idea/feeling/note (not actionable).`,
      `- Task: actionable item user can do; may imply owner/time.`,
      `- Event: time-bound thing (covers meetings) possibly with attendees.`,
      `- Link: bookmark/URL or “save this article/tool/site”.`,
      `- Log: journal/observation/summary; not asking to do anything.`,
      `Return JSON only. No extra text.`,
      `Text: """${input}"""`,
      `If unclear, pick the closest label and lower confidence.`,
    ].join('\n'),
  });

  return experimental_output as {
    label: L[number];
    confidence: number;
    reason?: string;
  };
}

export const classificationTool = tool({
  description:
    'Classify the input text into one of the predefined categories: Thought, Task, Bookmark, Event, Meeting, Reminder, Timesheet.',
  inputSchema: z.object({
    text: z.string(),
  }),
  async execute(input) {
    return classify(
      [
        'thought',
        'task',
        'event',
        'bookmark',
        'log',
        'meeting',
        'reminder',
        'timesheet',
      ] as const,
      input.text,
    );
  },
});
