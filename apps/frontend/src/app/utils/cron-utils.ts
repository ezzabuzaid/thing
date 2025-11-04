/**
 * Shared cron parsing utilities
 * These functions provide low-level primitives and high-level parsers
 * for working with 5-field cron expressions
 */

export type Frequency =
  | 'once'
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'yearly'
  | 'custom';

export interface CronParts {
  minute: number;
  hour: number;
  dayOfMonth: number | null;
  month: number | null;
  dayOfWeek: number | null;
  frequency: Frequency;
}

/**
 * Tier 1: Low-level Parsing Primitives
 */

/**
 * Split and validate cron expression format
 * Returns array of 5 parts [minute, hour, dom, month, dow] or null if invalid
 */
export function splitCronExpression(cronStr: string): string[] | null {
  if (!cronStr || !cronStr.trim()) return null;

  const parts = cronStr.trim().split(/\s+/);
  if (parts.length !== 5) return null;

  return parts;
}

/**
 * Parse and validate hour field (0-23)
 */
export function parseHour(hourStr: string): number | null {
  const h = parseInt(hourStr, 10);
  if (isNaN(h) || h < 0 || h > 23) return null;
  return h;
}

/**
 * Parse and validate minute field (0-59)
 */
export function parseMinute(minuteStr: string): number | null {
  const m = parseInt(minuteStr, 10);
  if (isNaN(m) || m < 0 || m > 59) return null;
  return m;
}

/**
 * Parse and validate day of month field (1-31)
 * Returns null if wildcard or invalid
 */
export function parseDayOfMonth(domStr: string): number | null {
  if (domStr === '*') return null;

  const day = parseInt(domStr, 10);
  if (isNaN(day) || day < 1 || day > 31) return null;
  return day;
}

/**
 * Parse and validate day of week field (0-6, 0=Sunday)
 * Returns null if wildcard or invalid
 */
export function parseDayOfWeek(dowStr: string): number | null {
  if (dowStr === '*') return null;

  const day = parseInt(dowStr, 10);
  if (isNaN(day) || day < 0 || day > 6) return null;
  return day;
}

/**
 * Parse and validate month field (1-12)
 * Returns null if wildcard or invalid
 */
export function parseMonth(monthStr: string): number | null {
  if (monthStr === '*') return null;

  const month = parseInt(monthStr, 10);
  if (isNaN(month) || month < 1 || month > 12) return null;
  return month;
}

/**
 * Tier 2: Frequency Detection
 */

/**
 * Determine frequency type from cron field patterns
 *
 * Patterns:
 * - yearly: m h dom mon * (specific date annually)
 * - monthly: m h dom * * (specific day of month)
 * - weekly: m h * * dow (specific day of week)
 * - daily: m h * * * (every day)
 */
export function detectFrequency(
  dom: string,
  month: string,
  dow: string,
): Frequency {
  // Yearly/Once: both month and day of month are specified
  if (month !== '*' && dom !== '*') {
    return 'yearly';
  }

  // Monthly: day of month specified, but month is wildcard
  if (dom !== '*' && month === '*') {
    return 'monthly';
  }

  // Weekly: day of week specified, month and dom are wildcards
  if (dow !== '*' && month === '*' && dom === '*') {
    return 'weekly';
  }

  // Daily: all are wildcards
  if (dom === '*' && month === '*' && dow === '*') {
    return 'daily';
  }

  // Custom: doesn't match standard patterns
  return 'custom';
}

/**
 * Tier 3: Unified Parser
 */

/**
 * Parse a complete cron expression into structured parts
 * Returns CronParts object with all parsed values and detected frequency
 * Returns null if cron expression is invalid
 */
export function parseCronExpression(cronStr: string): CronParts | null {
  const parts = splitCronExpression(cronStr);
  if (!parts) return null;

  const [minuteStr, hourStr, domStr, monthStr, dowStr] = parts;

  // Validate required fields (minute and hour must be valid)
  const minute = parseMinute(minuteStr);
  const hour = parseHour(hourStr);

  if (minute === null || hour === null) return null;

  // Parse optional fields (can be wildcards)
  const dayOfMonth = parseDayOfMonth(domStr);
  const month = parseMonth(monthStr);
  const dayOfWeek = parseDayOfWeek(dowStr);

  // Detect frequency from pattern
  const frequency = detectFrequency(domStr, monthStr, dowStr);

  return {
    minute,
    hour,
    dayOfMonth,
    month,
    dayOfWeek,
    frequency,
  };
}

/**
 * Helper: Check if cron matches a specific frequency pattern
 */
export function isFrequency(
  cronStr: string,
  targetFrequency: Frequency,
): boolean {
  const parsed = parseCronExpression(cronStr);
  return parsed?.frequency === targetFrequency;
}
