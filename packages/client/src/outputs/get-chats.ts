import type * as models from '../index.ts';

export type GetChats = {
  records: {
    _count: { messages: number };
    id: string;
    userId: string;
    title: string;
  }[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
};

export type GetChats400 = models.ValidationError;
