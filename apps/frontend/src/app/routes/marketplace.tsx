import type {
  GetMarketplaceTemplateById,
  ListMarketplaceTemplates,
} from '@thing/client';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  ScrollArea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Spinner,
  Textarea,
} from '@thing/shadcn';
import { useAction, useData } from '@thing/ui';
import { Eye, Play, Search, Users } from 'lucide-react';
import React from 'react';
import { useNavigate } from 'react-router';

import SelectorChips from '../components/ChipSelector.tsx';
import { CronBuilder } from '../components/CronBuilder.tsx';
import { Title } from '../components/Title.tsx';

export default function MarketplacePage() {
  const [searchParams, setSearchParams] = React.useState({
    search: '',
    sort: 'featured' as 'featured' | 'trending' | 'installs' | 'newest',
    page: 1,
  });

  const templatesQuery = useData('GET /marketplace/templates', {
    search: searchParams.search || undefined,
    sort: searchParams.sort,
    page: searchParams.page,
    pageSize: 20,
  });

  const [selectedTemplate, setSelectedTemplate] = React.useState<string | null>(
    null,
  );

  return (
    <div className="flex h-full flex-col">
      <div className="border-b">
        <div className="p-4">
          <Title>Marketplace</Title>
          <p className="text-muted-foreground text-sm">
            Browse and install schedule templates from the community
          </p>
        </div>

        {/* Filters */}
        <div className="flex gap-2 px-4 pb-4">
          <div className="relative flex-1">
            <Search className="text-muted-foreground absolute top-1/2 left-2 size-4 -translate-y-1/2" />
            <Input
              placeholder="Search templates..."
              className="pl-8"
              value={searchParams.search}
              onChange={(e) =>
                setSearchParams((prev) => ({
                  ...prev,
                  search: e.target.value,
                  page: 1,
                }))
              }
            />
          </div>

          <Select
            value={searchParams.sort}
            onValueChange={(value: any) =>
              setSearchParams((prev) => ({ ...prev, sort: value, page: 1 }))
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="featured">Featured</SelectItem>
              <SelectItem value="trending">Trending</SelectItem>
              <SelectItem value="installs">Most Installed</SelectItem>
              <SelectItem value="newest">Newest</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Templates Grid */}
      <ScrollArea className="flex-1">
        <div className="grid gap-4 p-4 md:grid-cols-2 lg:grid-cols-3">
          {templatesQuery.isPending && (
            <div className="col-span-full flex justify-center py-8">
              <Spinner />
            </div>
          )}

          {templatesQuery.data?.records.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onClick={() => setSelectedTemplate(template.id)}
            />
          ))}

          {templatesQuery.data?.records.length === 0 && (
            <div className="text-muted-foreground col-span-full py-8 text-center">
              No templates found
            </div>
          )}
        </div>

        {/* Pagination */}
        {templatesQuery.data &&
          templatesQuery.data.pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2 p-4">
              <Button
                variant="outline"
                size="sm"
                disabled={!templatesQuery.data.pagination.hasPrev}
                onClick={() =>
                  setSearchParams((prev) => ({ ...prev, page: prev.page - 1 }))
                }
              >
                Previous
              </Button>
              <span className="flex items-center px-4 text-sm">
                Page {templatesQuery.data.pagination.page} of{' '}
                {templatesQuery.data.pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={!templatesQuery.data.pagination.hasNext}
                onClick={() =>
                  setSearchParams((prev) => ({ ...prev, page: prev.page + 1 }))
                }
              >
                Next
              </Button>
            </div>
          )}
      </ScrollArea>

      {/* Template Details Dialog */}
      {selectedTemplate && (
        <TemplateDetailsDialog
          templateId={selectedTemplate}
          open={!!selectedTemplate}
          onOpenChange={(open) => !open && setSelectedTemplate(null)}
        />
      )}
    </div>
  );
}

