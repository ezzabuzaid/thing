import { KIND } from '../http/index.ts';
import cancel from './cancel.ts';
import chats from './chats.ts';
import complete from './complete.ts';
import files from './files.ts';
import marketplace from './marketplace.ts';
import reminders from './reminders.ts';
import schedules from './schedules.ts';
import tasks from './tasks.ts';
import thoughts from './thoughts.ts';
import timesheet from './timesheet.ts';

export default {
  ...chats,
  ...thoughts,
  ...schedules,
  ...marketplace,
  ...reminders,
  ...complete,
  ...cancel,
  ...tasks,
  ...timesheet,
  ...files,
};
