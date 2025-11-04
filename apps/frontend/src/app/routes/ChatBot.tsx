import { useChat } from '@ai-sdk/react';
import { Button, cn } from '@thing/shadcn';
import { client } from '@thing/ui';
import {
  type ChatStatus,
  DefaultChatTransport,
  type ToolUIPart,
  type UIDataTypes,
  type UIMessage,
  type UIMessagePart,
  type UITools,
  getToolName,
  isToolUIPart,
} from 'ai';
import {
  CircleIcon,
  ClockIcon,
  Loader,
  MessageSquare,
  XCircleIcon,
  ZapIcon,
} from 'lucide-react';
import { Fragment, useState } from 'react';
import { useNavigate } from 'react-router';
import { pascalcase, titlecase } from 'stringcase';

import { Title } from '../components/Title.tsx';
import {
  ChainOfThought,
  ChainOfThoughtContent,
  ChainOfThoughtHeader,
  ChainOfThoughtStep,
} from '../elements/ChainOfThought.tsx';
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from '../elements/Conversation.tsx';
import { Message, MessageContent } from '../elements/Message.tsx';
import {
  PromptInput,
  PromptInputBody,
  PromptInputModelSelect,
  PromptInputModelSelectContent,
  PromptInputModelSelectItem,
  PromptInputModelSelectTrigger,
  PromptInputModelSelectValue,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
} from '../elements/PromptInput.tsx';
import { Response } from '../elements/Response.tsx';
import { DynamicToolDebug, ToolDebug } from '../elements/ToolDebug.tsx';

const categories = [
  { id: 'thought', name: 'Thought' },
  { id: 'task', name: 'Task' },
  { id: 'bookmark', name: 'Bookmark' },
  { id: 'event', name: 'Event' },
  { id: 'meeting', name: 'Meeting' },
  { id: 'reminder', name: 'Reminder' },
];

export default function ChatBot() {
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [model, setModel] = useState<string>(categories[0].id);
  const navigate = useNavigate();
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: `${client.options.baseUrl}/chat`,
      credentials: 'include',
    }),

    onFinish({ messages }) {
      console.log('Chat finished', messages);
    },
    onData(chunk) {
      console.log('New chunk', chunk);
    },
  });

  const handleMicClick = () => {
    setIsRecording(!isRecording);
    // Add voice recording logic here
    console.log('Microphone clicked');
  };

  return (
    <div className="relative flex h-full flex-col justify-between">
      <div className="mx-auto w-full max-w-3xl px-4">
        <Title>Faye</Title>
      </div>

      <main className="flex h-[calc(100%-(10rem+4rem))] flex-col items-center justify-center">
        <Conversation className="w-full max-w-3xl">
          <ConversationContent className="h-full">
            {messages.length === 0 ? (
              <ConversationEmptyState
                icon={<MessageSquare className="size-12" />}
                title="Start a conversation"
                description="Say it, write it or paste it..."
              />
            ) : (
              messages.map((message) => (
                <MessageContainer
                  message={message}
                  status={status}
                  key={message.id}
                />
              ))
            )}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>
      </main>

      <footer className="bg-background right-0 bottom-0 left-0 z-10">
        <div className="mx-auto max-w-3xl p-4">
          <div className="relative">
            <PromptInput
              className="relative mt-4"
              onSubmit={(_, e) => {
                e.preventDefault();
                if (input.trim()) {
                  sendMessage({ text: input });
                  setInput('');
                }
              }}
            >
              <PromptInputBody className="relative">
                <PromptInputTextarea
                  onChange={(e) => setInput(e.target.value)}
                  value={input}
                  className="pr-16"
                  placeholder="Say it, write it or paste it..."
                />

                <PromptInputSubmit
                  className="absolute top-1/2 right-4 translate-y-[-50%]"
                  disabled={!input.trim()}
                  status={status === 'streaming' ? 'streaming' : 'ready'}
                />
              </PromptInputBody>
              <PromptInputToolbar>
                <PromptInputTools>
                  <PromptInputModelSelect
                    onValueChange={setModel}
                    value={model}
                  >
                    <PromptInputModelSelectTrigger>
                      <PromptInputModelSelectValue />
                    </PromptInputModelSelectTrigger>
                    <PromptInputModelSelectContent>
                      {categories.map((model) => (
                        <PromptInputModelSelectItem
                          key={model.id}
                          value={model.id}
                        >
                          {model.name}
                        </PromptInputModelSelectItem>
                      ))}
                    </PromptInputModelSelectContent>
                  </PromptInputModelSelect>
                </PromptInputTools>
              </PromptInputToolbar>
            </PromptInput>
          </div>
        </div>
      </footer>
    </div>
  );
}

