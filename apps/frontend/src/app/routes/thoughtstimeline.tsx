import {
  CalendarClock,
  FileText,
  Home as HomeIcon,
  Settings,
} from 'lucide-react';
import { useNavigate } from 'react-router';

import { BottomBar, Header, ThoughtCard } from '../components';
import { useThoughts } from '../hooks/useThoughts';

export default function ThoughtsTimeline() {
  const navigate = useNavigate();
  const { timelineGroups } = useThoughts();

  const bottomNavItems = [
    { label: 'Home', href: '/home', icon: HomeIcon },
    { label: 'Thoughts', href: '/', icon: FileText },
    { label: 'Settings', href: '/settings', icon: Settings },
  ];
  return (
    <div className="relative flex size-full flex-col justify-between">
      <main className="flex-1">
        <Header
          title="Timeline"
          rightIcon={CalendarClock}
          onRightClick={() => navigate('/')}
        />

        <div className="space-y-6 p-4">
          {timelineGroups.map((section) => (
            <section key={section.label} className="space-y-3">
              <h2 className="text-muted-foreground text-sm font-semibold">
                {section.label}
              </h2>
              <div className="space-y-3">
                {section.items.map((t) => (
                  <div key={t.id} className="flex items-start gap-3">
                    <div className="text-muted-foreground w-12 shrink-0 pt-1 text-xs">
                      {new Date(t.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                    <div className="flex-1">
                      <ThoughtCard content={t.content} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>

      <BottomBar items={bottomNavItems} />
    </div>
  );
}
