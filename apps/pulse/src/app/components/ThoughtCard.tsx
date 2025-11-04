import type { LucideIcon } from 'lucide-react';
import { StickyNote } from 'lucide-react';

interface ThoughtCardProps {
  content: string;
  icon?: LucideIcon;
}

export function ThoughtCard({ content, icon: IconComponent = StickyNote }: ThoughtCardProps) {
  return (
    <div className="flex items-start gap-4 p-4 rounded-xl bg-secondary">
      <div className="flex items-center justify-center rounded-full bg-white shrink-0 size-10 mt-1">
        <IconComponent size={20} className="text-secondary-foreground" />
      </div>
      <div className="flex-1">
        <p className="text-foreground text-base font-medium leading-snug">{content}</p>
      </div>
    </div>
  );
}