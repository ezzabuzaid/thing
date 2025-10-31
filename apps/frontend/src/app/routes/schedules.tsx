import type { GetScheduleById, ListSchedules } from '@thing/client';
import {
  Alert,
  AlertDescription,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  Label,
  Separator,
  Spinner,
  Textarea,
} from '@thing/shadcn';
import { useAction, useData } from '@thing/ui';
import { CronExpressionParser } from 'cron-parser';
import {
  Archive,
  ChevronLeft,
  ChevronRight,
  Pause,
  Pencil,
  Play,
  PlayCircle,
  Repeat,
  Upload,
  X,
} from 'lucide-react';
import React from 'react';
import { useSearchParams } from 'react-router';

import SelectorChips from '../components/ChipSelector.tsx';
import { CronBuilder } from '../components/CronBuilder.tsx';
import { IconButton } from '../components/IconButton.tsx';
import { Title } from '../components/Title.tsx';
import { Message, MessageContent } from '../elements/Message.tsx';
import { Response } from '../elements/Response.tsx';
import {
  cronTitle,
  formatDuration,
  formatRelativeTime,
  formatShortDate,
} from '../logic/time.ts';

function PauseButton({
  id,
  className,
  title = 'Pause',
  stopPropagation = true,
}: {
  id: string;
  className?: string;
  title?: string;
  stopPropagation?: boolean;
}) {
  const action = useAction('POST /schedules/{id}/pause', {
    invalidate: ['GET /schedules', 'GET /schedules/{id}'],
  });
  return (
    <Button
      type="button"
      size="icon"
      variant="outline"
      className={className}
      aria-label={title}
      title={title}
      disabled={action.isPending}
      onClick={(e) => {
        if (stopPropagation) e.stopPropagation();
        action.mutate({ id });
      }}
    >
      {action.isPending ? (
        <Spinner className="size-4" />
      ) : (
        <Pause className="size-4" />
      )}
    </Button>
  );
}

function ResumeButton({
  id,
  className,
  title = 'Resume',
  stopPropagation = true,
}: {
  id: string;
  className?: string;
  title?: string;
  stopPropagation?: boolean;
}) {
  const action = useAction('POST /schedules/{id}/resume', {
    invalidate: ['GET /schedules', 'GET /schedules/{id}'],
  });
  return (
    <Button
      type="button"
      size="icon"
      variant="ghost"
      className={className}
      aria-label={title}
      title={title}
      disabled={action.isPending}
      onClick={(e) => {
        if (stopPropagation) e.stopPropagation();
        action.mutate({ id });
      }}
    >
      {action.isPending ? (
        <Spinner className="size-4" />
      ) : (
        <Play className="size-4" />
      )}
    </Button>
  );
}

export default function Schedules() {
  const { data, isLoading } = useData('GET /schedules');
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedId = searchParams.get('id') ?? null;

  // React.useEffect(() => {
  //   const handler = () =>
  //     setSearchParams(new URLSearchParams(window.location.search));
  //   window.addEventListener('popstate', handler);
  //   return () => window.removeEventListener('popstate', handler);
  // }, []);

  const handleSelect = (id: string) => {
    // const next = new URLSearchParams(window.location.search);
    // next.set('id', id);
    // const url = `${window.location.pathname}?${next.toString()}`;
    // window.history.pushState({}, '', url);
    setSearchParams({ id });
  };

  return (
    <div className="h-full overflow-hidden">
      <div className="container mx-auto px-4">
        <Title>Schedules</Title>
      </div>
      <div className="container mx-auto px-4">
        <div className="grid h-[calc(100vh-140px)] grid-cols-1 gap-4 md:grid-cols-[400px_1fr]">
          <div className="overflow-hidden rounded-lg border">
            <ListPane
              response={data}
              isLoading={isLoading}
              selectedId={selectedId}
              onSelect={handleSelect}
            />
          </div>
          <div className="overflow-hidden rounded-lg border">
            <DetailsPane selectedId={selectedId} />
          </div>
        </div>
      </div>
    </div>
  );
}

