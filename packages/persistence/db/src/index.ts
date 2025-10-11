import { PrismaClient } from './prisma/client.ts';

export const prisma = new PrismaClient({
  log: ['warn', 'error'],
});

export * from './prisma/client.ts';

/**
 * Minimal cursor pagination for UUIDv7 `id`, id ASC.
 * - You own the Prisma call; we only compute params and interpret results.
 * - Overfetch-by-1 to compute hasNextPage precisely.
 * - Excludes the cursor row via skip: 1 when a cursor is provided.
 */

export type IdCursor = { id: string };

export type PaginationInput = {
  cursor?: IdCursor;
  take: number; // positive => forward, negative => backward
};

export type PaginationParams = {
  take: number;
  orderBy: { id: 'asc' };
  cursor?: IdCursor;
  skip?: number;
};

export type PaginationResult<TItem> = {
  items: TItem[]; // exactly |pageSize| items (or fewer at boundaries)
  nextCursor?: IdCursor; // use for forward
  prevCursor?: IdCursor; // use for backward
  hasNextPage: boolean;
  hasPrevPage: boolean;
  pageSize: number;
};

/**
 * Compute Prisma-compatible pagination params you can merge into your own findMany args.
 * Uses overfetch-by-1.
 */
export function paginationPrimitives<R>(input: PaginationInput) {
  const { cursor, take } = input;
  if (!take || take === 0) {
    throw new Error(
      'take must be non-zero. Use positive for forward, negative for backward.',
    );
  }
  const pageSize = Math.abs(take);
  const params: PaginationParams = {
    take: take > 0 ? pageSize + 1 : -(pageSize + 1),
    orderBy: { id: 'asc' },
  };
  if (cursor) {
    params.cursor = cursor;
    params.skip = 1; // exclude the anchor row
  }
  return params;
}

/**
 * Compute Prisma-compatible pagination params you can merge into your own findMany args.
 * Uses overfetch-by-1.
 */
export function paginationParams(input: PaginationInput): PaginationParams {
  const { cursor, take } = input;
  if (!take || take === 0) {
    throw new Error(
      'take must be non-zero. Use positive for forward, negative for backward.',
    );
  }
  const pageSize = Math.abs(take);
  const params: PaginationParams = {
    take: take > 0 ? pageSize + 1 : -(pageSize + 1),
    orderBy: { id: 'asc' },
  };
  if (cursor) {
    params.cursor = cursor;
    params.skip = 1; // exclude the anchor row
  }
  return params;
}

/**
 * Given fetched items (overfetched by 1), slice to page size and derive cursors/flags.
 * Requires each item to have an `id: string`.
 */
export function cursorize<TItem extends { id: string }>(
  fetched: TItem[],
  input: PaginationInput,
): PaginationResult<TItem> {
  const pageSize = Math.abs(input.take);
  const hasExtra = fetched.length > pageSize;
  const items = hasExtra ? fetched.slice(0, pageSize) : fetched;

  let nextCursor: IdCursor | undefined;
  let prevCursor: IdCursor | undefined;

  if (items.length > 0) {
    nextCursor = { id: items[items.length - 1].id };
    prevCursor = { id: items[0].id };
  }

  const hasNextPage = hasExtra;
  const hasPrevPage = !!input.cursor || items.length > 0;

  return {
    items,
    nextCursor,
    prevCursor,
    hasNextPage,
    hasPrevPage,
    pageSize,
  };
}
