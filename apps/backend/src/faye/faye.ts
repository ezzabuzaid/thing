import { openai } from '@ai-sdk/openai';
import { agent, execute, lmstudio, printer } from '@deepagents/agent';

import { bookmarksAgent } from './subagents/bookmarks.ts';
import { tasksAgent } from './subagents/tasks.ts';
import { timesheetAgent } from './subagents/timesheet.ts';
import system from './system.ts';

export const faye = agent({
  name: 'Faye',
  model:
    process.env.NODE_ENV === 'development'
      ? lmstudio('google/gemma-3-12b')
      : openai('gpt-4o'),
  prompt: system(),
  handoffDescription: `A versatile and empathetic assistant designed to provide companionship, intellectual stimulation, and emotional support. Faye can help with a wide range of scenarios. If Faye is unable to assist with a specific request, it can hand off to specialized agents such as Tasks and Bookmarks.`,
  tools: {
    ...tasksAgent.toTool(),
    ...bookmarksAgent.toTool(),
    ...timesheetAgent.toTool(),
  },
});

if (import.meta.main) {
  await printer.stdout(
    execute(
      faye,
      `I worked for project Winter 10 hours this month. this is new project for new client Brew`,
      {},
    ),
    {
      reasoning: false,
      wrapInTags: false,
    },
  );
}

// The reason we need procedural memory:
// Context windows are NOT like RAM.  I used to think this.  But then I realized the truth about transformers.  They cannot equally maintain the SAME focus on everything in the context window itself.  So, even if your context fits within the window but it is 8 prompts back, it will not give it the SAME focus that it would for the context in the newer prompts which causes drift.  Kinda like ADHD within the context window.  This was such a disappointing day when I learned this.  So EVEN if your context is STILL within the limits of the context window, you often need to rehydrate critical context in EVERY prompt.  And this is inherent in the transformer technology itself. Heart breaking, really.
