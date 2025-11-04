import type { ListSchedules } from '@thing/client';
import { Badge, Spinner, cn } from '@thing/shadcn';
import { useData } from '@thing/ui';
import { useSearchParams } from 'react-router';

import { Title } from '../../components/Title.tsx';
import { cronTitle } from '../../logic/time.ts';
import CreateScheduleForm from './CreateScheduleForm.tsx';
import { DetailsPane } from './ScheduleDetails.tsx';

export default function Schedules() {
  const { data, isLoading } = useData('GET /schedules');
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedId = searchParams.get('id') ?? null;

  return (
    <div className="mx-auto h-full w-full px-4">
      <div className="grid h-full grid-cols-1 gap-4 md:grid-cols-7">
        <div className="col-span-2 col-start-1 flex h-full flex-col">
          <div className="flex items-center justify-between gap-2">
            <Title>Schedules</Title>
            <CreateScheduleForm />
          </div>
          <ListPane
            response={data}
            isLoading={isLoading}
            selectedId={selectedId}
            onSelect={(id) => {
              setSearchParams({ id });
            }}
          />
        </div>
        <div className="col-span-full col-start-3 flex h-full flex-col overflow-auto border-l">
          <DetailsPane selectedId={selectedId} />
        </div>
      </div>
    </div>
  );
}

function ListPane({
  response,
  isLoading,
  selectedId,
  onSelect,
}: {
  response: ListSchedules | undefined;
  isLoading: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <span className="text-muted-foreground flex items-center gap-2 text-sm">
          <Spinner /> Loading schedules…
        </span>
      </div>
    );
  }

  const records = response?.records ?? [];

  if (records.length === 0) {
    return (
      <div className="h-full overflow-auto">
        <div className="text-muted-foreground flex h-full items-center justify-center p-4 text-center text-sm">
          No schedules yet
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <ul className="space-y-2">
        {records.map((it) => (
          <li key={it.id}>
            <button
              type="button"
              onClick={() => onSelect(it.id)}
              aria-label={`Open schedule ${it.title}`}
              className={cn(
                'hover:bg-muted/60 w-full rounded-sm border px-4 py-3 text-left transition-colors',
                selectedId === it.id ? 'bg-muted' : '',
              )}
            >
              <div className="flex items-center gap-2">
                <div className="flex min-w-0 flex-col">
                  <span className="truncate font-medium">{it.title}</span>
                  <span className="text-muted-foreground truncate text-xs">
                    {cronTitle(it.cron)}
                  </span>
                </div>
                {!it.enabled && (
                  <Badge variant={'default'} className="ml-auto">
                    Paused
                  </Badge>
                )}
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
