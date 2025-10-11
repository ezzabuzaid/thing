import { KIND } from '../http/index.ts';
import chats from './chats.ts';
import files from './files.ts';
import schedules from './schedules.ts';
import tasks from './tasks.ts';
import thoughts from './thoughts.ts';
import timesheet from './timesheet.ts';

export default {
  ...chats,
  ...thoughts,
  ...schedules,
  ...tasks,
  ...timesheet,
  ...files,
};
