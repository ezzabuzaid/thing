import {
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@thing/shadcn';
import {
  addDays,
  eachMonthOfInterval,
  format,
  getDaysInMonth,
  startOfWeek,
} from 'date-fns';
import React from 'react';


export function CronBuilder({
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
type Frequency='once' | 'daily' | 'weekly' | 'monthly' | 'yearly'
// composingCron: Pure helper that builds a 5-field cron from simple inputs
// Note: Standard 5-field cron has no year, so "once" becomes a yearly cron for the selected date.
const composingCron = ({
  frequency,
  time,
  onceDate,
  weekDay,
  monthDay,
  yearMonth,
}: {
  frequency:  Frequency;
  time: string; // HH:mm
  onceDate: string; // YYYY-MM-DD
  weekDay: number; // 0..6
  monthDay: number; // 1..31
  yearMonth: number; // 1..12
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