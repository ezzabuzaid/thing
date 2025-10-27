import { addDays, format, formatRelative, startOfWeek } from 'date-fns';

export function formatDateTime(date: Date | string): string {
  return format(date, 'PPpp');
}

export function formatRelativeTime(date: Date | string): string {
  return formatRelative(date, new Date());
}

export function formatShortDate(date: Date | string): string {
  return format(date, 'EEE MMM dd yyyy');
}

export function formatDuration(startDate: Date | string, endDate: Date | string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffMs = end.getTime() - start.getTime();
  const diffSec = diffMs / 1000;

  if (diffSec < 60) {
    return `${diffSec.toFixed(2)} s`;
  }

  const diffMin = diffSec / 60;
  if (diffMin < 60) {
    return `${diffMin.toFixed(2)} min`;
  }

  const diffHour = diffMin / 60;
  return `${diffHour.toFixed(2)} h`;
}

function getOrdinal(n: number): string {
  const pr = new Intl.PluralRules('en-US', { type: 'ordinal' });
  const suffixes = new Map([
    ['one', 'st'],
    ['two', 'nd'],
    ['few', 'rd'],
    ['other', 'th'],
  ]);
  const rule = pr.select(n);
  const suffix = suffixes.get(rule);
  return `${n}${suffix}`;
}

export function cronTitle(cronExpression: string): string {
  try {
    const parts = cronExpression.trim().split(/\s+/);
    if (parts.length !== 5) return cronExpression;

    const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

    // Parse time
    const h = parseInt(hour, 10);
    const m = parseInt(minute, 10);
    const timeStr = format(new Date(2000, 0, 1, h, m), 'h:mm a');

    // Daily: * * * (any day, any month, any day of week)
    if (dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
      return `Daily at ${timeStr}`;
    }

    // Weekly: specific day of week
    if (dayOfMonth === '*' && month === '*' && dayOfWeek !== '*') {
      const dow = parseInt(dayOfWeek, 10);
      const dayName = format(
        addDays(startOfWeek(new Date(), { weekStartsOn: 0 }), dow),
        'EEEE',
      );
      return `${dayName}s at ${timeStr}`;
    }

    // Monthly: specific day of month
    if (dayOfMonth !== '*' && month === '*' && dayOfWeek === '*') {
      const day = parseInt(dayOfMonth, 10);
      return `${getOrdinal(day)} of the month at ${timeStr}`;
    }

    // Yearly: specific month and day
    if (dayOfMonth !== '*' && month !== '*') {
      const day = parseInt(dayOfMonth, 10);
      const mon = parseInt(month, 10);
      const monthName = format(new Date(2000, mon - 1, 1), 'MMMM');
      return `${monthName} ${getOrdinal(day)} at ${timeStr}`;
    }

    // Fallback to raw cron if pattern doesn't match expected formats
    return cronExpression;
  } catch (error) {
    console.error('Failed to parse cron expression:', error);
    return cronExpression;
  }
}
