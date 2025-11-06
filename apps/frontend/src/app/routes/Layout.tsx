import {
  Separator,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from '@thing/shadcn';
import {
  Bell,
  DollarSign,
  GalleryVerticalEnd,
  Handshake,
  LibraryBig,
  ListTodo,
  type LucideIcon,
  Repeat,
} from 'lucide-react';
import { Outlet } from 'react-router';

import { NavUserDropdown } from '../components/NavUserDropdown.tsx';

type SidebarItem = {
  name: string;
  url: string;
  icon: LucideIcon;
};
const sidebar: SidebarItem[] = [
  {
    name: 'Faye',
    url: '/',
    icon: Handshake,
  },
  {
    name: 'Tasks',
    url: 'tasks',
    icon: ListTodo,
  },
  {
    name: 'Schedules',
    url: 'schedules',
    icon: Repeat,
  },
  {
    name: 'Reminders',
    url: 'reminders',
    icon: Bell,
  },
  {
    name: 'Timesheet',
    url: 'timesheet',
    icon: GalleryVerticalEnd,
  },
  {
    name: 'Media Library',
    url: 'media',
    icon: LibraryBig,
  },
  {
    name: 'Subscription',
    url: 'subscription',
    icon: DollarSign,
  },
] as const;

export default function Home() {
  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <TeamSwitcher />
        </SidebarHeader>
        <SidebarContent>
          <NavItems items={sidebar} />
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu className="rounded-lg border">
            <SidebarMenuItem>
              <NavUserDropdown />
            </SidebarMenuItem>
          </SidebarMenu>
          <Separator />
          <SidebarTrigger />
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  );
}

export function NavItems({ items }: { items: SidebarItem[] }) {
  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.name}>
            <SidebarMenuButton asChild>
              <a href={item.url}>
                <item.icon />
                <span>{item.name}</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}

export function TeamSwitcher() {
  return (
    <div className="flex items-center gap-x-2">
      <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
        <GalleryVerticalEnd className="size-4" />
      </div>
      <div className="grid flex-1 text-left text-sm leading-tight">
        <span className="truncate font-medium">Thing</span>
      </div>
    </div>
  );
}
