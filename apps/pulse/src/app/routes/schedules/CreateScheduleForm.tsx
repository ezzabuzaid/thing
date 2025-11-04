import { useForm } from '@tanstack/react-form';
import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  Label,
  Spinner,
  Textarea,
  buttonVariants,
  cn,
} from '@thing/shadcn';
import {
  FieldMessage,
  FormMessage,
  errorToFormIssue,
  useAction,
} from '@thing/ui';
import React from 'react';
import { useSearchParams } from 'react-router';
import { z } from 'zod';

import SelectorChips from '../../components/ChipSelector.tsx';
import { CronBuilder } from '../../components/CronBuilder.tsx';
import { useConnectors } from '../../hooks/useConnectors.ts';

const createScheduleSchema = z.object({
  title: z.string().min(1, { message: 'Title is required' }),
  cron: z.string().min(1, { message: 'Schedule is required' }),
  instructions: z.string().min(1, { message: 'Instructions are required' }),
  connectors: z.array(z.string()),
  enabled: z.boolean(),
});
export default function CreateScheduleForm() {
  const createMutation = useAction('POST /schedules', {
    invalidate: ['GET /schedules'],
  });
  const [, setSearchParams] = useSearchParams();
  const connectorsQuery = useConnectors();
  const [open, setOpen] = React.useState(false);

  const form = useForm({
    defaultValues: {
      title: '',
      cron: '',
      instructions: '',
      connectors: [] as string[],
      enabled: true,
    },
    validators: {
      onSubmit: createScheduleSchema,
      onSubmitAsync: async ({ value }) => {
        try {
          const created = await createMutation.mutateAsync({
            title: value.title.trim(),
            cron: value.cron.trim(),
            instructions: value.instructions.trim(),
            enabled: value.enabled,
            connectors: value.connectors,
          });
          setSearchParams({ id: created.id });
          setOpen(false);
          form.reset();
          return;
        } catch (error) {
          return errorToFormIssue(error);
        }
      },
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className={buttonVariants({
          variant: 'secondary',
          size: 'sm',
        })}
      >
        New schedule
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Create Schedule</DialogTitle>
          <DialogDescription>
            Create a new schedule for your tasks.
          </DialogDescription>
        </DialogHeader>

        <form
          className="grid gap-4"
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
                <Label
                  htmlFor="create-sched-title"
                  className="min-w-20 font-medium"
                >
                  Title
                </Label>
                <div className="flex-1 space-y-2">
                  <Input
                    id="create-sched-title"
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
              <div className="grid gap-4">
                <CronBuilder
                  value={field.state.value}
                  onChange={(cron) => field.handleChange(cron)}
                />
                {/* <div className="text-muted-foreground text-xs">
                  Cron preview: {field.state.value}
                </div> */}
                <FieldMessage errors={field.state.meta.errors} />
              </div>
            )}
          />

          <form.Field
            name="instructions"
            children={(field) => (
              <div className="grid gap-2">
                <Label
                  htmlFor="create-sched-instructions"
                  className="font-medium"
                >
                  Instructions
                </Label>
                <Textarea
                  id="create-sched-instructions"
                  placeholder="Describe what this schedule should do..."
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-label="Schedule instructions"
                  rows={3}
                  className="max-h-40 min-h-40"
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

          <form.Subscribe
            selector={(state) => state.errors}
            children={(errors) => <FormMessage errors={errors} />}
          />

          <DialogFooter>
            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
              children={([canSubmit, isSubmitting]) => (
                <div className="flex items-center gap-2">
                  <Button type="submit" disabled={!canSubmit || isSubmitting}>
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <Spinner /> Creating…
                      </span>
                    ) : (
                      'Create'
                    )}
                  </Button>
                  <DialogClose
                    className={cn(buttonVariants({ variant: 'ghost' }))}
                  >
                    Cancel
                  </DialogClose>
                </div>
              )}
            />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
