import {
  Circle,
  CircleCheckBig,
  CircleDot,
  Eye,
  EyeOff,
  ListPlus,
  ListTodo,
  PlusSquareIcon,
} from 'lucide-react';
import React, { type HTMLAttributes, useState } from 'react';

import type { TasksTree } from '@agent/client';
import { Button, Spinner, cn } from '@agent/shadcn';
import { useAction, useData } from '@agent/ui';

import * as FolderTree from '../components/FolderTree';
import { Title } from '../components/Title.tsx';

const TasksView: React.FC = () => {
  const sync = useAction('POST /tasks/sync', {
    invalidate: ['GET /tasks/tree'],
  });

  const { data: taskTree, isLoading: isLoadingTree } =
    useData('GET /tasks/tree');
  const defaultExpanded = taskTree
    ?.map((list) => [list.id, ...list.tasks.map((task) => task.id)])
    .flat();

  if (isLoadingTree) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-gray-500">Loading task lists...</p>
      </div>
    );
  }

  if (!taskTree || taskTree.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-gray-500">No task lists found</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <div className="container mx-auto px-4">
        <Title>Tasks</Title>
      </div>
      <div className="container mx-auto px-4">
        <FolderTree.Root defaultExpanded={defaultExpanded}>
          {taskTree.map((taskList) => (
            <TaskListItem key={taskList.id} taskList={taskList} />
          ))}
        </FolderTree.Root>
      </div>
    </div>
  );
};

const TaskListItem: React.FC<{
  taskList: TasksTree[number];
}> = ({ taskList }) => {
  const expansion = FolderTree.useExpansion();
  const [isAdding, setIsAdding] = useState(false);
  const [showCompletedTasks, setShowCompletedTasks] = useState(false);
  const addTaskMutation = useAction('POST /taskslists/{taskListId}/tasks', {
    invalidate: ['GET /tasks/tree'],
  });

  const handleAddTask = (title: string) => {
    if (title.trim()) {
      addTaskMutation.mutate({
        title: title.trim(),
        taskListId: taskList.id,
      });
    }
    setIsAdding(false);
  };

  return (
    <FolderTree.Item
      hasChildren={true}
      id={taskList.id}
      label={() => taskList.title}
      icon={<ListTodo size={16} />}
      badge={
        <ControlPanel
          className="pointer-events-none opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100"
          onAdd={() => {
            setIsAdding(true);
            if (!expansion.expandedIds.has(taskList.id)) {
              expansion.toggleExpanded(taskList.id);
            }
          }}
          completedOn={showCompletedTasks}
          onToggleCompleted={() => setShowCompletedTasks((v) => !v)}
          hasChildren={true}
        />
      }
    >
      <FolderTree.Content>
        {isAdding && (
          <NewTaskInput
            onSave={handleAddTask}
            onCancel={() => setIsAdding(false)}
          />
        )}
        {Array.isArray(taskList.tasks) &&
          taskList.tasks
            .filter((task): task is TasksTree[number]['tasks'][number] =>
              Boolean(task?.id),
            )
            .filter((task) =>
              showCompletedTasks ? true : task.status !== 'completed',
            ).length === 0 &&
          !isAdding && (
            <div className="py-2 pl-8 text-sm text-gray-500">
              No tasks in this list
            </div>
          )}
        {Array.isArray(taskList.tasks) &&
          taskList.tasks
            .filter((task): task is TasksTree[number]['tasks'][number] =>
              Boolean(task?.id),
            )
            .filter((task) =>
              showCompletedTasks ? true : task.status !== 'completed',
            )
            .map((task) => <TaskItem key={task.id} task={task} />)}
      </FolderTree.Content>
    </FolderTree.Item>
  );
};

