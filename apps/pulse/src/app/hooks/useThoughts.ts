import {
  addDays,
  isSameWeek as dfIsSameWeek,
  differenceInCalendarDays,
  format,
} from 'date-fns';
import { useCallback, useEffect, useMemo, useState } from 'react';

export type Thought = {
  id: string;
  content: string;
  createdAt: string; // ISO string
};

type TimelineGroup = {
  label: 'Today' | 'Yesterday' | 'This week' | 'Earlier';
  items: Thought[];
};

const STORAGE_KEY = 'thoughts:v1';

function loadInitial(): Thought[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore storage errors (SSR or quota)
  }
  // Seed with a few example thoughts if none exist
  const now = new Date();
  const seed: Thought[] = [
    {
      id: randomUUID(),
      content:
        "I'm feeling grateful for the little things in life, like a warm cup of coffee and a sunny day.",
      createdAt: addDays(now, 0).toISOString(),
    },
    {
      id: randomUUID(),
      content:
        'Had a great conversation with my friend, Sarah, about our future plans.',
      createdAt: addDays(now, -1).toISOString(),
    },
    {
      id: randomUUID(),
      content:
        "Started a new book and I'm already hooked. The characters are so well-developed.",
      createdAt: addDays(now, -2).toISOString(),
    },
    {
      id: randomUUID(),
      content:
        'Went for a long walk in the park and enjoyed the fresh air and nature.',
      createdAt: addDays(now, -3).toISOString(),
    },
  ];
  return seed;
}

function save(thoughts: Thought[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(thoughts));
  } catch {
    // ignore storage errors
  }
}

const isSameWeek = (date: Date, now: Date) =>
  dfIsSameWeek(date, now, { weekStartsOn: 1 });

export function useThoughts() {
  const [thoughts, setThoughts] = useState<Thought[]>(() => loadInitial());

  useEffect(() => {
    save(thoughts);
  }, [thoughts]);

  const addThought = useCallback((content: string) => {
    setThoughts((prev) => [
      { id: randomUUID(), content, createdAt: new Date().toISOString() },
      ...prev,
    ]);
  }, []);

  const removeThought = useCallback((id: string) => {
    setThoughts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const getRelativeLabel = useCallback((iso: string): string => {
    const now = new Date();
    const d = new Date(iso);
    const days = Math.abs(differenceInCalendarDays(now, d));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days <= 3) return `${days} days ago`;
    // Fallback: short date using date-fns
    return format(d, 'MMM d');
  }, []);

  const timelineGroups: TimelineGroup[] = useMemo(() => {
    const now = new Date();
    const today: Thought[] = [];
    const yesterday: Thought[] = [];
    const thisWeek: Thought[] = [];
    const earlier: Thought[] = [];
    for (const t of thoughts) {
      const d = new Date(t.createdAt);
      const days = Math.abs(differenceInCalendarDays(now, d));
      if (days === 0) today.push(t);
      else if (days === 1) yesterday.push(t);
      else if (isSameWeek(d, now)) thisWeek.push(t);
      else earlier.push(t);
    }
    const result: TimelineGroup[] = [];
    if (today.length) result.push({ label: 'Today', items: today });
    if (yesterday.length) result.push({ label: 'Yesterday', items: yesterday });
    if (thisWeek.length) result.push({ label: 'This week', items: thisWeek });
    if (earlier.length) result.push({ label: 'Earlier', items: earlier });
    return result;
  }, [thoughts]);

  return {
    thoughts,
    addThought,
    removeThought,
    getRelativeLabel,
    timelineGroups,
  } as const;
}

function randomUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c == 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
