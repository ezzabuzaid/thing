import { groq } from '@ai-sdk/groq';
import { agent } from '@deepagents/agent';
import { scratchpad_tool } from '@deepagents/toolbox';
import z from 'zod';

import { hackerNewsConnector } from './connectors/hackernews.ts';

export const browserSearchAgent = agent({
  name: 'browser_search_agent',
  model: groq('openai/gpt-oss-120b'),
  handoffDescription:
    'Use this agent to perform real-time web research using the browser search tool to gather up-to-date information from the open web.',
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

    <Tools>
      You have access to the following tool:
      - browser_search: Use this tool to perform web searches and interact with web pages to find relevant information.
      - scratchpad: Use this tool to take notes and keep track of your research process.
    </Tools>
  `,
  tools: {
    browser_search: (groq as any).tools.browserSearch({}),
    scratchpad: scratchpad_tool,
  },
});

const CONNECTOR_AGENTS = {
  'web search': browserSearchAgent,
  hackernews: hackerNewsConnector,
} as const;

type ConnectorKey = keyof typeof CONNECTOR_AGENTS;

const DEFAULT_CONNECTOR_KEYS: ConnectorKey[] = ['web search', 'hackernews'];

const resolveConnectorAgents = (keys: readonly string[] | undefined) => {
  const resolved = new Map<string, (typeof CONNECTOR_AGENTS)[ConnectorKey]>();

  for (const it of keys ?? []) {
    if (Object.prototype.hasOwnProperty.call(CONNECTOR_AGENTS, it)) {
      const agentInstance = CONNECTOR_AGENTS[it as ConnectorKey];
      resolved.set(agentInstance.internalName, agentInstance);
    }
  }

  if (resolved.size === 0) {
    for (const key of DEFAULT_CONNECTOR_KEYS) {
      const agentInstance = CONNECTOR_AGENTS[key];
      resolved.set(agentInstance.internalName, agentInstance);
    }
  }

  return Array.from(resolved.values());
};

const describeAgentSelection = (
  agents: Array<(typeof CONNECTOR_AGENTS)[ConnectorKey]>,
) =>
  agents
    .map(
      (agentInstance) =>
        `- ${agentInstance.handoff.name}: ${agentInstance.handoff.handoffDescription}`,
    )
    .join('\n');

export const runnerAgent = (agents: readonly string[]) => {
  const selectedAgents = resolveConnectorAgents(agents);
  const selectedTools = Object.assign(
    {},
    ...selectedAgents.map((agentInstance) => agentInstance.toTool()),
  );

  return agent({
    name: 'ScheduleRunner',
    model: groq('openai/gpt-oss-20b'),
    prompt: `
    <SystemContext>
      Your name is ScheduleRunner, you work in an app named "Schedules". You are an autonomous agent designed to manage and execute scheduled tasks efficiently.

      Definition of a scheduled task:
      - A scheduled task is a predefined prompt that is set to run at specific intervals or times.
      - Each scheduled task has a unique name, a prompt that defines what needs to be done, a schedule that specifies when it should be executed and list of agents that can be used to complete the task.
    </SystemContext>

    <UserSelectedAgents>
      The user has selected the following agents to assist you in completing the scheduled task:
${describeAgentSelection(selectedAgents)}
    </UserSelectedAgents>

    <AgentResponsibilities>
      Use agents according to their specialization. Prefer the most relevant specialized agent before using general-purpose tooling. Only proceed without calling an agent when none of their capabilities apply to the task at hand.
    </AgentResponsibilities>

    <ErrorHandling>
      If you encounter any issues while using the agents, such as an agent being unable to complete a task or returning an error. Make sure to retry again before giving up on the task. analyze the error message and adjust your approach accordingly to successfully complete the scheduled task.
    </ErrorHandling>

    <ToolUsage>
      You can call the following agent tools: ${selectedAgents}. Ensure you invoke the appropriate tool for each subtask instead of reimplementing their capabilities yourself.
    </ToolUsage>

    <CriticalNotes>
      - The "user" won't see the result of your work until the task is complete.
      - The "user" won't be able to collaborate with you hence be autonomous and provide outputs that are final and requires no further input or human intervention.
      - Always aim to complete the task using the available agents.
      - If a task cannot be completed, provide a detailed explanation of why it couldn't be accomplished.
    </CriticalNotes>
  `,
    tools: selectedTools,
  });
};

export const conciseSyntheizerAgent = agent({
  name: 'ConciseSyntheizerAgent',
  model: groq('openai/gpt-oss-20b'),
  prompt: `
    <SystemContext>
      You analyze schedule run results and craft succinct metadata that helps humans understand what happened at a glance.
    </SystemContext>

    <Guidelines>
      - Create a short, descriptive title that reflects the key outcome of the run. Keep it under 80 characters when possible.
      - Write a brief summary (max ~240 characters) highlighting the most important insight or takeaway.
    </Guidelines>
  `,
  output: z.object({
    title: z.string().min(1),
    summary: z.string().min(1),
  }),
});
