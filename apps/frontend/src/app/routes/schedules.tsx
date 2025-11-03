import { useForm } from '@tanstack/react-form';
import type { GetScheduleById, ListSchedules } from '@thing/client';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  Label,
  Separator,
  Spinner,
  Textarea,
  buttonVariants,
  cn,
} from '@thing/shadcn';
import {
  FieldMessage,
  FormMessage,
  errorToFormIssue,
  useAction,
  useData,
} from '@thing/ui';
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
import { z } from 'zod';

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

// Validation schemas
const createScheduleSchema = z.object({
  title: z.string().min(1, { message: 'Title is required' }),
  cron: z.string().min(1, { message: 'Schedule is required' }),
  instructions: z.string().min(1, { message: 'Instructions are required' }),
  connectors: z.array(z.string()),
  enabled: z.boolean(),
});

const editScheduleSchema = z.object({
  title: z.string().min(1, { message: 'Title is required' }),
  cron: z.string().min(1, { message: 'Schedule is required' }),
  instructions: z.string().min(1, { message: 'Instructions are required' }),
  connectors: z.array(z.string()),
});

const publishToMarketplaceSchema = z.object({
  title: z.string().min(1, { message: 'Title is required' }),
  cron: z.string().min(1, { message: 'Schedule is required' }),
  instructions: z.string().min(1, { message: 'Instructions are required' }),
  connectors: z.array(z.string()),
  description: z.string().min(1, { message: 'Description is required' }),
  tags: z.array(z.string()).min(1, { message: 'At least one tag is required' }),
});

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

  return (
    <div className="mx-auto h-full px-4">
      <div className="grid h-full grid-cols-1 gap-4 md:grid-cols-7">
        <div className="col-span-2 col-start-1 flex h-full flex-col">
          <div className="flex items-center justify-between gap-2">
            <Title>Schedules</Title>
            <CreateScheduleForm />
          </div>
          <ListPane
            response={data}
            isLoading={isLoading}
            selectedId={selectedId}
            onSelect={(id) => {
              setSearchParams({ id });
            }}
          />
        </div>
        <div className="col-span-full col-start-3 flex h-full flex-col overflow-auto border-l">
          <DetailsPane selectedId={selectedId} />
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
        <div className="text-muted-foreground flex h-full items-center justify-center p-4 text-center text-sm">
          No schedules yet
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <ul className="space-y-2">
        {records.map((it) => (
          <li key={it.id}>
            <button
              type="button"
              onClick={() => onSelect(it.id)}
              aria-label={`Open schedule ${it.title}`}
              className={cn(
                'hover:bg-muted/60 w-full rounded-sm border px-4 py-3 text-left transition-colors',
                selectedId === it.id ? 'bg-muted' : '',
              )}
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

function CreateScheduleForm() {
  const createMutation = useAction('POST /schedules', {
    invalidate: ['GET /schedules'],
  });
  const [, setSearchParams] = useSearchParams();
  const connectorsQuery = useConnectors();
  const [open, setOpen] = React.useState(false);

  const form = useForm({
    defaultValues: {
      title: '',
      cron: '',
      instructions: '',
      connectors: [] as string[],
      enabled: true,
    },
    validators: {
      onSubmit: createScheduleSchema,
      onSubmitAsync: async ({ value }) => {
        try {
          const created = await createMutation.mutateAsync({
            title: value.title.trim(),
            cron: value.cron.trim(),
            instructions: value.instructions.trim(),
            enabled: value.enabled,
            connectors: value.connectors,
          });
          setSearchParams({ id: created.id });
          setOpen(false);
          return;
        } catch (error) {
          return errorToFormIssue(error);
        }
      },
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className={buttonVariants({
          variant: 'outline',
          size: 'sm',
        })}
      >
        New schedule
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Create Schedule</DialogTitle>
          <DialogDescription>
            Create a new schedule for your tasks.
          </DialogDescription>
        </DialogHeader>

        <form
          className="grid gap-4"
          onSubmit={async (e) => {
            e.preventDefault();
            e.stopPropagation();
            await form.handleSubmit();
          }}
        >
          <form.Field
            name="title"
            children={(field) => (
              <div className="flex gap-4">
                <Label
                  htmlFor="create-sched-title"
                  className="min-w-20 font-medium"
                >
                  Title
                </Label>
                <div className="flex-1">
                  <Input
                    id="create-sched-title"
                    placeholder="Weekly status email"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-label="Schedule title"
                    className="bg-transparent"
                  />
                  <FieldMessage errors={field.state.meta.errors} />
                </div>
              </div>
            )}
          />

          <form.Field
            name="cron"
            children={(field) => (
              <div className="grid gap-4">
                <CronBuilder
                  value={field.state.value}
                  onChange={(cron) => field.handleChange(cron)}
                />
                {/* <div className="text-muted-foreground text-xs">
                  Cron preview: {field.state.value}
                </div> */}
                <FieldMessage errors={field.state.meta.errors} />
              </div>
            )}
          />

          <form.Field
            name="instructions"
            children={(field) => (
              <div className="grid gap-2">
                <Label
                  htmlFor="create-sched-instructions"
                  className="font-medium"
                >
                  Instructions
                </Label>
                <Textarea
                  id="create-sched-instructions"
                  placeholder="Describe what this schedule should do..."
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-label="Schedule instructions"
                  rows={3}
                  className="max-h-40 min-h-40"
                />
                <FieldMessage errors={field.state.meta.errors} />
              </div>
            )}
          />

          <form.Field
            name="connectors"
            children={(field) => (
              <div className="grid gap-2">
                <Label className="font-medium">Supported connectors</Label>
                <SelectorChips
                  options={connectorsQuery?.connectors}
                  value={field.state.value}
                  onChange={(its) => field.handleChange(its)}
                />
                <FieldMessage errors={field.state.meta.errors} />
              </div>
            )}
          />

          <form.Subscribe
            selector={(state) => state.errors}
            children={(errors) => <FormMessage errors={errors} />}
          />

          <DialogFooter>
            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
              children={([canSubmit, isSubmitting]) => (
                <div className="flex items-center gap-2">
                  <Button type="submit" disabled={!canSubmit || isSubmitting}>
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <Spinner /> Creating…
                      </span>
                    ) : (
                      'Create'
                    )}
                  </Button>
                  <DialogClose
                    className={cn(buttonVariants({ variant: 'ghost' }))}
                  >
                    Cancel
                  </DialogClose>
                </div>
              )}
            />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
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
      <DialogContent className="sm:max-w-xl">
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
  const connectorsQuery = useConnectors();

  const form = useForm({
    defaultValues: {
      title: schedule.title,
      cron: schedule.cron,
      instructions: schedule.instructions,
      connectors: schedule.connectors ?? [],
    },
    validators: {
      onSubmit: editScheduleSchema,
      onSubmitAsync: async ({ value }) => {
        try {
          await update.mutateAsync({
            id: schedule.id,
            title: value.title.trim(),
            cron: value.cron.trim(),
            instructions: value.instructions.trim(),
            connectors: value.connectors,
          });
          onSuccess();
          return;
        } catch (error) {
          return errorToFormIssue(error);
        }
      },
    },
  });

  return (
    <form
      className="grid gap-3"
      onSubmit={async (e) => {
        e.preventDefault();
        e.stopPropagation();
        await form.handleSubmit();
      }}
    >
      <form.Field
        name="title"
        children={(field) => (
          <div className="flex gap-4">
            <Label htmlFor="edit-sched-title" className="min-w-20 font-medium">
              Title
            </Label>
            <div className="flex-1">
              <Input
                id="edit-sched-title"
                placeholder="Weekly status email"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                aria-label="Schedule title"
                className="bg-transparent"
              />
              <FieldMessage errors={field.state.meta.errors} />
            </div>
          </div>
        )}
      />

      <form.Field
        name="cron"
        children={(field) => (
          <div>
            <CronBuilder
              value={field.state.value}
              onChange={(cron) => field.handleChange(cron)}
            />
            <FieldMessage errors={field.state.meta.errors} />
          </div>
        )}
      />

      <form.Field
        name="instructions"
        children={(field) => (
          <div className="grid gap-2">
            <Label htmlFor="edit-sched-instructions" className="font-medium">
              Instructions
            </Label>
            <Textarea
              id="edit-sched-instructions"
              placeholder="Describe what this schedule should do..."
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              aria-label="Schedule instructions"
              rows={3}
              className="max-h-48 min-h-48"
            />
            <FieldMessage errors={field.state.meta.errors} />
          </div>
        )}
      />

      <form.Field
        name="connectors"
        children={(field) => (
          <div className="grid gap-2">
            <Label className="font-medium">Supported connectors</Label>
            <SelectorChips
              options={connectorsQuery?.connectors}
              value={field.state.value}
              onChange={(its) => field.handleChange(its)}
            />
            <FieldMessage errors={field.state.meta.errors} />
          </div>
        )}
      />

      <form.Subscribe
        selector={(state) => state.errors}
        children={(errors) => <FormMessage errors={errors} />}
      />

      <form.Subscribe
        selector={(state) => [state.canSubmit, state.isSubmitting]}
        children={([canSubmit, isSubmitting]) => (
          <div className="flex items-center gap-2">
            <Button type="submit" disabled={!canSubmit || isSubmitting}>
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <Spinner /> Updating…
                </span>
              ) : (
                'Update'
              )}
            </Button>
          </div>
        )}
      />
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
  const connectorsQuery = useConnectors();
  const [tagInput, setTagInput] = React.useState('');

  const form = useForm({
    defaultValues: {
      title: schedule.title,
      cron: schedule.cron,
      instructions: schedule.instructions,
      connectors: schedule.connectors,
      description: '',
      tags: [] as string[],
    },
    validators: {
      onSubmit: publishToMarketplaceSchema,
      onSubmitAsync: async ({ value }) => {
        try {
          await publish.mutateAsync({
            scheduleId: schedule.id,
            title: value.title.trim(),
            instructions: value.instructions.trim(),
            suggestedCron: value.cron.trim(),
            connectors: value.connectors,
            description: value.description.trim(),
            tags: value.tags,
          });
          onOpenChange(false);
          // Reset form
          form.reset();
          setTagInput('');
          return;
        } catch (error) {
          return errorToFormIssue(error);
        }
      },
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Publish to Marketplace</DialogTitle>
          <p className="text-muted-foreground text-sm">
            Review and customize your schedule before sharing it with the
            community
          </p>
        </DialogHeader>

        <form
          className="grid gap-4"
          onSubmit={async (e) => {
            e.preventDefault();
            e.stopPropagation();
            await form.handleSubmit();
          }}
        >
          <form.Field
            name="title"
            children={(field) => (
              <div className="flex gap-4">
                <Label htmlFor="title" className="min-w-20 font-medium">
                  Title
                </Label>
                <Input
                  id="title"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Enter schedule title"
                />
                <FieldMessage errors={field.state.meta.errors} />
              </div>
            )}
          />

          <form.Field
            name="cron"
            children={(field) => (
              <div>
                <CronBuilder
                  value={field.state.value}
                  onChange={(cron) => field.handleChange(cron)}
                />
                <FieldMessage errors={field.state.meta.errors} />
              </div>
            )}
          />

          <form.Field
            name="instructions"
            children={(field) => (
              <div className="grid gap-2">
                <Label htmlFor="instructions">Instructions</Label>
                <Textarea
                  id="instructions"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Enter schedule instructions"
                  rows={6}
                />
                <FieldMessage errors={field.state.meta.errors} />
              </div>
            )}
          />

          <form.Field
            name="connectors"
            children={(field) => (
              <div className="grid gap-2">
                <Label className="font-medium">Supported connectors</Label>
                <SelectorChips
                  options={connectorsQuery?.connectors}
                  value={field.state.value}
                  onChange={(its) => field.handleChange(its)}
                />
                <FieldMessage errors={field.state.meta.errors} />
              </div>
            )}
          />

          <Separator />

          <form.Field
            name="description"
            children={(field) => (
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Describe what this schedule does and who it's for..."
                  rows={4}
                />
                <p className="text-muted-foreground text-xs">
                  Help others understand when and why to use this schedule
                </p>
                <FieldMessage errors={field.state.meta.errors} />
              </div>
            )}
          />

          <form.Field
            name="tags"
            children={(field) => {
              const handleAddTag = () => {
                const trimmed = tagInput.trim();
                const currentTags = field.state.value;
                if (
                  trimmed &&
                  currentTags.length < 3 &&
                  !currentTags.includes(trimmed)
                ) {
                  field.handleChange([...currentTags, trimmed]);
                  setTagInput('');
                }
              };

              const handleRemoveTag = (tag: string) => {
                field.handleChange(field.state.value.filter((t) => t !== tag));
              };

              return (
                <div className="grid gap-2">
                  <Label htmlFor="tags">Tags</Label>
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
                      disabled={field.state.value.length >= 3}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleAddTag}
                      disabled={
                        field.state.value.length >= 3 || !tagInput.trim()
                      }
                    >
                      Add
                    </Button>
                  </div>
                  {field.state.value.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {field.state.value.map((tag) => (
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
                    {field.state.value.length}/3 tags added
                  </p>
                  <FieldMessage errors={field.state.meta.errors} />
                </div>
              );
            }}
          />

          <Separator />

          <form.Subscribe
            selector={(state) => state.errors}
            children={(errors) => <FormMessage errors={errors} />}
          />

          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
            children={([canSubmit, isSubmitting]) => (
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={!canSubmit || isSubmitting}>
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <Spinner className="size-4" /> Publishing…
                    </span>
                  ) : (
                    'Publish to Marketplace'
                  )}
                </Button>
              </div>
            )}
          />
        </form>
      </DialogContent>
    </Dialog>
  );
}
