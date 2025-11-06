import type { ListSchedules } from '@thing/client';
import {
  Badge,
  Card,
  Drawer,
  DrawerContent,
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
  useIsMobile,
} from '@thing/shadcn';
import { useData } from '@thing/ui';
import { CalendarSync, StoreIcon } from 'lucide-react';
import { Link, useSearchParams } from 'react-router';

import { NavUserDropdown } from '../../components/NavUserDropdown.tsx';
import { cronTitle, formatRelativeTime } from '../../logic/time.ts';
import CreateScheduleForm from './CreateScheduleForm.tsx';
import { DetailsPane } from './ScheduleDetails.tsx';
import {
  FREQUENCY_ORDER,
  getFrequencyLabel,
  groupSchedulesByFrequency,
} from './utils/parseCronFrequency.ts';

export default function Schedules() {
  const { data, isLoading } = useData('GET /schedules');
  const [searchParams, setSearchParams] = useSearchParams();
  const isMobile = useIsMobile();

  const selectedId = searchParams.get('id') ?? null;

  if (isMobile) {
    return (
      <ScheduleMobile
        data={data}
        isLoading={isLoading}
        selectedId={selectedId}
        onSelect={(id) => setSearchParams({ id })}
        onClose={() => setSearchParams({})}
      />
    );
  }

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
          <Separator />
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
        <DetailsPane
          selectedId={selectedId}
          className="mx-auto w-full max-w-4xl"
        />
      </SidebarInset>
    </SidebarProvider>
  );
}

function ScheduleMobile({
  data,
  isLoading,
  selectedId,
  onSelect,
  onClose,
}: {
  data: ListSchedules | undefined;
  isLoading: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b p-4">
        <div className="flex items-center gap-2">
          <CalendarSync className="size-6" />
          <h1 className="text-lg font-semibold">Schedules</h1>
        </div>
        <CreateScheduleForm />
      </div>

      {/* Schedules Grid */}
      <div className="flex-1 overflow-auto p-4">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <span className="text-muted-foreground flex items-center gap-2 text-sm">
              <Spinner /> Loading schedules…
            </span>
          </div>
        ) : data?.records.length === 0 ? (
          <div className="text-muted-foreground flex h-full items-center justify-center p-4 text-center text-sm">
            No schedules yet
          </div>
        ) : (
          <SchedulesGrid schedules={data?.records ?? []} onSelect={onSelect} />
        )}
      </div>

      {/* Footer */}
      <div className="border-t p-4">
        <Link
          to="/marketplace"
          className={buttonVariants({
            variant: 'outline',
            className: 'mb-3 w-full',
          })}
        >
          <StoreIcon className="mr-2 size-4" />
          Marketplace
        </Link>
        {/* <SidebarMenu className="rounded-lg border">
          <SidebarMenuItem>
            <NavUserDropdown />
          </SidebarMenuItem>
        </SidebarMenu> */}
        <Separator className="my-3" />
        <div className="text-muted-foreground flex items-center justify-center gap-2 text-xs">
          <Link to="/legal/privacy-policy" className="hover:underline">
            Privacy Policy
          </Link>
          <Separator orientation="vertical" className="h-4" />
          <Link to="/legal/terms-services" className="hover:underline">
            Terms of Service
          </Link>
        </div>
      </div>

      {/* Bottom Drawer for Schedule Details */}
      <Drawer open={!!selectedId} onOpenChange={(open) => !open && onClose()}>
        <DrawerContent className="max-h-[85vh]">
          <DetailsPane selectedId={selectedId} />
        </DrawerContent>
      </Drawer>
    </div>
  );
}

function SchedulesGrid({
  schedules,
  onSelect,
}: {
  schedules: ListSchedules['records'];
  onSelect: (id: string) => void;
}) {
  const groupedSchedules = groupSchedulesByFrequency(schedules);

  return (
    <div className="space-y-6">
      {FREQUENCY_ORDER.map((frequency) => {
        const frequencySchedules = groupedSchedules[frequency];

        if (frequencySchedules.length === 0) return null;

        return (
          <div key={frequency} className="space-y-3">
            <h2 className="text-muted-foreground text-sm font-semibold">
              {getFrequencyLabel(frequency)}
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {frequencySchedules.map((schedule) => (
                <Card
                  key={schedule.id}
                  className="hover:bg-accent cursor-pointer rounded-2xl p-4 transition-colors"
                  onClick={() => onSelect(schedule.id)}
                >
                  <div className="space-y-2">
                    {/* Title and Status */}
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="leading-tight font-medium">
                        {schedule.title}
                      </h3>
                      {!schedule.enabled && (
                        <Badge variant="secondary" className="shrink-0">
                          Paused
                        </Badge>
                      )}
                    </div>

                    {/* Cron Description */}
                    <p className="text-muted-foreground text-xs">
                      {cronTitle(schedule.cron)}
                    </p>

                    {/* Last Run */}
                    {schedule.runs?.[0] ? (
                      <p className="text-muted-foreground text-xs">
                        Last run {formatRelativeTime(schedule.runs?.[0].runAt)}
                      </p>
                    ) : (
                      <p className="text-muted-foreground text-xs">
                        No runs yet
                      </p>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );
      })}
    </div>
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
