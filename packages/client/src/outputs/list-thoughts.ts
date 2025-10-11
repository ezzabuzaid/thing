import type * as models from '../index.ts';

export type ListThoughts = {
  records: {
    bookmark: {
      id: string;
      title: string;
      image: string;
      url: string;
      description: string;
      favicon: string;
      publishedAt: string;
      userContext: string;
      folderId: string;
    };
    id: string;
    updatedAt: string;
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

export type ListThoughts400 = models.ValidationError;