const TaskItem: React.FC<{
  task: TasksTree[number]['tasks'][number];
}> = ({ task }) => {
  const expansion = FolderTree.useExpansion();
  const hasSubtasks = Array.isArray(task.subtasks) && task.subtasks.length > 0;
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const [showCompletedSubtasks, setShowCompletedSubtasks] = useState(false);

  const addSubtaskMutation = useAction('POST /tasks/{taskId}/subtasks', {
    invalidate: ['GET /tasks/tree'],
  });

  const updateTaskMutation = useAction('PATCH /tasks/{taskId}', {
    invalidate: ['GET /tasks/tree'],
  });

  const handleAddSubtask = (title: string) => {
    if (title.trim()) {
      addSubtaskMutation.mutate({
        title: title.trim(),
        taskId: task.id,
      });
    }
    setIsAddingSubtask(false);
  };

  const handleUpdateTitle = (title: string) => {
    if (title.trim()) {
      updateTaskMutation.mutate({
        taskId: task.id,
        title: title.trim(),
      });
    }
  };

  const handleUpdateNotes = (notes: string) => {
    updateTaskMutation.mutate({
      taskId: task.id,
      notes: notes.trim(),
    });
  };

  const hasChildren = hasSubtasks || isAddingSubtask;

  return (
    <FolderTree.Item
      hasChildren={hasChildren}
      id={task.id}
      thumbnailClass="ml-4"
      icon={
        hasSubtasks ? <ListPlus size={16} /> : <TaskPrefixButton item={task} />
      }
      label={() => (
        <ItemLabel
          title={task.title}
          status={task.status}
          notes={task.notes ?? undefined}
          onUpdateTitle={handleUpdateTitle}
          onUpdateNotes={handleUpdateNotes}
        />
      )}
      emptyCollapse={<span className="mr-2 min-w-3"></span>}
      badge={
        <ControlPanel
          hasChildren={hasChildren}
          className="pointer-events-none opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100"
          onAdd={() => {
            setIsAddingSubtask(true);
            if (!expansion.expandedIds.has(task.id)) {
              expansion.toggleExpanded(task.id);
            }
          }}
          completedOn={showCompletedSubtasks}
          onToggleCompleted={() => setShowCompletedSubtasks((v) => !v)}
        />
      }
    >
      {(hasSubtasks || isAddingSubtask) && (
        <FolderTree.Content>
          {isAddingSubtask && (
            <NewSubTaskInput
              onSave={handleAddSubtask}
              onCancel={() => setIsAddingSubtask(false)}
            />
          )}
          {hasSubtasks &&
            task.subtasks
              .filter(
                (
                  subtask,
                ): subtask is TasksTree[number]['tasks'][number]['subtasks'][number] =>
                  Boolean(subtask?.id),
              )
              .filter((subtask) =>
                showCompletedSubtasks ? true : subtask.status !== 'completed',
              )
              .map((subtask) => (
                <SubtaskItem key={subtask.id} subtask={subtask} />
              ))}
        </FolderTree.Content>
      )}
    </FolderTree.Item>
  );
};

const SubtaskItem: React.FC<{
  subtask: TasksTree[number]['tasks'][number]['subtasks'][number];
}> = ({ subtask }) => {
  const updateSubtaskMutation = useAction('PATCH /subtasks/{subtaskId}', {
    invalidate: ['GET /tasks/tree'],
  });

  const handleUpdateTitle = (title: string) => {
    if (title.trim()) {
      updateSubtaskMutation.mutate({
        subtaskId: subtask.id,
        title: title.trim(),
      });
    }
  };

  const handleUpdateNotes = (notes: string) => {
    updateSubtaskMutation.mutate({
      subtaskId: subtask.id,
      notes: notes.trim(),
    });
  };

  return (
    <FolderTree.Item
      className="flex items-center"
      hasChildren={false}
      id={subtask.id}
      icon={<SubtaskPrefixButton item={subtask} />}
      label={() => (
        <ItemLabel
          title={subtask.title}
          status={subtask.status}
          notes={subtask.notes ?? undefined}
          onUpdateTitle={handleUpdateTitle}
          onUpdateNotes={handleUpdateNotes}
        />
      )}
    />
  );
};

function ControlPanel({
  onAdd,
  completedOn,
  onToggleCompleted,
  hasChildren,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  onAdd?: () => void;
  completedOn: boolean;
  onToggleCompleted: () => void;
  hasChildren?: boolean;
}) {
  return (
    <div {...props} className={cn('mr-2 ml-auto', props.className)}>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-7 rounded-full hover:border"
        title="Add task"
        onClick={(e) => {
          e.stopPropagation();
          onAdd?.();
        }}
      >
        <PlusSquareIcon />
      </Button>
      {hasChildren && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="size-7 rounded-full hover:border"
          onClick={(e) => {
            e.stopPropagation();
            onToggleCompleted();
          }}
          title={completedOn ? 'Hide completed' : 'Show completed'}
        >
          {completedOn ? (
            <span className="flex items-center gap-2">
              <EyeOff className="size-4" />
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Eye className="size-4" />
            </span>
          )}
        </Button>
      )}
    </div>
  );
}

