import { z } from 'zod';

export const getSignedUrlSchema = z.object({
  name: z.string(),
  type: z.enum([
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/jpg',
    'application/dicom',
  ]),
  size: z.number().optional(),
});
export const getFilesSchema = z.object({ userId: z.string().optional() });
export const getFileByIdSchema = z.object({ id: z.string() });
export const getSignedReadUrlSchema = z.object({ id: z.string() });
