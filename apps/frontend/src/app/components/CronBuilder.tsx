import {
  Button,
  Calendar,
  Label,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  ToggleGroup,
  ToggleGroupItem,
  cn,
} from '@thing/shadcn';
import { addDays, format, startOfWeek } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import React, { useCallback, useEffect } from 'react';

import type { Frequency } from '../utils/cron-utils.ts';
import { parseCronExpression } from '../utils/cron-utils.ts';

// Helper to parse cron expression and extract UI state components
const parseCron = (cronStr: string): {
  frequency: Frequency;
  hour: number;
  onceDate: string;
  weekDay: number;
  monthDay: number;
} | null => {
  const parsed = parseCronExpression(cronStr);
  if (!parsed) return null;

  const { frequency, hour, dayOfMonth, month, dayOfWeek } = parsed;

  // Build UI state based on frequency
  if (frequency === 'yearly') {
    // Construct date string for date picker
    const year = new Date().getFullYear();
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(dayOfMonth).padStart(2, '0')}`;

    return {
      frequency,
      hour,
      onceDate: dateStr,
      weekDay: 1,
      monthDay: 1,
    };
  } else if (frequency === 'monthly') {
    return {
      frequency,
      hour,
      onceDate: '',
      weekDay: 1,
      monthDay: dayOfMonth ?? 1,
    };
  } else if (frequency === 'weekly') {
    return {
      frequency,
      hour,
      onceDate: '',
      weekDay: dayOfWeek ?? 1,
      monthDay: 1,
    };
  } else if (frequency === 'daily') {
    return {
      frequency,
      hour,
      onceDate: '',
      weekDay: 1,
      monthDay: 1,
    };
  }

  // Custom or unknown frequency - return null
  return null;
};

export function CronBuilder({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
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

  // Initialize state from value prop when it changes
  useEffect(() => {
    if (!value) return;

    const parsed = parseCron(value);
    if (parsed) {
      setFrequency(parsed.frequency);
      setHour(parsed.hour);
      setOnceDate(parsed.onceDate || today);
      setWeekDay(parsed.weekDay);
      setMonthDay(parsed.monthDay);
    }
  }, [value, today]);

  const handleChange = useCallback(
    ({
      frequency,
      hour,
      monthDay,
      onceDate,
      weekDay,
    }: {
      frequency: Frequency;
      hour: number;
      onceDate: string;
      weekDay: number;
      monthDay: number;
    }) => {
      const hh = String(hour).padStart(2, '0');
      const time = `${hh}:00`;
      return composingCron({ frequency, time, onceDate, weekDay, monthDay });
    },
    [frequency, hour, onceDate, weekDay, monthDay],
  );

  return (
    <div className="grid gap-4">
      <div className="flex gap-4">
        <Label htmlFor="cron-frequency" className="min-w-20 font-medium">
          Frequency
        </Label>
        <ToggleGroup
          className="w-full border"
          type="single"
          value={frequency}
          onValueChange={(value) => {
            setFrequency(value as Frequency);
            onChange(
              handleChange({
                frequency: value as Frequency,
                hour,
                monthDay,
                onceDate,
                weekDay,
              }),
            );
          }}
          aria-label="Select frequency"
        >
          <ToggleGroupItem value="once" className="flex-1">Once</ToggleGroupItem>
          <ToggleGroupItem value="daily" className="flex-1">Daily</ToggleGroupItem>
          <ToggleGroupItem value="weekly" className="flex-1">Weekly</ToggleGroupItem>
          <ToggleGroupItem value="monthly" className="flex-1">Monthly</ToggleGroupItem>
          <ToggleGroupItem value="yearly" className="flex-1">Yearly</ToggleGroupItem>
        </ToggleGroup>
      </div>

      <div className="flex flex-col gap-2 rounded-lg border px-4 py-4">
        <HourField
          value={hour}
          onChange={(value) => {
            setHour(value);
            onChange(
              handleChange({
                frequency,
                hour: value,
                monthDay,
                onceDate,
                weekDay,
              }),
            );
          }}
        />

        {(frequency === 'once' || frequency === 'yearly') && (
          <DateField
            value={onceDate}
            onChange={(value) => {
              setOnceDate(value);
              onChange(
                handleChange({
                  frequency,
                  hour,
                  monthDay,
                  onceDate: value,
                  weekDay,
                }),
              );
            }}
          />
        )}

        {frequency === 'weekly' && (
          <WeekField
            value={weekDay}
            onChange={(value) => {
              setWeekDay(value);
              onChange(
                handleChange({
                  frequency,
                  hour,
                  monthDay,
                  onceDate,
                  weekDay: value,
                }),
              );
            }}
          />
        )}

        {frequency === 'monthly' && (
          <MonthField
            value={monthDay}
            onChange={(value) => {
              setMonthDay(value);
              onChange(
                handleChange({
                  frequency,
                  hour,
                  monthDay: value,
                  onceDate,
                  weekDay,
                }),
              );
            }}
            maxDays={31}
          />
        )}
      </div>
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
    <div className="flex gap-4">
      <Label htmlFor="cron-weekday" className="min-w-24 shrink-0 font-medium">
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

// DateField: choose a specific date using a calendar picker
function DateField({
  value,
  onChange,
}: {
  value: string;
  onChange: (date: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const selectedDate = value ? new Date(value) : undefined;

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      onChange(`${y}-${m}-${d}`);
      setOpen(false);
    }
  };

  return (
    <div className="flex gap-4">
      <Label htmlFor="cron-date" className="min-w-24 font-medium">
        Date
      </Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id="cron-date"
            variant="outline"
            className={cn(
              'w-full justify-between text-left font-normal',
              !selectedDate && 'text-muted-foreground',
            )}
          >
            {selectedDate ? (
              format(selectedDate, 'PPP')
            ) : (
              <span>Pick a date</span>
            )}
            <CalendarIcon className="mr-2 size-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleSelect}
          />
        </PopoverContent>
      </Popover>
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
    <div className="flex gap-4">
      <Label htmlFor="cron-dom" className="min-w-24 shrink-0 font-medium">
        Day of month
      </Label>
      <Select value={String(value)} onValueChange={(v) => onChange(Number(v))}>
        <SelectTrigger
          className="w-full"
          id="cron-dom"
          aria-label="Day of month"
        >
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
    <div className="flex gap-4">
      <Label htmlFor="cron-hour" className="min-w-24 font-medium">
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

// composingCron: Pure helper that builds a 5-field cron from simple inputs
// Note: Standard 5-field cron has no year, so "once" becomes a yearly cron for the selected date.
const composingCron = ({
  frequency,
  time,
  onceDate,
  weekDay,
  monthDay,
}: {
  frequency: Frequency;
  time: string; // HH:mm
  onceDate: string; // YYYY-MM-DD
  weekDay: number; // 0..6
  monthDay: number; // 1..31
}): string => {
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
  // once or yearly - both use the date picker
  const d = new Date(onceDate);
  const dom = d.getDate();
  const mon = d.getMonth() + 1;
  return `${m} ${h} ${dom} ${mon} *`;
};
