import { useData } from '@thing/ui';

export function useConnectors() {
  return useData('GET /schedules/connectors', {}, { staleTime: Infinity }).data;
}
