import { AnimatePresence, type Variants, motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import React, {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

import { Spinner, cn } from '@agent/shadcn';

import { Thumbnail, UploadField } from './UploadField.tsx';

const animationVariants: Variants = {
  rootInitial: { opacity: 0, y: 20 },
  rootAnimate: { opacity: 1, y: 0 },
  itemInitial: { opacity: 0, x: -10 },
  itemAnimate: { opacity: 1, x: 0 },
  contentHidden: { opacity: 0, height: 0 },
  contentVisible: { opacity: 1, height: 'auto' },
  chevronClosed: { rotate: 0 },
  chevronOpen: { rotate: 90 },
};

const transitions = {
  root: { duration: 0.4 },
  item: { duration: 0.2 },
  content: { duration: 0.3, ease: 'easeInOut' },
  chevron: { duration: 0.2 },
} as const;

interface ExpansionContextType {
  expandedIds: Set<string>;
  toggleExpanded: (id: string) => void;
}

interface SelectionContextType {
  selectedId: string | null;
  setSelected: (id: string) => void;
  onSelect?: (id: string) => void;
}

interface TreeContextType {
  focusedId: string | null;
  setFocusedId: (id: string | null) => void;
  treeId: string;
  setKeyboardMode: (mode: boolean) => void;
  keyboardMode: boolean;
}

interface LevelContextType {
  level: number;
}

const ExpansionContext = createContext<ExpansionContextType | null>(null);
const SelectionContext = createContext<SelectionContextType | null>(null);
const TreeContext = createContext<TreeContextType | null>(null);
const LevelContext = createContext<LevelContextType>({ level: 0 });

export const useExpansion = () => {
  const context = useContext(ExpansionContext);
  if (!context) {
    throw new Error(
      'FolderTree components must be used within FolderTree.Root',
    );
  }
  return context;
};

export const useSelection = () => {
  const context = useContext(SelectionContext);
  if (!context) {
    throw new Error(
      'FolderTree components must be used within FolderTree.Root',
    );
  }
  return context;
};

const useTree = () => {
  const context = useContext(TreeContext);
  if (!context) {
    throw new Error(
      'FolderTree components must be used within FolderTree.Root',
    );
  }
  return context;
};

const useLevel = () => {
  return useContext(LevelContext);
};

const getPaddingClass = (level: number): string => {
  const paddingMap: Record<number, string> = {
    0: 'pl-3',
    1: 'pl-8',
    2: 'pl-12',
    3: 'pl-16',
    4: 'pl-20',
    5: 'pl-24',
    6: 'pl-28',
    7: 'pl-32',
  };
  return paddingMap[level] || `pl-[${Math.min(level * 4 + 12, 48)}px]`;
};

interface RootProps {
  defaultExpanded?: string[];
  defaultSelected?: string;
  onSelect?: (id: string) => void;
  className?: string;
  children: React.ReactNode;
  id?: string;
}

interface ItemProps {
  id: string;
  label: (isSelected: boolean) => ReactNode;
  subtitle?: ReactNode;
  icon?: ReactNode;
  loading?: boolean;
  badge?: ReactNode;
  hasChildren: boolean;
  emptyCollapse?: ReactNode;
  className?: string;
  children?: React.ReactNode;
  thumbnailClass?: string;
  onSelect?: () => void;
}

interface TriggerProps {
  className?: string;
}

interface ContentProps {
  children: React.ReactNode;
  className?: string;
}

export const Root: React.FC<RootProps> = ({
  defaultExpanded = [],
  defaultSelected,
  onSelect,
  className = '',
  children,
  id = 'folder-tree',
}) => {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    new Set(defaultExpanded),
  );
  const [selectedId, setSelectedId] = useState<string | null>(
    defaultSelected || null,
  );
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [keyboardMode, setKeyboardMode] = useState(false);
  const treeRef = useRef<HTMLDivElement>(null);

  const toggleExpanded = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const setSelected = useCallback((id: string) => {
    setSelectedId(id);
  }, []);

  const getVisibleItemIds = useCallback(() => {
    const items = Array.from(
      treeRef.current?.querySelectorAll('[role="treeitem"]') || [],
    );
    return items
      .filter((item) => {
        const element = item as HTMLElement;
        return element.offsetHeight > 0 && element.offsetWidth > 0;
      })
      .map((item) => item.getAttribute('data-id'))
      .filter(Boolean) as string[];
  }, []);

  const getAllItemIds = useCallback(() => {
    const items = Array.from(
      treeRef.current?.querySelectorAll('[role="treeitem"]') || [],
    );
    return items
      .map((item) => item.getAttribute('data-id'))
      .filter(Boolean) as string[];
  }, []);

  const [treeHasFocus, setTreeHasFocus] = useState(false);

  const handleTreeFocus = useCallback(() => {
    if (!treeHasFocus) {
      setTreeHasFocus(true);
      setKeyboardMode(true);
    }
  }, [treeHasFocus]);

  const handleTreeBlur = useCallback((e: React.FocusEvent) => {
    if (!treeRef.current?.contains(e.relatedTarget as Node)) {
      setTreeHasFocus(false);
      setFocusedId(null);
      setKeyboardMode(false);
    }
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const getVisibleItems = () => {
        return Array.from(
          treeRef.current?.querySelectorAll('[role="treeitem"]') || [],
        ).filter((item) => {
          const element = item as HTMLElement;
          return element.offsetHeight > 0 && element.offsetWidth > 0;
        });
      };

      if (e.key === 'Tab') {
        if (treeHasFocus && !focusedId) {
          const visibleItemIds = getVisibleItemIds();
          if (visibleItemIds.length > 0) {
            setFocusedId(visibleItemIds[0]);
            e.preventDefault();
            return;
          }
        }

        if (focusedId) {
          const visibleItems = getVisibleItems();
          const currentIndex = visibleItems.findIndex(
            (item) => item.getAttribute('data-id') === focusedId,
          );

          if (e.shiftKey) {
            if (currentIndex === 0) {
              setFocusedId(null);
              setTreeHasFocus(false);
              setKeyboardMode(false);
              return;
            }
            const nextIndex = Math.max(0, currentIndex - 1);
            const nextItem = visibleItems[nextIndex] as HTMLElement;
            const nextId = nextItem?.getAttribute('data-id');
            if (nextId) {
              setFocusedId(nextId);
              e.preventDefault();
            }
          } else {
            if (currentIndex === visibleItems.length - 1) {
              setFocusedId(null);
              setTreeHasFocus(false);
              setKeyboardMode(false);
              return;
            }
            const nextIndex = Math.min(
              visibleItems.length - 1,
              currentIndex + 1,
            );
            const nextItem = visibleItems[nextIndex] as HTMLElement;
            const nextId = nextItem?.getAttribute('data-id');
            if (nextId) {
              setFocusedId(nextId);
              e.preventDefault();
            }
          }
        }
        return;
      }

      if (!keyboardMode || !focusedId) return;

      const visibleItems = getVisibleItems();
      const currentIndex = visibleItems.findIndex(
        (item) => item.getAttribute('data-id') === focusedId,
      );

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          if (currentIndex < visibleItems.length - 1) {
            const nextItem = visibleItems[currentIndex + 1] as HTMLElement;
            const nextId = nextItem.getAttribute('data-id');
            if (nextId) setFocusedId(nextId);
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (currentIndex > 0) {
            const prevItem = visibleItems[currentIndex - 1] as HTMLElement;
            const prevId = prevItem.getAttribute('data-id');
            if (prevId) setFocusedId(prevId);
          }
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (!expandedIds.has(focusedId)) {
            toggleExpanded(focusedId);
          }
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (expandedIds.has(focusedId)) {
            toggleExpanded(focusedId);
          }
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          setSelected(focusedId);
          if (onSelect) {
            const currentItem = visibleItems[currentIndex] as HTMLElement;
            onSelect(focusedId);
          }
          break;
      }
    },
    [
      focusedId,
      keyboardMode,
      expandedIds,
      toggleExpanded,
      setSelected,
      onSelect,
      getVisibleItemIds,
      treeHasFocus,
    ],
  );

  useEffect(() => {
    const handleMouseDown = () => setKeyboardMode(false);
    document.addEventListener('mousedown', handleMouseDown);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  const expansionValue: ExpansionContextType = {
    expandedIds,
    toggleExpanded,
  };

  const selectionValue: SelectionContextType = {
    selectedId,
    setSelected,
    onSelect,
  };

  const treeValue: TreeContextType = {
    focusedId,
    setFocusedId,
    treeId: id,
    setKeyboardMode,
    keyboardMode,
  };

  return (
    <ExpansionContext.Provider value={expansionValue}>
      <SelectionContext.Provider value={selectionValue}>
        <TreeContext.Provider value={treeValue}>
          <LevelContext.Provider value={{ level: 0 }}>
            <motion.div
              ref={treeRef}
              variants={animationVariants}
              initial="rootInitial"
              animate="rootAnimate"
              transition={transitions.root}
              className={cn('overflow-hidden', className)}
              role="tree"
              aria-labelledby={`${id}-label`}
              tabIndex={0}
              onKeyDown={handleKeyDown}
              onFocus={handleTreeFocus}
              onBlur={handleTreeBlur}
            >
              <div className="bg-background w-full overflow-y-auto text-sm">
                {children}
              </div>
            </motion.div>
          </LevelContext.Provider>
        </TreeContext.Provider>
      </SelectionContext.Provider>
    </ExpansionContext.Provider>
  );
};

export const ItemContext = createContext<{
  itemId: string;
  hasChildren: boolean;
  isExpanded: boolean;
  toggleExpanded: () => void;
} | null>(null);

export const Item: React.FC<ItemProps> = ({
  id,
  label,
  icon,
  loading,
  badge,
  className = '',
  children,
  emptyCollapse,
  subtitle,
  hasChildren,
  thumbnailClass,
}) => {
  const expansionContext = useExpansion();
  const selectionContext = useSelection();
  const treeContext = useTree();
  const { level } = useLevel();
  const itemRef = useRef<HTMLDivElement>(null);
  const keyboardMode = treeContext.keyboardMode;

  const isExpanded = expansionContext.expandedIds.has(id);
  const isSelected = selectionContext.selectedId === id;
  const isFocused = treeContext.focusedId === id;

  const handleItemClick = useCallback(() => {
    treeContext.setKeyboardMode(false);
    selectionContext.setSelected(id);
    treeContext.setFocusedId(id);
    if (selectionContext.onSelect) {
      selectionContext.onSelect(id);
    }
  }, [id, selectionContext, treeContext]);

  const toggleExpanded = useCallback(() => {
    if (hasChildren) {
      expansionContext.toggleExpanded(id);
    }
  }, [id, hasChildren, expansionContext]);

  const handleFocus = useCallback(() => {
    treeContext.setFocusedId(id);
  }, [id, treeContext]);

  useEffect(() => {
    if (isFocused && itemRef.current) {
      itemRef.current.focus();
    }
  }, [isFocused]);

  const itemContextValue = {
    itemId: id,
    hasChildren,
    isExpanded,
    toggleExpanded,
  };
  const EmptyCollapse: ReactNode = emptyCollapse;
  const [attachement, setAttachment] = useState<File | null>(null);
  return (
    <ItemContext.Provider value={itemContextValue}>
      <LevelContext.Provider value={{ level: level + 1 }}>
        <div className="group">
          <UploadField
            name={id}
            onChange={setAttachment}
            className={cn(
              isSelected
                ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                : '',
              !isSelected && 'hover:bg-gray-100 dark:hover:bg-slate-700/50',
              keyboardMode && isFocused
                ? 'focus:ring-2 focus:ring-blue-500 focus:outline-none focus:ring-inset'
                : 'focus:outline-none',
            )}
          >
            <motion.div
              ref={itemRef}
              variants={animationVariants}
              initial="itemInitial"
              animate="itemAnimate"
              transition={{ ...transitions.item, delay: level * 0.05 }}
              data-selected={isSelected ? 'true' : 'false'}
              data-id={id}
              className={cn(
                'flex cursor-pointer items-center gap-2 rounded py-1 text-sm transition-colors',
                className,
                getPaddingClass(level),
              )}
              onClick={(e: React.MouseEvent) => {
                handleItemClick();
                e.stopPropagation();
                toggleExpanded();
              }}
              onFocus={handleFocus}
              role="treeitem"
              tabIndex={isFocused ? 0 : -1}
              aria-expanded={hasChildren ? isExpanded : undefined}
              aria-selected={isSelected}
              aria-label={`${hasChildren ? 'Folder' : 'File'}`}
              aria-level={level + 1}
            >
              {hasChildren && (
                <motion.span
                  className="flex-shrink-0 cursor-pointer"
                  variants={animationVariants}
                  animate={isExpanded ? 'chevronOpen' : 'chevronClosed'}
                  transition={transitions.chevron}
                  aria-hidden="true"
                >
                  <ChevronRight
                    size={16}
                    className="text-gray-500 dark:text-gray-400"
                  />
                </motion.span>
              )}
              {!hasChildren &&
                (!EmptyCollapse ? (
                  <span className="mr-2 min-w-3" aria-hidden="true" />
                ) : (
                  EmptyCollapse
                ))}
              <div>
                <div className="flex items-center gap-2">
                  {loading ? <Spinner /> : icon}
                  <span className="flex-1">{label(isSelected)}</span>
                </div>
                <p className={cn('text-muted-foreground text-xs', 'pl-6')}>
                  {subtitle}
                </p>
              </div>
              {badge && <div className="ml-auto">{badge}</div>}
            </motion.div>
            {attachement && (
              <div
                className={cn(
                  'flex',
                  getPaddingClass(level * (hasChildren ? 3 : 2)),
                  level === 0 ? '-ml-0.5 pl-16' : '',
                  thumbnailClass,
                )}
              >
                {!hasChildren &&
                  (!EmptyCollapse ? (
                    <span className="mr-2 min-w-3" aria-hidden="true" />
                  ) : (
                    EmptyCollapse
                  ))}
                <Thumbnail file={attachement!} />
              </div>
            )}
          </UploadField>
          {children}
        </div>
      </LevelContext.Provider>
    </ItemContext.Provider>
  );
};

export const Trigger: React.FC<TriggerProps> = ({ className = '' }) => {
  const itemContext = useContext(ItemContext);
  if (!itemContext || !itemContext.hasChildren) {
    return null;
  }

  return (
    <motion.span
      className={cn('mr-2 flex-shrink-0 cursor-pointer', className)}
      variants={animationVariants}
      animate={itemContext.isExpanded ? 'chevronOpen' : 'chevronClosed'}
      transition={transitions.chevron}
      onClick={(e: React.MouseEvent) => {
        e.stopPropagation();
        itemContext.toggleExpanded();
      }}
      role="button"
      aria-label={itemContext.isExpanded ? 'Collapse' : 'Expand'}
      tabIndex={-1}
    >
      <ChevronRight size={16} className="text-gray-500 dark:text-gray-400" />
    </motion.span>
  );
};

export const Content: React.FC<ContentProps> = ({
  children,
  className = '',
}) => {
  const itemContext = useContext(ItemContext);
  if (!itemContext) {
    return <>{children}</>;
  }

  const hasContent = React.Children.count(children) > 0;

  return (
    <AnimatePresence>
      {hasContent && itemContext.isExpanded && (
        <motion.div
          variants={animationVariants}
          initial="contentHidden"
          animate="contentVisible"
          exit="contentHidden"
          transition={transitions.content}
          style={{ overflow: 'hidden' }}
          className={className}
          role="group"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