const NewTaskInput: React.FC<{
  onSave: (title: string) => void;
  onCancel: () => void;
}> = ({ onSave, onCancel }) => {
  const [title, setTitle] = useState('');
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleBlur = () => {
    if (title.trim()) {
      onSave(title);
    } else {
      onCancel();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleBlur();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  return (
    <FolderTree.Item
      hasChildren={false}
      id={`new-task-${Date.now()}`}
      icon={<Circle />}
      emptyCollapse={<span className="min-w-3"></span>}
      label={() => (
        <input
          ref={inputRef}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          onClick={(e) => e.stopPropagation()}
          placeholder="New task..."
          className="w-full bg-transparent outline-none"
        />
      )}
    />
  );
};

const NewSubTaskInput: React.FC<{
  onSave: (title: string) => void;
  onCancel: () => void;
}> = ({ onSave, onCancel }) => {
  const [title, setTitle] = useState('');
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleBlur = () => {
    if (title.trim()) {
      onSave(title);
    } else {
      onCancel();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleBlur();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  return (
    <FolderTree.Item
      hasChildren={false}
      id={`new-task-${Date.now()}`}
      icon={<CircleDot size={16} />}
      emptyCollapse={<span className="mr-2 min-w-3"></span>}
      label={() => (
        <input
          ref={inputRef}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          onClick={(e) => e.stopPropagation()}
          placeholder="New task..."
          className="w-full bg-transparent outline-none"
        />
      )}
    />
  );
};

export default TasksView;

function SubtaskPrefixButton({
  item,
}: {
  item: TasksTree[number]['tasks'][number]['subtasks'][number];
}) {
  const completeMutation = useAction('POST /subtasks/{subtaskId}/complete', {
    invalidate: ['GET /tasks/tree'],
  });
  const uncompleteMutation = useAction(
    'POST /subtasks/{subtaskId}/uncomplete',
    {
      invalidate: ['GET /tasks/tree'],
    },
  );
  return (
    <div className="relative size-4">
      {item.status === 'completed' ? (
        <CircleCheckBig
          className="absolute inset-0 opacity-100 hover:opacity-0"
          size={16}
        />
      ) : (
        <CircleDot
          className="absolute inset-0 opacity-100 hover:opacity-0"
          size={16}
        />
      )}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute inset-0 size-4 p-0 opacity-0 hover:opacity-100"
        disabled={completeMutation.isPending || uncompleteMutation.isPending}
        onClick={(e) => {
          e.stopPropagation();
          if (item.status === 'completed') {
            uncompleteMutation.mutate({ subtaskId: item.id });
          } else {
            completeMutation.mutate({ subtaskId: item.id });
          }
        }}
      >
        {completeMutation.isPending || uncompleteMutation.isPending ? (
          <Spinner />
        ) : item.status === 'completed' ? (
          <CircleDot size={16} />
        ) : (
          <CircleCheckBig size={16} />
        )}
      </Button>
    </div>
  );
}

function TaskPrefixButton({
  item,
}: {
  item: TasksTree[number]['tasks'][number];
}) {
  const completeMutation = useAction('POST /tasks/{taskId}/complete', {
    invalidate: ['GET /tasks/tree'],
  });
  const uncompleteMutation = useAction('POST /tasks/{taskId}/uncomplete', {
    invalidate: ['GET /tasks/tree'],
  });
  return (
    <div className="relative size-4">
      {item.status === 'completed' ? (
        <CircleCheckBig
          className="absolute inset-0 opacity-100 hover:opacity-0"
          size={16}
        />
      ) : (
        <CircleDot
          className="absolute inset-0 opacity-100 hover:opacity-0"
          size={16}
        />
      )}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute inset-0 size-4 p-0 opacity-0 hover:opacity-100"
        disabled={completeMutation.isPending || uncompleteMutation.isPending}
        onClick={(e) => {
          e.stopPropagation();
          if (item.status === 'completed') {
            uncompleteMutation.mutate({ taskId: item.id });
          } else {
            completeMutation.mutate({ taskId: item.id });
          }
        }}
      >
        {completeMutation.isPending || uncompleteMutation.isPending ? (
          <Spinner />
        ) : item.status === 'completed' ? (
          <CircleDot size={16} />
        ) : (
          <CircleCheckBig size={16} />
        )}
      </Button>
    </div>
  );
}

const EditableField: React.FC<{
  value: string;
  onSave: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  className?: string;
}> = ({ value, onSave, placeholder, multiline = false, className }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    setEditValue(value);
  }, [value]);

  React.useEffect(() => {
    if (isEditing) {
      if (multiline) {
        textareaRef.current?.focus();
      } else {
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    }
  }, [isEditing, multiline]);

  const handleSave = () => {
    if (editValue.trim() !== value.trim()) {
      onSave(editValue.trim());
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  if (isEditing) {
    if (multiline) {
      return (
        <textarea
          ref={textareaRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          onClick={(e) => e.stopPropagation()}
          placeholder={placeholder}
          className={cn(
            'w-full bg-transparent outline-none resize-none',
            className,
          )}
          rows={2}
        />
      );
    }

    return (
      <input
        ref={inputRef}
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        onClick={(e) => e.stopPropagation()}
        placeholder={placeholder}
        className={cn('w-full bg-transparent outline-none', className)}
      />
    );
  }

  return (
    <span
      onClick={(e) => {
        e.stopPropagation();
        setIsEditing(true);
      }}
      className={cn('cursor-text', className)}
    >
      {value || placeholder}
    </span>
  );
};

function ItemLabel({
  status,
  title,
  notes,
  onUpdateTitle,
  onUpdateNotes,
}: {
  status: string;
  title: string;
  notes?: string;
  onUpdateTitle: (title: string) => void;
  onUpdateNotes: (notes: string) => void;
}) {
  return (
    <div className={cn(status === 'completed' && 'opacity-60')}>
      <p className={cn(status === 'completed' && 'line-through')}>
        <EditableField
          value={title}
          onSave={onUpdateTitle}
          placeholder="Task title..."
        />
      </p>
      <span
        className={cn(
          'text-muted-foreground text-xs block',
          !notes && 'opacity-0 hover:opacity-100',
        )}
      >
        <EditableField
          value={notes || ''}
          onSave={onUpdateNotes}
          placeholder="Add notes..."
          multiline
          className="text-xs"
        />
      </span>
    </div>
  );
}