function TemplateCard({
  template,
  onClick,
}: {
  template: ListMarketplaceTemplates['records'][0];
  onClick: () => void;
}) {
  return (
    <Card
      className="cursor-pointer transition-shadow hover:shadow-md"
      onClick={onClick}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base">{template.title}</CardTitle>
          {template.isOfficial && (
            <Badge variant="secondary" className="shrink-0">
              Official
            </Badge>
          )}
        </div>
        <CardDescription className="line-clamp-2">
          {template.description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-1.5">
          {template.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>

        {template.connectors.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {template.connectors.slice(0, 3).map((connector) => (
              <span
                key={connector}
                className="bg-muted rounded-full px-2 py-0.5 text-xs"
              >
                {connector}
              </span>
            ))}
            {template.connectors.length > 3 && (
              <span className="bg-muted rounded-full px-2 py-0.5 text-xs">
                +{template.connectors.length - 3}
              </span>
            )}
          </div>
        )}

        <Separator className="my-3" />

        <div className="text-muted-foreground flex items-center justify-between text-xs">
          <div className="flex items-center gap-1">
            <Users className="size-3" />
            {template.author.name}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Eye className="size-3" />
              {template.viewCount}
            </div>
            <div className="flex items-center gap-1">
              <Play className="size-3" />
              {template.installCount}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TemplateDetailsDialog({
  templateId,
  open,
  onOpenChange,
}: {
  templateId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const templateQuery = useData('GET /marketplace/templates/{id}', {
    id: templateId,
  });

  const [showUseDialog, setShowUseDialog] = React.useState(false);

  if (!templateQuery.data) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const template = templateQuery.data;

  return (
    <>
      <Dialog open={open && !showUseDialog} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <div className="flex items-start justify-between gap-2">
              <DialogTitle>{template.title}</DialogTitle>
              {template.isOfficial && (
                <Badge variant="secondary">Official</Badge>
              )}
            </div>
            <DialogDescription>{template.description}</DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh]">
            <div className="grid gap-4">
              {/* Stats */}
              <div className="flex gap-4 text-sm">
                <div className="flex items-center gap-1.5">
                  <Users className="size-4" />
                  <span className="text-muted-foreground">By</span>
                  <span className="font-medium">{template.author.name}</span>
                </div>
                <Separator orientation="vertical" className="h-5" />
                <div className="flex items-center gap-1">
                  <Eye className="size-4" />
                  <span>{template.viewCount} views</span>
                </div>
                <div className="flex items-center gap-1">
                  <Play className="size-4" />
                  <span>{template.installCount} installs</span>
                </div>
              </div>

              <Separator />

              {/* Instructions */}
              <div className="grid gap-2">
                <Label className="text-sm font-semibold">Instructions</Label>
                <div className="bg-muted rounded-md p-3 text-sm">
                  {template.instructions}
                </div>
              </div>

              {/* Suggested Cron */}
              <div className="grid gap-2">
                <Label className="text-sm font-semibold">
                  Suggested Schedule
                </Label>
                <div className="rounded-md border p-2 text-sm">
                  <code className="text-muted-foreground text-xs">
                    {template.suggestedCron}
                  </code>
                </div>
              </div>

              {/* Connectors */}
              {template.connectors.length > 0 && (
                <div className="grid gap-2">
                  <Label className="text-sm font-semibold">
                    Required Connectors
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {template.connectors.map((connector) => (
                      <Badge key={connector} variant="outline">
                        {connector}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags */}
              {template.tags.length > 0 && (
                <div className="grid gap-2">
                  <Label className="text-sm font-semibold">Tags</Label>
                  <div className="flex flex-wrap gap-2">
                    {template.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <Separator />

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button onClick={() => setShowUseDialog(true)}>Use Schedule</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Use Schedule Dialog */}
      {showUseDialog && (
        <UseScheduleDialog
          template={template}
          open={showUseDialog}
          onOpenChange={(open) => {
            setShowUseDialog(open);
            if (!open) onOpenChange(false);
          }}
        />
      )}
    </>
  );
}

function UseScheduleDialog({
  template,
  open,
  onOpenChange,
}: {
  template: GetMarketplaceTemplateById;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const navigate = useNavigate();
  const create = useAction('POST /schedules', {
    invalidate: ['GET /schedules'],
  });

  const [title, setTitle] = React.useState(template.title);
  const [cron, setCron] = React.useState(template.suggestedCron);
  const [instructions, setInstructions] = React.useState(template.instructions);
  const [connectors, setConnectors] = React.useState<string[]>(
    template.connectors,
  );
  const [error, setError] = React.useState<string | null>(null);

  const connectorsQuery = useData('GET /schedules/connectors', {});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!title.trim() || !cron.trim() || !instructions.trim()) {
      setError('Please fill title, cron and instructions.');
      return;
    }
    create.mutate(
      {
        title: title.trim(),
        cron: cron.trim(),
        instructions: instructions.trim(),
        enabled: true,
        connectors,
      },
      {
        onSuccess: (created) => {
          onOpenChange(false);
          navigate(`/schedules?id=${created.id}`);
        },
        onError: (err: any) => {
          setError(err?.message ?? 'Failed to create schedule');
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Use Schedule Template</DialogTitle>
          <DialogDescription>
            Customize the schedule before creating it
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4">
          {error && (
            <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
              {error}
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter schedule title"
            />
          </div>

          <CronBuilder cron={cron} onCronChange={setCron} />

          <div className="grid gap-2">
            <Label htmlFor="instructions">Instructions</Label>
            <Textarea
              id="instructions"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Enter schedule instructions"
              rows={6}
            />
          </div>

          <div className="grid gap-2">
            <Label className="text-xs font-medium">Supported connectors</Label>
            <SelectorChips
              options={connectorsQuery.data?.connectors}
              value={connectors}
              onChange={(its) => setConnectors(its)}
            />
          </div>

          <Separator />

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={create.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? (
                <span className="flex items-center gap-2">
                  <Spinner className="size-4" /> Creating…
                </span>
              ) : (
                'Use Schedule'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
