import type { GetScheduleById } from '@thing/client';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Separator,
  Spinner,
  cn,
} from '@thing/shadcn';
import { useAction, useData } from '@thing/ui';
import { CronExpressionParser } from 'cron-parser';
import {
  Archive,
  ChevronLeft,
  ChevronRight,
  PlayCircle,
  Repeat,
  X,
} from 'lucide-react';
import React from 'react';
import { useSearchParams } from 'react-router';

import { Message, MessageContent } from '../../elements/Message.tsx';
import { Response } from '../../elements/Response.tsx';
import {
  cronTitle,
  formatDuration,
  formatRelativeTime,
  formatShortDate,
} from '../../logic/time.ts';
import EditScheduleButton from './EditScheduleButton.tsx';
import PauseScheduleButton from './PauseScheduleButton.tsx';
import PublishToMarketplaceButton from './PublishToMarketplaceButton.tsx';
import ResumeScheduleButton from './ResumeScheduleButton.tsx';

export function DetailsPane({ selectedId,className }: { selectedId: string | null;className?:string }) {
  if (!selectedId) {
    return (
      <div className="text-muted-foreground flex h-full items-center justify-center p-6 text-sm">
        Select a schedule from the list
      </div>
    );
  }

  return <ScheduleDetails id={selectedId} className={className} />;
}

function ScheduleDetails({
  id,
  className,
}: {
  id: string;
  className?: string;
}) {
  const { data, isLoading } = useData('GET /schedules/{id}', { id });

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <span className="text-muted-foreground flex items-center gap-2 text-sm">
          <Spinner /> Loading schedule…
        </span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-muted-foreground flex h-full items-center justify-center p-6 text-sm">
        Schedule not found
      </div>
    );
  }

  return (
    <div className={cn('flex h-full flex-col', className)}>
      <Header schedule={data} />
      <Separator />
      <div className="flex-1 overflow-auto p-4">
        <RunsList
          runs={data.runs ?? []}
          cron={data.cron}
          enabled={data.enabled}
        />
      </div>
    </div>
  );
}

const Header = ({ schedule }: { schedule: GetScheduleById }) => {
  const [, setSearchParams] = useSearchParams();
  const runAction = useAction('POST /schedules/{id}/run', {
    invalidate: ['GET /schedules/{id}'],
  });
  const archiveAction = useAction('DELETE /schedules/{id}', {
    invalidate: ['GET /schedules'],
    onSuccess: () => {
      setSearchParams((it) => {
        it.delete('id');
        return it;
      });
    },
  });

  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-lg font-semibold">{schedule.title}</span>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            aria-label="Archive schedule"
            title="Archive"
            disabled={archiveAction.isPending}
            onClick={() => {
              archiveAction.mutate({ id: schedule.id });
            }}
          >
            {archiveAction.isPending ? (
              <Spinner className="size-4" />
            ) : (
              <Archive className="size-4" />
            )}
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={() => {
              setSearchParams((it) => {
                it.delete('id');
                return it;
              });
            }}
            aria-label="Close schedule details"
            title="Close"
          >
            <X className="size-4" />
          </Button>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-2 text-sm">
          <Repeat className="size-4" />
          {cronTitle(schedule.cron)}
        </span>

        <EditScheduleButton schedule={schedule} />

        {schedule.enabled ? (
          <PauseScheduleButton id={schedule.id} />
        ) : (
          <ResumeScheduleButton id={schedule.id} />
        )}

        <PublishToMarketplaceButton schedule={schedule} />
        <Button
          type="button"
          variant={'outline'}
          size="sm"
          onClick={() =>
            runAction.mutate({
              id: schedule.id,
              source: 'user',
            })
          }
          disabled={runAction.isPending}
        >
          {runAction.isPending ? (
            <span className="flex items-center gap-2">
              <Spinner /> Running…
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <PlayCircle className="size-4" /> Test
            </span>
          )}
        </Button>
      </div>

      <div className="text-muted-foreground line-clamp-3 text-sm">
        {schedule.instructions}
      </div>
    </div>
  );
};

const RunsList = ({
  runs,
  cron,
  enabled,
}: {
  runs: GetScheduleById['runs'];
  cron: string;
  enabled: boolean;
}) => {
  const [selectedRunId, setSelectedRunId] = React.useState<string | null>(null);

  // Calculate index during render - no effect needed!
  const currentIndex = React.useMemo(() => {
    if (selectedRunId) {
      const idx = runs.findIndex((r) => r.id === selectedRunId);
      if (idx !== -1) return idx;
    }
    // Default to latest run
    return runs.length - 1;
  }, [runs, selectedRunId]);

  if (runs.length === 0) {
    return (
      <div className="text-muted-foreground py-10 text-center text-sm">
        {!enabled ? (
          'Schedule is paused. Resume to see next run time.'
        ) : nextRun ? (
          <>Next run {formatRelativeTime(nextRun(cron))}</>
        ) : (
          'No runs yet. Use "Run now" to trigger one.'
        )}
      </div>
    );
  }

  const currentRun = runs[currentIndex];
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < runs.length - 1;

  const goToPrevious = () => {
    if (hasPrevious) {
      setSelectedRunId(runs[currentIndex - 1].id);
    }
  };

  const goToNext = () => {
    if (hasNext) {
      setSelectedRunId(runs[currentIndex + 1].id);
    }
  };

  const goToLatest = () => {
    setSelectedRunId(null); // null = auto-select latest
  };

  return (
    <div className="flex h-full flex-col">
      <Card className="flex h-full flex-col gap-4 py-4">
        <CardHeader className="gap-0 px-4">
          <CardTitle className="flex items-center justify-between text-sm">
            <div className="flex flex-col gap-1">
              <span className="font-medium">{currentRun.title}</span>
              <span className="text-muted-foreground text-xs font-normal">
                {formatShortDate(currentRun.completedAt || currentRun.runAt)}
                {currentRun.completedAt && (
                  <>
                    {' '}
                    · Ran for{' '}
                    {formatDuration(currentRun.runAt, currentRun.completedAt)}
                  </>
                )}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                size="icon"
                variant="outline"
                onClick={goToPrevious}
                disabled={!hasPrevious}
                aria-label="Previous run"
                title="Previous run"
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="outline"
                onClick={goToNext}
                disabled={!hasNext}
                aria-label="Next run"
                title="Next run"
              >
                <ChevronRight className="size-4" />
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={goToLatest}
                disabled={currentIndex === runs.length - 1}
                aria-label="Jump to latest run"
                title="Jump to latest run"
              >
                Latest
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="flex-1 overflow-auto px-4 text-xs">
          <Message from={'assistant'}>
            <MessageContent className="rounded-none" variant={'flat'}>
              <Response>{currentRun.result}</Response>
            </MessageContent>
          </Message>
        </CardContent>
      </Card>
    </div>
  );
};

function nextRun(cron: string) {
  const interval = CronExpressionParser.parse(cron);
  return interval.next().toDate();
}
