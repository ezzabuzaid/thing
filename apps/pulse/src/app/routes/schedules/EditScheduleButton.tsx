import { useForm } from '@tanstack/react-form';
import type { GetScheduleById } from '@thing/client';
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  Input,
  Label,
  Spinner,
  Textarea,
  useIsMobile,
} from '@thing/shadcn';
import {
  FieldMessage,
  FormMessage,
  errorToFormIssue,
  useAction,
} from '@thing/ui';
import { Pencil } from 'lucide-react';
import React from 'react';
import { z } from 'zod';

import SelectorChips from '../../components/ChipSelector.tsx';
import { CronBuilder } from '../../components/CronBuilder.tsx';
import { useChannels } from '../../hooks/useChannels.ts';
import { useConnectors } from '../../hooks/useConnectors.ts';

export default function EditScheduleButton({
  schedule,
}: {
  schedule: GetScheduleById;
}) {
  const [open, setOpen] = React.useState(false);
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          <Button
            type="button"
            size="icon"
            variant="outline"
            aria-label="Edit schedule"
            title="Edit schedule"
          >
            <Pencil className="size-4" />
          </Button>
        </DrawerTrigger>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader>
            <DrawerTitle>Edit Schedule</DrawerTitle>
          </DrawerHeader>
          <div className="overflow-auto px-4">
            <EditScheduleForm
              schedule={schedule}
              onSuccess={() => setOpen(false)}
            />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          size="icon"
          variant="outline"
          aria-label="Edit schedule"
          title="Edit schedule"
        >
          <Pencil className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Edit Schedule</DialogTitle>
        </DialogHeader>
        <EditScheduleForm
          schedule={schedule}
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

const editScheduleSchema = z.object({
  title: z.string().min(1, { message: 'Title is required' }),
  cron: z.string().min(1, { message: 'Schedule is required' }),
  instructions: z.string().min(1, { message: 'Instructions are required' }),
  connectors: z.array(z.string()),
  channels: z.array(z.string()),
});

function EditScheduleForm({
  schedule,
  onSuccess,
}: {
  schedule: GetScheduleById;
  onSuccess: () => void;
}) {
  const update = useAction('PATCH /schedules/{id}', {
    invalidate: ['GET /schedules', 'GET /schedules/{id}'],
  });
  const connectorsQuery = useConnectors();
  const channelsQuery = useChannels();

  const form = useForm({
    defaultValues: {
      title: schedule.title,
      cron: schedule.cron,
      instructions: schedule.instructions,
      connectors: schedule.connectors ?? [],
      channels: schedule.channels ?? ['email'],
    },
    validators: {
      onSubmit: editScheduleSchema,
      onSubmitAsync: async ({ value }) => {
        try {
          await update.mutateAsync({
            id: schedule.id,
            title: value.title.trim(),
            cron: value.cron.trim(),
            instructions: value.instructions.trim(),
            connectors: value.connectors,
          });
          onSuccess();
          return;
        } catch (error) {
          return errorToFormIssue(error);
        }
      },
    },
  });

  return (
    <form
      className="grid gap-3"
      onSubmit={async (e) => {
        e.preventDefault();
        e.stopPropagation();
        await form.handleSubmit();
      }}
    >
      <form.Field
        name="title"
        children={(field) => (
          <div className="flex gap-4">
            <Label htmlFor="edit-sched-title" className="min-w-20 font-medium">
              Title
            </Label>
            <div className="flex-1">
              <Input
                id="edit-sched-title"
                placeholder="Weekly status email"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                aria-label="Schedule title"
                className="bg-transparent"
              />
              <FieldMessage errors={field.state.meta.errors} />
            </div>
          </div>
        )}
      />

      <form.Field
        name="cron"
        children={(field) => (
          <div>
            <CronBuilder
              value={field.state.value}
              onChange={(cron) => field.handleChange(cron)}
            />
            <FieldMessage errors={field.state.meta.errors} />
          </div>
        )}
      />

      <form.Field
        name="instructions"
        children={(field) => (
          <div className="grid gap-2">
            <Label htmlFor="edit-sched-instructions" className="font-medium">
              Instructions
            </Label>
            <Textarea
              id="edit-sched-instructions"
              placeholder="Describe what this schedule should do..."
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              aria-label="Schedule instructions"
              rows={3}
              className="max-h-48 min-h-48"
            />
            <FieldMessage errors={field.state.meta.errors} />
          </div>
        )}
      />

      <form.Field
        name="connectors"
        children={(field) => (
          <div className="grid gap-2">
            <Label className="font-medium">Supported connectors</Label>
            <SelectorChips
              options={connectorsQuery?.connectors}
              value={field.state.value}
              onChange={(its) => field.handleChange(its)}
            />
            <FieldMessage errors={field.state.meta.errors} />
          </div>
        )}
      />

      <form.Field
        name="channels"
        children={(field) => (
          <div className="grid gap-2">
            <Label className="font-medium">Notification channels</Label>
            <SelectorChips
              options={channelsQuery?.channels}
              value={field.state.value}
              onChange={(its) => field.handleChange(its)}
            />
            <FieldMessage errors={field.state.meta.errors} />
          </div>
        )}
      />

      <form.Subscribe
        selector={(state) => state.errors}
        children={(errors) => <FormMessage errors={errors} />}
      />

      <form.Subscribe
        selector={(state) => [state.canSubmit, state.isSubmitting]}
        children={([canSubmit, isSubmitting]) => (
          <div className="flex items-center gap-2">
            <Button type="submit" disabled={!canSubmit || isSubmitting}>
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <Spinner /> Updating…
                </span>
              ) : (
                'Update'
              )}
            </Button>
          </div>
        )}
      />
    </form>
  );
}
