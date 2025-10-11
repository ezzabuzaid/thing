import type * as models from '../index.ts';

export type TimesheetTree = {
  client: { id: string; name: string };
  months: {
    key: string;
    label: string;
    entries: {
      id: string;
      date: string;
      hours: string;
      billable: boolean;
      note: string;
      currency: string;
      hourlyRate: string;
      project: { id: string; name: string };
      updatedAt: string;
    }[];
  }[];
}[];

export type TimesheetTree400 = models.ValidationError;
