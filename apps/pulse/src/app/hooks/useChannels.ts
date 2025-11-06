import { useData } from '@thing/ui';

export function useChannels() {
  return useData('GET /schedules/channels', {}, { staleTime: Infinity }).data;
}
