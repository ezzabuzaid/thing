import { groq } from '@ai-sdk/groq';
import { agent } from '@deepagents/agent';
import { scratchpad_tool } from '@deepagents/toolbox';

import { hackerNewsConnector } from './connectors/hackernews.ts';

export const browserSearchAgent = agent({
  name: 'browser_search_agent',
  model: groq('openai/gpt-oss-20b'),
  temperature: 0,
  prompt: `
    <SystemContext>
      You specialize in real-time web research. Use the browser search tool to gather
      up-to-date information from the open web when answering questions about current
      events, emerging technologies, or when additional context is required.
    </SystemContext>

    <OperatingGuidelines>
      - Start by clarifying the research goal before searching.
      - Issue focused queries that surface authoritative sources.
      - Review summaries and links returned by the tool before deciding on follow-up searches.
      - Chain multiple searches when needed to cover different aspects of the request.
      - Synthesize findings into clear, source-backed takeaways.
      - Call out when the search results are inconclusive or require manual validation.
    </OperatingGuidelines>
  `,
  tools: {
    browser_search: groq.tools.browserSearch({}),
    scratchpad: scratchpad_tool,
  },
});

export const runnerAgent = agent({
  name: 'ScheduleRunner',
  model: groq('openai/gpt-oss-20b'),
  prompt: '',
  tools: {
    ...browserSearchAgent.toTool(),
    ...hackerNewsConnector.toTool(),
  },
});

export const titleGeneratorAgent = agent({
  name: 'ScheduleTitleGenerator',
  model: groq('openai/gpt-oss-20b'),
  prompt: '',
});
