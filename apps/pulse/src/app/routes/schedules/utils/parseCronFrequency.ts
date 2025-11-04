import type { Frequency } from '../../../utils/cron-utils.ts';
import { parseCronExpression } from '../../../utils/cron-utils.ts';

// Re-export Frequency type for convenience
export type { Frequency };

/**
 * Parse a cron expression and determine its frequency type
 * Uses shared cron parsing utilities
 */
export function parseCronFrequency(cronStr: string): Frequency {
  const parsed = parseCronExpression(cronStr);
  return parsed?.frequency ?? 'custom';
}

/**
 * Group schedules by their frequency
 */
export function groupSchedulesByFrequency<T extends { cron: string }>(
  schedules: T[],
): Record<Frequency, T[]> {
  const groups: Record<Frequency, T[]> = {
    once: [],
    daily: [],
    weekly: [],
    monthly: [],
    yearly: [],
    custom: [],
  };

  for (const schedule of schedules) {
    const frequency = parseCronFrequency(schedule.cron);
    groups[frequency].push(schedule);
  }

  return groups;
}

/**
 * Get display label for frequency
 */
export function getFrequencyLabel(frequency: Frequency): string {
  const labels: Record<Frequency, string> = {
    once: 'Once',
    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly',
    yearly: 'Yearly',
    custom: 'Custom',
  };
  return labels[frequency];
}

/**
 * Order of frequency groups for display
 */
export const FREQUENCY_ORDER: Frequency[] = [
  'daily',
  'weekly',
  'monthly',
  'yearly',
  'once',
  'custom',
];
