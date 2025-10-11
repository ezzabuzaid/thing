import type * as models from '../index.ts';

export type GetFiles = {
  records: {
    path: string;
    id: string;
    userId: string;
    name: string;
    updatedAt: string;
    size: number;
    contentType: string;
  }[];
};

export type GetFiles400 = models.ValidationError;
