import type { ListSchedules } from '@thing/client';
import {
  Badge,
  Separator,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  Spinner,
  buttonVariants,
} from '@thing/shadcn';
import { useData } from '@thing/ui';
import { CalendarSync, StoreIcon } from 'lucide-react';
import { Link, useSearchParams } from 'react-router';

import { NavUserDropdown } from '../../components/NavUserDropdown.tsx';
import { cronTitle } from '../../logic/time.ts';
import CreateScheduleForm from './CreateScheduleForm.tsx';
import { DetailsPane } from './ScheduleDetails.tsx';
import {
  FREQUENCY_ORDER,
  getFrequencyLabel,
  groupSchedulesByFrequency,
} from './utils/parseCronFrequency.ts';

export default function SchedulesV2() {
  const { data, isLoading } = useData('GET /schedules');
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedId = searchParams.get('id') ?? null;

  return (
    <SidebarProvider>
      <Sidebar variant="inset" className="p-3">
        <SidebarHeader className="px-4">
          <div className="flex items-center justify-between">
            <CalendarSync className="size-6" />
            <CreateScheduleForm />
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SchedulesList
            response={data}
            isLoading={isLoading}
            selectedId={selectedId}
            onSelect={(id) => {
              setSearchParams({ id });
            }}
          />
        </SidebarContent>
        <SidebarFooter>
          <Separator />
          <Link
            to="/marketplace"
            className={buttonVariants({
              variant: 'outline',
              className: 'mb-2 w-full',
            })}
          >
            <StoreIcon className="mr-2 size-4" />
            Marketplace
          </Link>

          <SidebarMenu className="rounded-lg border">
            <SidebarMenuItem>
              <NavUserDropdown />
            </SidebarMenuItem>
          </SidebarMenu>
          <div className="text-muted-foreground flex items-center justify-center gap-2 text-xs">
            <Link to="/legal/privacy-policy" className="hover:underline">
              Privacy Policy
            </Link>
            <Separator orientation="vertical" className="h-4" />
            <Link to="/legal/terms-services" className="hover:underline">
              Terms of Service
            </Link>
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <DetailsPane selectedId={selectedId} className="mx-auto max-w-4xl" />
      </SidebarInset>
    </SidebarProvider>
  );
}

function SchedulesList({
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
      <div className="text-muted-foreground flex h-full items-center justify-center p-4 text-center text-sm">
        No schedules yet
      </div>
    );
  }

  // Group schedules by frequency
  const groupedSchedules = groupSchedulesByFrequency(records);

  return (
    <>
      {FREQUENCY_ORDER.map((frequency) => {
        const schedules = groupedSchedules[frequency];

        // Skip empty frequency groups
        if (schedules.length === 0) return null;

        return (
          <SidebarGroup key={frequency}>
            <SidebarGroupLabel>
              {getFrequencyLabel(frequency)}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {schedules.map((schedule) => (
                  <SidebarMenuItem key={schedule.id}>
                    <SidebarMenuButton
                      isActive={selectedId === schedule.id}
                      onClick={() => onSelect(schedule.id)}
                      className="h-auto flex-col items-start gap-0"
                    >
                      <div className="flex w-full items-center gap-2">
                        <span className="flex-1 truncate font-medium">
                          {schedule.title}
                        </span>
                        {!schedule.enabled && (
                          <Badge variant="default" className="ml-auto">
                            Paused
                          </Badge>
                        )}
                      </div>
                      <span className="text-muted-foreground truncate text-[10px]">
                        {cronTitle(schedule.cron)}
                      </span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        );
      })}
    </>
  );
}
