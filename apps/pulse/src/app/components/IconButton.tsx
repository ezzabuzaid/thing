import {
  Button,
  type ButtonProps,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@thing/shadcn';
import type { LucideIcon } from 'lucide-react';

export function IconButton({
  icon,
  ...props
}: Omit<ButtonProps, 'title'> & {
  icon: LucideIcon;
  title: string;
}) {
  const Icon = icon;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button {...props} type="button" size="icon" variant="outline">
          {<Icon className="size-4" />}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{props.title}</TooltipContent>
    </Tooltip>
  );
}