function ListPane({
  response,
  isLoading,
  selectedId,
  onSelect,
}: {
  response: ListSchedules | undefined;
  isLoading: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const [isCreating, setIsCreating] = React.useState(false);
  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <span className="text-muted-foreground flex items-center gap-2 text-sm">
          <Spinner /> Loading schedules…
        </span>
      </div>
    );
  }

  const records = response?.records ?? [];

  if (records.length === 0) {
    return (
      <div className="h-full overflow-auto">
        <div className="border-b p-3">
          <div className="flex items-center">
            <Button
              type="button"
              size="sm"
              onClick={() => setIsCreating((v) => !v)}
            >
              {isCreating ? 'Close' : 'New schedule'}
            </Button>
          </div>
        </div>
        {isCreating ? (
          <div className="p-3">
            <CreateScheduleForm
              onCancel={() => setIsCreating(false)}
              onCreated={(id) => {
                setIsCreating(false);
                onSelect(id);
              }}
            />
          </div>
        ) : (
          <div className="text-muted-foreground flex h-full items-center justify-center p-4 text-center text-sm">
            No schedules yet
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <div className="border-b p-3">
        <div className="flex items-center">
          <Button
            type="button"
            size="sm"
            onClick={() => setIsCreating((v) => !v)}
          >
            {isCreating ? 'Close' : 'New schedule'}
          </Button>
        </div>
      </div>
      {isCreating && (
        <div className="p-3">
          <CreateScheduleForm
            onCancel={() => setIsCreating(false)}
            onCreated={(id) => {
              setIsCreating(false);
              onSelect(id);
            }}
          />
        </div>
      )}
      <ul className="divide-y">
        {records.map((it) => (
          <li key={it.id}>
            <button
              type="button"
              onClick={() => onSelect(it.id)}
              aria-label={`Open schedule ${it.title}`}
              className={
                'hover:bg-muted/60 w-full px-4 py-3 text-left transition-colors ' +
                (selectedId === it.id ? 'bg-muted' : '')
              }
            >
              <div className="flex items-center gap-2">
                <div className="flex min-w-0 flex-col">
                  <span className="truncate font-medium">{it.title}</span>
                  <span className="text-muted-foreground truncate text-xs">
                    {cronTitle(it.cron)}
                  </span>
                </div>
                {!it.enabled && (
                  <Badge variant={'default'} className="ml-auto">
                    Paused
                  </Badge>
                )}
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function DetailsPane({ selectedId }: { selectedId: string | null }) {
  if (!selectedId) {
    return (
      <div className="text-muted-foreground flex h-full items-center justify-center p-6 text-sm">
        Select a schedule from the list
      </div>
    );
  }

  return <ScheduleDetails id={selectedId} />;
}

function ScheduleDetails({ id }: { id: string }) {
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
    <div className="flex h-full flex-col">
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
      <div className="flex items-center justify-between">
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

        <EditButton schedule={schedule} />

        {schedule.enabled ? (
          <PauseButton id={schedule.id} />
        ) : (
          <ResumeButton id={schedule.id} />
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

function CreateScheduleForm({
  onCancel,
  onCreated,
}: {
  onCancel: () => void;
  onCreated: (id: string) => void;
}) {
  const create = useAction('POST /schedules', {
    invalidate: ['GET /schedules'],
  });

  const [title, setTitle] = React.useState('');
  const [cron, setCron] = React.useState('');
  const [instructions, setInstructions] = React.useState('');
  const [enabled, setEnabled] = React.useState(true);
  const [connectors, setConnectors] = React.useState<string[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!title.trim() || !cron.trim() || !instructions.trim()) {
      setError('Please fill title, cron and instructions.');
      return;
    }
    create.mutate(
      {
        title: title.trim(),
        cron: cron.trim(),
        instructions: instructions.trim(),
        enabled,
        connectors,
      },
      {
        onSuccess: (created) => {
          onCreated(created.id);
        },
        onError: (err: any) => {
          setError(err?.message ?? 'Failed to create schedule');
        },
      },
    );
  };

  const connectorsQuery = useConnectors();

  return (
    <form onSubmit={handleSubmit} className="grid gap-3">
      <FormError error={error} />

      <ScheduleTitleField
        id="create-sched-title"
        value={title}
        onChange={setTitle}
      />

      <CronBuilder cron={cron} onCronChange={setCron} />

      <ScheduleInstructionsField
        id="create-sched-instructions"
        value={instructions}
        onChange={setInstructions}
      />

      <div className="grid gap-2">
        <Label className="text-xs font-medium">Supported connectors</Label>
        <SelectorChips
          options={connectorsQuery?.connectors}
          value={connectors}
          onChange={(its) => setConnectors(its)}
        />
      </div>

      <div className="flex items-center gap-2">
        <Button type="submit" disabled={create.isPending}>
          {create.isPending ? (
            <span className="flex items-center gap-2">
              <Spinner /> Creating…
            </span>
          ) : (
            'Create'
          )}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={create.isPending}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}

function FormError({ error }: { error: string | null }) {
  if (!error) return null;
  return (
    <Alert variant="destructive">
      <AlertDescription>{error}</AlertDescription>
    </Alert>
  );
}

function ScheduleTitleField({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="grid gap-1">
      <Label htmlFor={id} className="text-xs font-medium">
        Title
      </Label>
      <Input
        id={id}
        placeholder="Weekly status email"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Schedule title"
      />
    </div>
  );
}

function ScheduleInstructionsField({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="grid gap-1">
      <Label htmlFor={id} className="text-xs font-medium">
        Instructions
      </Label>
      <Textarea
        id={id}
        placeholder="Describe what this schedule should do..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Schedule instructions"
        rows={3}
        className="max-h-48"
      />
    </div>
  );
}

function EditButton({ schedule }: { schedule: GetScheduleById }) {
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          size="icon"
          variant="outline"
          aria-label="Edit schedule"
          title="Edit schedule"
        >
          <Pencil className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Schedule</DialogTitle>
        </DialogHeader>
        <EditScheduleForm
          schedule={schedule}
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

function EditScheduleForm({
  schedule,
  onSuccess,
}: {
  schedule: GetScheduleById;
  onSuccess: () => void;
}) {
  const update = useAction('PATCH /schedules/{id}', {
    invalidate: ['GET /schedules', 'GET /schedules/{id}'],
  });

  const [title, setTitle] = React.useState(schedule.title);
  const [cron, setCron] = React.useState(schedule.cron);
  const [instructions, setInstructions] = React.useState(schedule.instructions);
  const [connectors, setConnectors] = React.useState<string[]>(
    schedule.connectors ?? [],
  );
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!title.trim() || !cron.trim() || !instructions.trim()) {
      setError('Please fill title, cron and instructions.');
      return;
    }
    update.mutate(
      {
        id: schedule.id,
        title: title.trim(),
        cron: cron.trim(),
        instructions: instructions.trim(),
        connectors,
      },
      {
        onSuccess: () => {
          onSuccess();
        },
        onError: (err: any) => {
          setError(err?.message ?? 'Failed to update schedule');
        },
      },
    );
  };
  const connectorsQuery = useConnectors();

  return (
    <form onSubmit={handleSubmit} className="grid gap-3">
      <FormError error={error} />

      <ScheduleTitleField
        id="edit-sched-title"
        value={title}
        onChange={setTitle}
      />

      <CronBuilder cron={cron} onCronChange={setCron} />

      <ScheduleInstructionsField
        id="edit-sched-instructions"
        value={instructions}
        onChange={setInstructions}
      />

      <div className="grid gap-2">
        <Label className="text-xs font-medium">Supported connectors</Label>
        <SelectorChips
          options={connectorsQuery?.connectors}
          value={connectors}
          onChange={setConnectors}
        />
      </div>

      <div className="flex items-center gap-2">
        <Button type="submit" disabled={update.isPending}>
          {update.isPending ? (
            <span className="flex items-center gap-2">
              <Spinner /> Updating…
            </span>
          ) : (
            'Update'
          )}
        </Button>
      </div>
    </form>
  );
}

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
    <div className="grid gap-3">
      <Card className="gap-4 py-4">
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
        <CardContent className="px-4 text-xs">
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

function useConnectors() {
  return useData('GET /schedules/connectors', {}, { staleTime: Infinity }).data;
}

function PublishToMarketplaceButton({
  schedule,
}: {
  schedule: GetScheduleById;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <IconButton
        title="Publish to marketplaces"
        onClick={() => setOpen(true)}
        icon={Upload}
      />

      <PublishToMarketplaceDialog
        schedule={schedule}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}

function PublishToMarketplaceDialog({
  schedule,
  open,
  onOpenChange,
}: {
  schedule: GetScheduleById;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const publish = useAction(
    'POST /schedules/{scheduleId}/publish-to-marketplace',
    {
      invalidate: ['GET /marketplace/templates'],
    },
  );

  const [title, setTitle] = React.useState(schedule.title);
  const [instructions, setInstructions] = React.useState(schedule.instructions);
  const [cron, setCron] = React.useState(schedule.cron);
  const [connectors, setConnectors] = React.useState<string[]>(
    schedule.connectors,
  );
  const [description, setDescription] = React.useState('');
  const [tags, setTags] = React.useState<string[]>([]);
  const [tagInput, setTagInput] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);

  const connectorsQuery = useConnectors();

  const handleAddTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && tags.length < 3 && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim() || !instructions.trim() || !cron.trim()) {
      setError('Please fill in title, instructions, and schedule');
      return;
    }

    if (!description.trim()) {
      setError('Please provide a description');
      return;
    }

    if (tags.length === 0) {
      setError('Please add at least one tag');
      return;
    }

    publish.mutate(
      {
        scheduleId: schedule.id,
        title: title.trim(),
        instructions: instructions.trim(),
        suggestedCron: cron.trim(),
        connectors,
        description: description.trim(),
        tags,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          // Reset form
          setTitle(schedule.title);
          setInstructions(schedule.instructions);
          setCron(schedule.cron);
          setConnectors(schedule.connectors);
          setDescription('');
          setTags([]);
          setTagInput('');
        },
        onError: (err: any) => {
          setError(err?.message ?? 'Failed to publish to marketplace');
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Publish to Marketplace</DialogTitle>
          <p className="text-muted-foreground text-sm">
            Review and customize your schedule before sharing it with the community
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-2">
            <Label htmlFor="title">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter schedule title"
            />
          </div>

          <CronBuilder cron={cron} onCronChange={setCron} />

          <div className="grid gap-2">
            <Label htmlFor="instructions">
              Instructions <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="instructions"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Enter schedule instructions"
              rows={6}
            />
          </div>

          <div className="grid gap-2">
            <Label className="text-xs font-medium">Supported connectors</Label>
            <SelectorChips
              options={connectorsQuery?.connectors}
              value={connectors}
              onChange={(its) => setConnectors(its)}
            />
          </div>

          <Separator />

          <div className="grid gap-2">
            <Label htmlFor="description">
              Description <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this schedule does and who it's for..."
              rows={4}
            />
            <p className="text-muted-foreground text-xs">
              Help others understand when and why to use this schedule
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="tags">
              Tags <span className="text-destructive">*</span>
            </Label>
            <div className="flex gap-2">
              <Input
                id="tags"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="e.g. productivity, news, automation"
                disabled={tags.length >= 3}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleAddTag}
                disabled={tags.length >= 3 || !tagInput.trim()}
              >
                Add
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <X
                      className="size-3 cursor-pointer"
                      onClick={() => handleRemoveTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
            )}
            <p className="text-muted-foreground text-xs">
              {tags.length}/3 tags added
            </p>
          </div>

          <Separator />

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={publish.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={publish.isPending}>
              {publish.isPending ? (
                <span className="flex items-center gap-2">
                  <Spinner className="size-4" /> Publishing…
                </span>
              ) : (
                'Publish to Marketplace'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
