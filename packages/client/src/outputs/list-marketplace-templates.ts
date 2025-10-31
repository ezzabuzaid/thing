import type * as models from '../index.ts';

export type ListMarketplaceTemplates = {
  records: {
    author: { id: string; name: string; image: string };
    id: string;
    title: string;
    createdAt: string;
    updatedAt: string;
    description: string;
    connectors: string[];
    instructions: string;
    deletedAt: string;
    suggestedCron: string;
    isOfficial: boolean;
    published: boolean;
    tags: string[];
    installCount: number;
    viewCount: number;
    authorId: string;
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

export type ListMarketplaceTemplates400 = models.ValidationError;
