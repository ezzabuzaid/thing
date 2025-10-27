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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Spinner,
  Textarea,
} from '@thing/shadcn';
import { useAction, useData } from '@thing/ui';
import { CronExpressionParser } from 'cron-parser';
import {
  addDays,
  eachMonthOfInterval,
  format,
  getDaysInMonth,
  startOfWeek,
} from 'date-fns';
import {
  ChevronLeft,
  ChevronRight,
  Pause,
  Pencil,
  Play,
  PlayCircle,
  Repeat,
  X,
} from 'lucide-react';
import React from 'react';

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
  const [searchParams, setSearchParams] = React.useState(
    new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    ),
  );

  const selectedId = searchParams.get('id') ?? null;

  React.useEffect(() => {
    const handler = () =>
      setSearchParams(new URLSearchParams(window.location.search));
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, []);

  const handleSelect = (id: string) => {
    const next = new URLSearchParams(window.location.search);
    next.set('id', id);
    const url = `${window.location.pathname}?${next.toString()}`;
    window.history.pushState({}, '', url);
    setSearchParams(next);
  };

  const handleClose = () => {
    const next = new URLSearchParams(window.location.search);
    next.delete('id');
    const url = next.toString()
      ? `${window.location.pathname}?${next.toString()}`
      : window.location.pathname;
    window.history.pushState({}, '', url);
    setSearchParams(next);
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
            <DetailsPane selectedId={selectedId} onClose={handleClose} />
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

function DetailsPane({
  selectedId,
  onClose,
}: {
  selectedId: string | null;
  onClose: () => void;
}) {
  if (!selectedId) {
    return (
      <div className="text-muted-foreground flex h-full items-center justify-center p-6 text-sm">
        Select a schedule from the list
      </div>
    );
  }

  return <ScheduleDetails id={selectedId} onClose={onClose} />;
}

function ScheduleDetails({ id, onClose }: { id: string; onClose: () => void }) {
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
      <Header schedule={data} onClose={onClose} />
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

const Header = ({
  schedule,
  onClose,
}: {
  schedule: GetScheduleById;
  onClose: () => void;
}) => {
  const runAction = useAction('POST /schedules/{id}/run', {
    invalidate: ['GET /schedules/{id}'],
  });

  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <span className="text-lg font-semibold">{schedule.title}</span>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={onClose}
          aria-label="Close schedule details"
          title="Close"
        >
          <X className="size-4" />
        </Button>
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

type Frequency = 'once' | 'daily' | 'weekly' | 'monthly' | 'yearly';

type ComposeCronArgs = {
  frequency: Frequency;
  time: string; // HH:mm
  onceDate: string; // YYYY-MM-DD
  weekDay: number; // 0..6
  monthDay: number; // 1..31
  yearMonth: number; // 1..12
};

// composingCron: Pure helper that builds a 5-field cron from simple inputs
// Note: Standard 5-field cron has no year, so "once" becomes a yearly cron for the selected date.
const composingCron = ({
  frequency,
  time,
  onceDate,
  weekDay,
  monthDay,
  yearMonth,
}: ComposeCronArgs): string => {
  const [hoursStr, minutesStr] = time.split(':');
  const h = Math.max(0, Math.min(23, Number(hoursStr) || 0));
  const m = Math.max(0, Math.min(59, Number(minutesStr) || 0));

  if (frequency === 'daily') {
    return `${m} ${h} * * *`;
  }
  if (frequency === 'weekly') {
    const dow = Math.max(0, Math.min(6, weekDay));
    return `${m} ${h} * * ${dow}`;
  }
  if (frequency === 'monthly') {
    const dom = Math.max(1, Math.min(31, monthDay));
    return `${m} ${h} ${dom} * *`;
  }
  if (frequency === 'yearly') {
    const dom = Math.max(1, Math.min(31, monthDay));
    const mon = Math.max(1, Math.min(12, yearMonth));
    return `${m} ${h} ${dom} ${mon} *`;
  }
  // once
  const d = new Date(onceDate);
  const dom = d.getDate();
  const mon = d.getMonth() + 1;
  return `${m} ${h} ${dom} ${mon} *`;
};

function CronBuilder({
  cron,
  onCronChange,
}: {
  cron: string;
  onCronChange: (cron: string) => void;
}) {
  const today = React.useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
  }, []);

  const [frequency, setFrequency] = React.useState<Frequency>('daily');
  const [hour, setHour] = React.useState<number>(9);
  const [onceDate, setOnceDate] = React.useState<string>(today);
  const [weekDay, setWeekDay] = React.useState<number>(1); // 1=Mon
  const [monthDay, setMonthDay] = React.useState<number>(1);
  const [yearMonth, setYearMonth] = React.useState<number>(1);

  const cronValue = React.useMemo(() => {
    const hh = String(hour).padStart(2, '0');
    const time = `${hh}:00`;
    return composingCron({
      frequency,
      time,
      onceDate,
      weekDay,
      monthDay,
      yearMonth,
    });
  }, [frequency, hour, onceDate, weekDay, monthDay, yearMonth]);

  React.useEffect(() => {
    onCronChange(cronValue);
  }, [cronValue, onCronChange]);

  return (
    <div className="grid gap-2">
      <div className="grid gap-1">
        <Label htmlFor="cron-frequency" className="text-xs font-medium">
          Frequency
        </Label>
        <Select
          value={frequency}
          onValueChange={(v) => setFrequency(v as Frequency)}
        >
          <SelectTrigger id="cron-frequency" aria-label="Select frequency">
            <SelectValue placeholder="Select frequency" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="once">Once</SelectItem>
            <SelectItem value="daily">Daily</SelectItem>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="yearly">Yearly</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <HourField value={hour} onChange={setHour} />

      {frequency === 'once' && (
        <div className="grid gap-1">
          <Label className="text-xs font-medium" htmlFor="cron-once-date">
            Date
          </Label>
          <Input
            id="cron-once-date"
            type="date"
            value={onceDate}
            onChange={(e) => setOnceDate(e.target.value)}
            aria-label="Select date"
          />
          <span className="text-muted-foreground text-xs">
            Note: Cron doesn't include the year. "Once" will create a yearly
            cron for the chosen date; you can disable the schedule after it
            runs.
          </span>
        </div>
      )}

      {frequency === 'weekly' && (
        <WeekField value={weekDay} onChange={setWeekDay} />
      )}

      {(frequency === 'monthly' || frequency === 'yearly') && (
        <div className="grid grid-cols-2 gap-2">
          <MonthField
            value={monthDay}
            onChange={setMonthDay}
            maxDays={
              frequency === 'yearly'
                ? getDaysInMonth(
                    new Date(new Date().getFullYear(), yearMonth - 1, 1),
                  )
                : 31
            }
          />
          {frequency === 'yearly' && (
            <YearField
              value={yearMonth}
              onChange={(n) => {
                setYearMonth(n);
                // Clamp day if needed when month changes
                const md = getDaysInMonth(
                  new Date(new Date().getFullYear(), n - 1, 1),
                );
                setMonthDay((d) => Math.min(d, md));
              }}
            />
          )}
        </div>
      )}

      <div className="text-muted-foreground text-xs">Cron preview: {cron}</div>
    </div>
  );
}

// WeekField: choose day of week (0=Sun..6=Sat) using date-fns for labels
function WeekField({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) {
  const start = React.useMemo(
    () => startOfWeek(new Date(), { weekStartsOn: 0 }),
    [],
  );
  const days = React.useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(start, i)),
    [start],
  );
  return (
    <div className="grid gap-1">
      <Label htmlFor="cron-weekday" className="text-xs font-medium">
        Day of week
      </Label>
      <Select value={String(value)} onValueChange={(v) => onChange(Number(v))}>
        <SelectTrigger id="cron-weekday" aria-label="Select day of week">
          <SelectValue placeholder="Select day of week" />
        </SelectTrigger>
        <SelectContent>
          {days.map((d, i) => (
            <SelectItem key={i} value={String(i)}>
              {format(d, 'EEEE')}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

// MonthField: choose day of month with optional cap based on month length
function MonthField({
  value,
  onChange,
  maxDays = 31,
}: {
  value: number;
  onChange: (n: number) => void;
  maxDays?: number;
}) {
  const days = React.useMemo(
    () => Array.from({ length: maxDays }, (_, i) => i + 1),
    [maxDays],
  );
  return (
    <div className="grid gap-1">
      <Label htmlFor="cron-dom" className="text-xs font-medium">
        Day of month
      </Label>
      <Select value={String(value)} onValueChange={(v) => onChange(Number(v))}>
        <SelectTrigger id="cron-dom" aria-label="Day of month">
          <SelectValue placeholder="Day of month" />
        </SelectTrigger>
        <SelectContent>
          {days.map((d) => (
            <SelectItem key={d} value={String(d)}>
              {d}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function YearField({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) {
  const months = React.useMemo(
    () =>
      eachMonthOfInterval({
        start: new Date(new Date().getFullYear(), 0, 1),
        end: new Date(new Date().getFullYear(), 11, 31),
      }).map((d, idx) => ({ idx: idx + 1, label: format(d, 'LLLL') })),
    [],
  );
  return (
    <div className="grid gap-1">
      <Label htmlFor="cron-month" className="text-xs font-medium">
        Month
      </Label>
      <Select value={String(value)} onValueChange={(v) => onChange(Number(v))}>
        <SelectTrigger id="cron-month" aria-label="Select month">
          <SelectValue placeholder="Select month" />
        </SelectTrigger>
        <SelectContent>
          {months.map((m) => (
            <SelectItem key={m.idx} value={String(m.idx)}>
              {m.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

// HourField: select hour of day (0..23) with HH:00 labels
function HourField({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) {
  const hours = React.useMemo(
    () => Array.from({ length: 24 }, (_, i) => i),
    [],
  );
  return (
    <div className="grid gap-1">
      <Label htmlFor="cron-hour" className="text-xs font-medium">
        Time
      </Label>
      <Select value={String(value)} onValueChange={(v) => onChange(Number(v))}>
        <SelectTrigger id="cron-hour" aria-label="Select hour">
          <SelectValue placeholder="Select hour" />
        </SelectTrigger>
        <SelectContent>
          {hours.map((h) => (
            <SelectItem key={h} value={String(h)}>
              {format(new Date(2000, 0, 1, h, 0), 'h a')}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
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
