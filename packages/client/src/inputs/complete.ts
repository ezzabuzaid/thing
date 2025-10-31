import { z } from 'zod';

export const postRemindersreminderIdcompleteSchema = z.object({
  reminderId: z.string().uuid(),
});
