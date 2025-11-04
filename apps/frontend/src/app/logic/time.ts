import { addDays, format, formatRelative, startOfWeek } from 'date-fns';

import { parseCronExpression } from '../utils/cron-utils.ts';

export function formatDateTime(date: Date | string): string {
  return format(date, 'PPpp');
}

export function formatRelativeTime(date: Date | string): string {
  return formatRelative(date, new Date());
}

export function formatShortDate(date: Date | string): string {
  return format(date, 'EEE MMM dd yyyy');
}

export function formatDuration(
  startDate: Date | string,
  endDate: Date | string,
): string {
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
    const parsed = parseCronExpression(cronExpression);
    if (!parsed) return cronExpression;

    const { frequency, hour, minute, dayOfMonth, month, dayOfWeek } = parsed;

    // Format time
    const timeStr = format(new Date(2000, 0, 1, hour, minute), 'h:mm a');

    // Generate title based on frequency
    if (frequency === 'daily') {
      return `Daily at ${timeStr}`;
    }

    if (frequency === 'weekly' && dayOfWeek !== null) {
      const dayName = format(
        addDays(startOfWeek(new Date(), { weekStartsOn: 0 }), dayOfWeek),
        'EEEE',
      );
      return `${dayName}s at ${timeStr}`;
    }

    if (frequency === 'monthly' && dayOfMonth !== null) {
      return `${getOrdinal(dayOfMonth)} of the month at ${timeStr}`;
    }

    if (frequency === 'yearly' && dayOfMonth !== null && month !== null) {
      const monthName = format(new Date(2000, month - 1, 1), 'MMMM');
      return `${monthName} ${getOrdinal(dayOfMonth)} at ${timeStr}`;
    }

    // Fallback to raw cron if pattern doesn't match expected formats
    return cronExpression;
  } catch (error) {
    console.error('Failed to parse cron expression:', error);
    return cronExpression;
  }
}
