import { useData } from '@thing/ui';
import {
  CalendarClock,
  FileText,
  Home as HomeIcon,
  Settings,
} from 'lucide-react';
import { useNavigate } from 'react-router';

import { BottomBar, Header, ThoughtCard } from '../components';

const bottomNavItems = [
  { label: 'Home', href: '/home', icon: HomeIcon },
  { label: 'Thoughts', href: '/', icon: FileText, isActive: true },
  { label: 'Settings', href: '/settings', icon: Settings },
];

export default function Thoughts() {
  const navigate = useNavigate();
  // const { thoughts, getRelativeLabel } = useThoughts();
  const { data: thoughts } = useData('GET /thoughts');
  console.log('thoughts', thoughts);
  return (
    <div className="relative flex size-full flex-col justify-between">
      <main className="flex h-full flex-col">
        <Header
          title="Thoughts"
          rightIcon={CalendarClock}
          onRightClick={() => navigate('/thoughtstimeline')}
        />

        <div className="space-y-4 p-4">
          {thoughts?.records?.map((t) => (
            <ThoughtCard key={t.id} content={t.content} />
          ))}
        </div>
      </main>

      <BottomBar items={bottomNavItems} />
    </div>
  );
}