function AgentTransfer({ part }: { part: ToolUIPart }) {
  const output = part.output
    ? Array.isArray(part.output)
      ? part.output
      : [part.output]
    : [];
  return (
    <>
      <p className="my-2 font-semibold">
        {pascalcase(part.type.replace('tool-transfer_to_', ''))}(
        <span className="text-destructive whitespace-nowrap">
          {JSON.stringify(part.input)}
        </span>
        )
      </p>
      {(output as UIMessagePart<any, any>[]).map((part, partIndex) => {
        if (
          part.type === 'dynamic-tool' &&
          part.toolName.startsWith('transfer_to')
        ) {
          const [, agentName] = part.toolName.split('transfer_to_');
          return (
            <ChainOfThoughtStep
              key={part.toolCallId}
              icon={<ZapIcon className="size-4" />}
              label={`Transferring to ${titlecase(agentName)}`}
              status={part.state === 'output-available' ? 'complete' : 'active'}
            >
              {(part as any).text}
            </ChainOfThoughtStep>
          );
        }
        if (!isToolUIPart(part)) {
          return null;
        }
        const name =
          part.type === 'tool-result'
            ? (part as any).toolName
            : getToolName(part);
        return (
          <ChainOfThoughtStep
            key={part.toolCallId}
            icon={
              {
                'input-streaming': <CircleIcon className="size-4" />,
                'input-available': (
                  <ClockIcon className="size-4 animate-pulse" />
                ),
                'output-available': (
                  <ZapIcon className="size-4 text-green-600" />
                ),
                'output-error': <XCircleIcon className="size-4 text-red-600" />,
              }[part.state]
            }
            label={
              <span>
                <span className="text-primary/80">{name}</span>(
                <span className="text-red-300">
                  {JSON.stringify(part.input)}
                </span>
                )
              </span>
            }
            status={
              part.state === 'output-available' && !part.preliminary
                ? 'complete'
                : 'active'
            }
          >
            {(part as any).text}
            {(part as any).output?.text}
            {part.state === 'output-error' && (
              <div className="text-destructive">{part.errorText}</div>
            )}
          </ChainOfThoughtStep>
        );
      })}
    </>
  );
}

function toThoughtProcess(parts: UIMessagePart<UIDataTypes, UITools>[]) {
  return parts.filter((p) => p.type !== 'step-start' && p.type !== 'text');
}

function ToolUiPart({
  part,
  onOpenTool,
}: {
  part: ToolUIPart;
  onOpenTool: () => void;
}) {
  const input = part.input as any;

  if (!input) {
    return <Loader className="size-4 animate-spin" />;
  }

  return (
    <div className="mt-3">
      <Button onClick={onOpenTool}>Open {part.toolCallId} Tool</Button>
    </div>
  );
}

function ToolsDebug({ part }: { part: UIMessagePart<any, any> }) {
  if (isToolUIPart(part)) {
    if (part.type.startsWith('tool-render')) {
      return (
        <Fragment>
          <ToolDebug part={part} />
          <ToolUiPart
            part={part}
            onOpenTool={() => {
              //
            }}
          />
        </Fragment>
      );
    }
    return <ToolDebug part={part} />;
  }
  if (part.type === 'dynamic-tool') {
    return <DynamicToolDebug part={part} />;
  }
  return null;
}

function toChain(convo: UIMessage[]) {
  const chains: UIMessage[] = convo
    .slice(0)
    .map(({ parts, ...it }) => ({ ...it, parts: [] }));
  for (let i = 0; i < convo.length; i++) {
    const chain = chains[i];
    const message = convo[i];
    const parts = message.parts.filter((p) => p.type !== 'step-start');
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const lastAddedPart = chain.parts[chain.parts.length - 1];
      const isLastPart = i === parts.length - 1;
      if (isLastPart && !isToolPart(part)) {
        // chain.parts.push(thought);
        // thought.output.push(part);
        chain.parts.push(part);
        continue;
      }
      if (
        isToolPart(lastAddedPart) ||
        (isToolPart(part) && !part.type.startsWith('tool-transfer_to_'))
      ) {
        let lastThought = chain.parts.at(-1);
        if (
          lastThought?.type !== 'dynamic-tool' ||
          lastThought.toolName !== 'chain_of_thoughts' ||
          !Array.isArray(lastThought.output)
        ) {
          lastThought = chainOfThoughtTool();
          chain.parts.push(lastThought);
        }
        (lastThought.output as UIMessagePart<any, any>[]).push(part);
        continue;
      }

      chain.parts.push(part);
    }
  }

  // Attach adjacent text to tool-* parts by searching inside chain_of_thoughts outputs
  for (let i = 0; i < chains.length; i++) {
    const message = chains[i] as any;
    for (let j = 0; j < message.parts.length; j++) {
      const container = message.parts[j];
      if (
        !container ||
        container.type !== 'dynamic-tool' ||
        container.toolName !== 'chain_of_thoughts' ||
        !Array.isArray(container.output)
      ) {
        continue;
      }
      const out = container.output as UIMessagePart<any, any>[];
      for (let k = 0; k < out.length; k++) {
        const p = out[k];
        if (!p || !(p.type.startsWith('tool-') || p.type === 'dynamic-tool'))
          continue;
        const next = out[k + 1];
        if (next && next.type === 'text' && typeof next.text === 'string') {
          Object.assign(p, { text: next.text });
          // remove the text part that we've attached
          out.splice(k + 1, 1);
          // keep k at current position to continue scanning after this tool
        }
      }
    }
  }

  return chains;
}

