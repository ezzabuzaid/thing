import { z } from 'zod';

export const postRemindersreminderIdcancelSchema = z.object({
  reminderId: z.string().uuid(),
});
