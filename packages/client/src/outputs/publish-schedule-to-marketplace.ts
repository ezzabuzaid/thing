import type * as models from '../index.ts';

export type PublishScheduleToMarketplace201 = {
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

export type PublishScheduleToMarketplace400 = models.ValidationError;