function chainOfThoughtTool() {
  return {
    type: 'dynamic-tool',
    toolName: 'chain_of_thoughts',
    toolCallId: 'functions.chain_of_thoughts',
    state: 'output-available',
    input: {},
    output: [] as any[],
  } as const;
}

function isToolPart(part: any, treatTransferAsTool = true) {
  return (
    part &&
    (part.type.startsWith('tool-') ||
      (treatTransferAsTool ? part.type === 'dynamic-tool' : false))
  );
}

// if (
//   (part.type === 'dynamic-tool' &&
//     part.toolName === 'chain_of_thoughts') ||
//   (isToolUIPart(part) && Array.isArray(part.output))
// ) {
//   return (
//     <ChainOfThought
//       className="mt-4"
//       defaultOpen={status === 'streaming'}
//       key={`${message.id}-${partIndex}`}
//     >
//       <ChainOfThoughtHeader>
//         {part.state === 'output-available'
//           ? 'Thought process'
//           : 'Thinking...'}
//       </ChainOfThoughtHeader>
//       <ChainOfThoughtContent className="mb-4">
//         {(
//           part.output as UIMessagePart<any, any>[]
//         ).map((part, partIndex) => {
//           if (
//             part.type === 'dynamic-tool' &&
//             part.toolName.startsWith('transfer_to')
//           ) {
//             const [, agentName] =
//               part.toolName.split('transfer_to_');
//             return (
//               <ChainOfThoughtStep
//                 key={`${message.id}-${partIndex}`}
//                 icon={<ZapIcon className="size-4" />}
//                 label={`Transferring to ${titlecase(agentName)}`}
//                 status={
//                   part.state === 'output-available'
//                     ? 'complete'
//                     : 'active'
//                 }
//               >
//                 {(part as any).text}
//               </ChainOfThoughtStep>
//             );
//           }
//           if (!isToolUIPart(part)) {
//             return null;
//           }
//           const name =
//             part.type === 'tool-result'
//               ? (part as any).toolName
//               : getToolName(part);
//           return (
//             <ChainOfThoughtStep
//               key={`${message.id}-${partIndex}`}
//               icon={
//                 {
//                   'input-streaming': (
//                     <CircleIcon className="size-4" />
//                   ),
//                   'input-available': (
//                     <ClockIcon className="size-4 animate-pulse" />
//                   ),
//                   'output-available': (
//                     <ZapIcon className="size-4 text-green-600" />
//                   ),
//                   'output-error': (
//                     <XCircleIcon className="size-4 text-red-600" />
//                   ),
//                 }[part.state]
//               }
//               label={`Invoking "${name}(${JSON.stringify(part.input)})" tool`}
//               status={
//                 part.state === 'output-available' &&
//                 !part.preliminary
//                   ? 'complete'
//                   : 'active'
//               }
//             >
//               {(part as any).text}
//               {(part as any).output?.text}
//               {part.state === 'output-error' && (
//                 <div className="text-destructive">
//                   {part.errorText}
//                 </div>
//               )}
//             </ChainOfThoughtStep>
//           );
//         })}
//       </ChainOfThoughtContent>
//     </ChainOfThought>
//   );
// }
// return null;
// return (
//   <ToolsDebug
//     key={`${message.id}-${partIndex}`}
//     part={part}
//   />
// );

function MessageContainer({
  message,
  status,
}: {
  message: UIMessage;
  status: ChatStatus;
}) {
  const process = toThoughtProcess(message.parts);
  return (
    <Message from={message.role} key={message.id}>
      <MessageContent
        className={cn(message.role !== 'user' ? 'rounded-none' : 'group-[.is-user]:bg-transparent shadow')}
        variant="flat"
      >
        {message.role === 'assistant' && process.length > 0 && (
          <ChainOfThought className="mt-4" defaultOpen={status === 'streaming'}>
            <ChainOfThoughtHeader>
              {status === 'ready' ? 'Thought process' : 'Thinking...'}
            </ChainOfThoughtHeader>
            <ChainOfThoughtContent className="mb-4 ml-6 space-y-0.5">
              {process.map((part, partIndex) => {
                if (
                  isToolUIPart(part) &&
                  part.type.startsWith('tool-transfer_')
                ) {
                  return (
                    <AgentTransfer
                      part={part}
                      key={`${message.id}-${partIndex}`}
                    />
                  );
                }
                return null;
              })}
            </ChainOfThoughtContent>
          </ChainOfThought>
        )}

        {message.parts.map((part, partIndex) => {
          switch (part.type) {
            case 'text': // we don't use any reasoning or tool calls in this example
              return (
                <Response key={`${message.id}-${partIndex}`}>
                  {part.text}
                </Response>
              );
            default:
              return null;
          }
        })}
      </MessageContent>
    </Message>
  );
}
