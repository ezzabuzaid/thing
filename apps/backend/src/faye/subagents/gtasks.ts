import { tasks_v1 } from 'googleapis';

export async function createTaskList(
  api: tasks_v1.Tasks,
  title: string,
): Promise<string> {
  const res = await api.tasklists.insert({
    requestBody: { title },
  });
  return res.data.id!;
}

export async function createTask(
  api: tasks_v1.Tasks,
  taskListId: string,
  title: string,
  due?: Date,
  notes?: string,
): Promise<string> {
  const res = await api.tasks.insert({
    tasklist: taskListId,
    requestBody: {
      title,
      due: due?.toISOString(),
      notes,
    },
  });
  return res.data.id!;
}

export async function createSubtask(
  api: tasks_v1.Tasks,
  taskListId: string,
  parentTaskId: string,
  title: string,
  due?: Date,
  notes?: string,
): Promise<string> {
  const res = await api.tasks.insert({
    tasklist: taskListId,
    parent: parentTaskId,
    requestBody: {
      title,
      due: due?.toISOString(),
      notes,
    },
  });
  return res.data.id!;
}

export async function renameTask(
  api: tasks_v1.Tasks,
  taskListId: string,
  taskId: string,
  newTitle: string,
): Promise<void> {
  await api.tasks.patch({
    tasklist: taskListId,
    task: taskId,
    requestBody: { title: newTitle },
  });
}

export async function renameTaskList(
  api: tasks_v1.Tasks,
  taskListId: string,
  newTitle: string,
): Promise<void> {
  await api.tasklists.patch({
    tasklist: taskListId,
    requestBody: { title: newTitle },
  });
}

export async function moveTask(
  api: tasks_v1.Tasks,
  taskListId: string,
  taskId: string,
  newParentId?: string,
  previousId?: string,
): Promise<void> {
  await api.tasks.move({
    tasklist: taskListId,
    task: taskId,
    parent: newParentId,
    previous: previousId,
  });
}
export async function getTaskLists(
  api: tasks_v1.Tasks,
): Promise<tasks_v1.Schema$TaskList[]> {
  const res = await api.tasklists.list();
  return res.data.items || [];
}

export async function getTasks(
  api: tasks_v1.Tasks,
  taskListId: string,
  options: {
    showCompleted?: boolean;
    showHidden?: boolean;
    showDeleted?: boolean;
  } = {},
): Promise<tasks_v1.Schema$Task[]> {
  const res = await api.tasks.list({
    tasklist: taskListId,
    ...options,
  });
  return res.data.items || [];
}

export async function getTask(
  api: tasks_v1.Tasks,
  taskListId: string,
  taskId: string,
): Promise<tasks_v1.Schema$Task> {
  const res = await api.tasks.get({
    tasklist: taskListId,
    task: taskId,
  });
  return res.data;
}
