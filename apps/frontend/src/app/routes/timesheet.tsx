import type { TimesheetTree } from '@thing/client';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@thing/shadcn';
import { useData } from '@thing/ui';
import { CalendarIcon, DollarSign, Timer, UsersRound } from 'lucide-react';
import React from 'react';

import { Title } from '../components/Title';

export default function Timesheet() {
  const { data, isLoading } = useData('GET /timesheet/tree');

  const defaultExpanded = React.useMemo(() => {
    const ids: string[] = [];
    (data || []).forEach((c) => {
      ids.push(c.client.id);
      c.months.forEach((m) => ids.push(`${c.client.id}:${m.key}`));
    });
    return ids;
  }, [data]);

  return (
    <div className="h-full overflow-auto">
      <div className="container mx-auto px-4">
        <Title>Timesheet</Title>
      </div>
      <div className="container mx-auto px-4">
        {isLoading ? (
          <div className="text-muted-foreground py-10 text-center">
            Loading timesheet…
          </div>
        ) : !data || data.length === 0 ? (
          <div className="text-muted-foreground py-10 text-center">
            No entries
          </div>
        ) : (
          <Accordion type="multiple" defaultValue={defaultExpanded}>
            {data.map((client) => (
              <ClientNode key={client.client.id} node={client} />
            ))}
          </Accordion>
        )}
      </div>
    </div>
  );
}

function ClientNode({ node }: { node: TimesheetTree[number] }) {
  return (
    <AccordionItem value={node.client.id}>
      <AccordionTrigger>
        <div className="flex items-center gap-2">
          <UsersRound className="size-4" />
          <span>{node.client.name}</span>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <Accordion
          type="multiple"
          defaultValue={node.months.map((m) => `${node.client.id}:${m.key}`)}
        >
          {node.months.map((m) => (
            <MonthNode key={m.key} clientId={node.client.id} node={m} />
          ))}
        </Accordion>
      </AccordionContent>
    </AccordionItem>
  );
}

function MonthNode({
  clientId,
  node,
}: {
  clientId: string;
  node: TimesheetTree[number]['months'][number];
}) {
  const id = `${clientId}:${node.key}`;
  const totalHours = summarizeHours(node.entries.map((e) => e.hours));
  return (
    <AccordionItem value={id}>
      <AccordionTrigger>
        <div className="flex items-center gap-2">
          <CalendarIcon className="size-4" />
          <span>
            {node.label} · {totalHours}h
          </span>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="grid gap-3">
          {node.entries.map((e) => (
            <Card key={e.id}>
              <CardHeader className="py-3">
                <CardTitle className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <Timer className="size-4" />
                    {new Date(e.date).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-2">
                    <Badge variant={e.billable ? 'default' : 'secondary'}>
                      {e.hours}h
                    </Badge>
                    <Badge variant="outline">{e.project.name}</Badge>
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="py-3">
                <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-xs">
                  {e.note && <span className="truncate">{e.note}</span>}
                  <span className="ml-auto flex items-center gap-1">
                    <DollarSign className="size-3" />
                    {e.currency ?? 'USD'} @ {e.hourlyRate}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

function summarizeHours(hours: string[]) {
  // naive: treat as decimal hours in string form
  const total = hours.reduce((acc, h) => acc + (parseFloat(h) || 0), 0);
  return (Math.round(total * 100) / 100).toString();
}
