import type * as models from '../index.ts';

export type GetMarketplaceTemplateById = {
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
};

export type GetMarketplaceTemplateById400 = models.ValidationError;
