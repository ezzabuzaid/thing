import { Button, Spinner } from '@thing/shadcn';
import { useAction } from '@thing/ui';
import { Pause } from 'lucide-react';

export default function PauseScheduleButton({
  id,
  className,
  title = 'Pause',
  stopPropagation = true,
}: {
  id: string;
  className?: string;
  title?: string;
  stopPropagation?: boolean;
}) {
  const action = useAction('POST /schedules/{id}/pause', {
    invalidate: ['GET /schedules', 'GET /schedules/{id}'],
  });
  return (
    <Button
      type="button"
      size="icon"
      variant="outline"
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
        <Pause className="size-4" />
      )}
    </Button>
  );
}
