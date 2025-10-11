import type { LucideIcon } from 'lucide-react';
import { Link, useLocation } from 'react-router';

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  isActive?: boolean;
}

interface BottomBarProps {
  items: NavItem[];
}

export function BottomBar({ items }: BottomBarProps) {
  const location = useLocation();

  return (
    <footer className="sticky bottom-0 bg-background/80 backdrop-blur-sm border-t border-border pb-safe">
      <nav className="flex justify-around items-center h-20">
        {items.map((item) => {
          const isActive = location.pathname === item.href || item.isActive;

          return (
            <Link
              key={item.href}
              to={item.href}
              className={`flex flex-col items-center justify-center gap-1.5 ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              {isActive && item.label === 'Thoughts' ? (
                <div className="bg-primary text-primary-foreground rounded-full flex items-center justify-center px-5 py-1.5">
                  <item.icon size={24} fill="currentColor" />
                </div>
              ) : (
                <item.icon size={24} />
              )}
              <span className={`text-xs ${isActive ? 'font-semibold' : 'font-medium'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </footer>
  );
}