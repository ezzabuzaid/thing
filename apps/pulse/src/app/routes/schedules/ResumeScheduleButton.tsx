import { Button, Spinner } from '@thing/shadcn';
import { useAction } from '@thing/ui';
import { Play } from 'lucide-react';

export default function ResumeScheduleButton({
  id,
  className,
  title = 'Resume',
  stopPropagation = true,
}: {
  id: string;
  className?: string;
  title?: string;
  stopPropagation?: boolean;
}) {
  const action = useAction('POST /schedules/{id}/resume', {
    invalidate: ['GET /schedules', 'GET /schedules/{id}'],
  });
  return (
    <Button
      type="button"
      size="icon"
      variant="ghost"
      className={className}
      aria-label={title}
      title={title}
      disabled={action.isPending}
      onClick={(e) => {
        if (stopPropagation) e.stopPropagation();
        action.mutate({ id });
      }}
    >
      {action.isPending ? (
        <Spinner className="size-4" />
      ) : (
        <Play className="size-4" />
      )}
    </Button>
  );
}
