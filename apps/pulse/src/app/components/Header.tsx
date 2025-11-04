import type { LucideIcon } from 'lucide-react';
import { Plus } from 'lucide-react';

interface HeaderProps {
  title: string;
  showAddButton?: boolean; // deprecated, kept for backward compat if used elsewhere
  rightIcon?: LucideIcon;
  onRightClick?: () => void;
}

export function Header({
  title,
  showAddButton = true,
  rightIcon,
  onRightClick
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm">
      <div className="flex items-center justify-between p-4">
        <div className="w-10"></div>
        <h1 className="text-lg font-bold text-center text-foreground flex-1">
          {title}
        </h1>
        {rightIcon || showAddButton ? (
          <button
            onClick={onRightClick}
            className="flex items-center justify-center size-10 rounded-full hover:bg-accent active:scale-95 transition-all"
          >
            {(() => {
              if (rightIcon) {
                const Icon = rightIcon;
                return <Icon size={24} />;
              }
              return <Plus size={24} />;
            })()}
          </button>
        ) : (
          <div className="w-10"></div>
        )}
      </div>
    </header>
  );
}