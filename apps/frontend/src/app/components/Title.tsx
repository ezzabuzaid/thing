import type { PropsWithChildren } from 'react';

export function Title({ children }: PropsWithChildren) {
  return (
    <div className="flex h-16 items-center justify-between">
      <h1 className="text-lg font-sans font-semibold">{children}</h1>
    </div>
  );
}
