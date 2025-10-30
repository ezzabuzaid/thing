import { cn } from '@thing/shadcn';
import { motion } from 'motion/react';
import * as React from 'react';

export type SelectorChipsProps = {
  options?: string[];
  value?: string[];
  defaultValue?: string[];
  className?: string;
  onChange?: (selected: string[]) => void;
};

const SelectorChips: React.FC<SelectorChipsProps> = ({
  options,
  value,
  defaultValue = [],
  className,
  onChange,
}) => {
  const [internal, setInternal] = React.useState<string[]>(defaultValue);
  const selected = value ?? internal;

  React.useEffect(() => {
    if (!value) {
      setInternal(defaultValue);
    }
  }, [defaultValue, value]);

  const toggleChip = (option: string) => {
    const updated = selected.includes(option)
      ? selected.filter((item) => item !== option)
      : [...selected, option];

    if (!value) {
      setInternal(updated);
    }
    onChange?.(updated);
  };

  return (
    <div
      className={cn(
        'border-border/70 bg-muted/40 flex w-full max-w-xl flex-wrap items-center gap-2 rounded-xl border p-3',
        className,
      )}
    >
      {options?.map((option) => {
        const isSelected = selected.includes(option);

        return (
          <motion.button
            key={option}
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={() => toggleChip(option)}
            className={cn(
              'flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
              isSelected
                ? 'border-primary bg-primary/10 text-primary shadow-sm'
                : 'border-border bg-background text-muted-foreground hover:bg-muted/30',
            )}
          >
            <span className="capitalize">{option}</span>
            {/* <AnimatePresence initial={false}>
              {isSelected && (
                <motion.span
                  key="check"
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.6, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 420, damping: 24 }}
                  className="grid size-4 place-items-center rounded-full bg-primary text-primary-foreground"
                >
                  <Check className="size-3" />
                </motion.span>
              )}
            </AnimatePresence> */}
          </motion.button>
        );
      })}
    </div>
  );
};

export default SelectorChips;
