import { useForm } from '@tanstack/react-form';
import type { GetScheduleById } from '@thing/client';
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Separator,
  Spinner,
  Textarea,
} from '@thing/shadcn';
import {
  FieldMessage,
  FormMessage,
  errorToFormIssue,
  useAction,
} from '@thing/ui';
import { Upload, X } from 'lucide-react';
import React from 'react';
import { z } from 'zod';

import SelectorChips from '../../components/ChipSelector.tsx';
import { CronBuilder } from '../../components/CronBuilder.tsx';
import { IconButton } from '../../components/IconButton.tsx';
import { useConnectors } from '../../hooks/useConnectors.ts';

const publishToMarketplaceSchema = z.object({
  title: z.string().min(1, { message: 'Title is required' }),
  cron: z.string().min(1, { message: 'Schedule is required' }),
  instructions: z.string().min(1, { message: 'Instructions are required' }),
  connectors: z.array(z.string()),
  description: z.string().min(1, { message: 'Description is required' }),
  tags: z.array(z.string()).min(1, { message: 'At least one tag is required' }),
});

export default function PublishToMarketplaceButton({
  schedule,
}: {
  schedule: GetScheduleById;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <IconButton
        title="Publish to marketplaces"
        onClick={() => setOpen(true)}
        icon={Upload}
      />

      <PublishToMarketplaceDialog
        schedule={schedule}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}

function PublishToMarketplaceDialog({
  schedule,
  open,
  onOpenChange,
}: {
  schedule: GetScheduleById;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const publish = useAction(
    'POST /schedules/{scheduleId}/publish-to-marketplace',
    {
      invalidate: ['GET /marketplace/templates'],
    },
  );
  const connectorsQuery = useConnectors();
  const [tagInput, setTagInput] = React.useState('');

  const form = useForm({
    defaultValues: {
      title: schedule.title,
      cron: schedule.cron,
      instructions: schedule.instructions,
      connectors: schedule.connectors,
      description: '',
      tags: [] as string[],
    },
    validators: {
      onSubmit: publishToMarketplaceSchema,
      onSubmitAsync: async ({ value }) => {
        try {
          await publish.mutateAsync({
            scheduleId: schedule.id,
            title: value.title.trim(),
            instructions: value.instructions.trim(),
            suggestedCron: value.cron.trim(),
            connectors: value.connectors,
            description: value.description.trim(),
            tags: value.tags,
          });
          onOpenChange(false);
          // Reset form
          form.reset();
          setTagInput('');
          return;
        } catch (error) {
          return errorToFormIssue(error);
        }
      },
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Publish to Marketplace</DialogTitle>
          <p className="text-muted-foreground text-sm">
            Review and customize your schedule before sharing it with the
            community
          </p>
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
                <Label htmlFor="title" className="min-w-20 font-medium">
                  Title
                </Label>
                <Input
                  id="title"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Enter schedule title"
                />
                <FieldMessage errors={field.state.meta.errors} />
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
                <Label htmlFor="instructions">Instructions</Label>
                <Textarea
                  id="instructions"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Enter schedule instructions"
                  rows={6}
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

          <Separator />

          <form.Field
            name="description"
            children={(field) => (
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Describe what this schedule does and who it's for..."
                  rows={4}
                />
                <p className="text-muted-foreground text-xs">
                  Help others understand when and why to use this schedule
                </p>
                <FieldMessage errors={field.state.meta.errors} />
              </div>
            )}
          />

          <form.Field
            name="tags"
            children={(field) => {
              const handleAddTag = () => {
                const trimmed = tagInput.trim();
                const currentTags = field.state.value;
                if (
                  trimmed &&
                  currentTags.length < 3 &&
                  !currentTags.includes(trimmed)
                ) {
                  field.handleChange([...currentTags, trimmed]);
                  setTagInput('');
                }
              };

              const handleRemoveTag = (tag: string) => {
                field.handleChange(field.state.value.filter((t) => t !== tag));
              };

              return (
                <div className="grid gap-2">
                  <Label htmlFor="tags">Tags</Label>
                  <div className="flex gap-2">
                    <Input
                      id="tags"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                      placeholder="e.g. productivity, news, automation"
                      disabled={field.state.value.length >= 3}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleAddTag}
                      disabled={
                        field.state.value.length >= 3 || !tagInput.trim()
                      }
                    >
                      Add
                    </Button>
                  </div>
                  {field.state.value.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {field.state.value.map((tag) => (
                        <Badge key={tag} variant="secondary" className="gap-1">
                          {tag}
                          <X
                            className="size-3 cursor-pointer"
                            onClick={() => handleRemoveTag(tag)}
                          />
                        </Badge>
                      ))}
                    </div>
                  )}
                  <p className="text-muted-foreground text-xs">
                    {field.state.value.length}/3 tags added
                  </p>
                  <FieldMessage errors={field.state.meta.errors} />
                </div>
              );
            }}
          />

          <Separator />

          <form.Subscribe
            selector={(state) => state.errors}
            children={(errors) => <FormMessage errors={errors} />}
          />

          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
            children={([canSubmit, isSubmitting]) => (
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={!canSubmit || isSubmitting}>
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <Spinner className="size-4" /> Publishing…
                    </span>
                  ) : (
                    'Publish to Marketplace'
                  )}
                </Button>
              </div>
            )}
          />
        </form>
      </DialogContent>
    </Dialog>
  );
}
