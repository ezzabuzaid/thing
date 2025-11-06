import { useSearchParams } from 'react-router';

export function useRunId() {
  const [searchParams, setSearchParams] = useSearchParams();
  return [
    searchParams.get('runId'),
    (runId: string | null) => {
      setSearchParams((params) => {
        if (runId) {
          params.set('runId', runId);
        } else {
          params.delete('runId');
        }
        return params;
      });
    },
  ] as const;
}

export function useScheduleId() {
  const [searchParams, setSearchParams] = useSearchParams();
  return [
    searchParams.get('id'),
    (scheduleId: string | null, runId?: string | null) => {
      setSearchParams((params) => {
        if (scheduleId) {
          params.set('id', scheduleId);
          if (runId) {
            params.set('runId', runId);
          } else {
            params.delete('runId');
          }
        } else {
          params.delete('id');
          params.delete('runId');
        }
        return params;
      });
    },
  ] as const;
}
