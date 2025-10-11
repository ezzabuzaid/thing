import type * as models from '../index.ts';

export type GetSignedReadUrl = { signedUrl: string; expiresAt: string };

export type GetSignedReadUrl400 = models.ValidationError;
