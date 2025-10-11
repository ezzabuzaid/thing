import { randomUUID } from 'node:crypto';

import admin from 'firebase-admin';
import { Hono } from 'hono';
import { z } from 'zod';

import { prisma } from '@agent/db';

import { authenticate } from '../middlewares/middleware.ts';
import { validate } from '../middlewares/validator.ts';

export default async function (router: Hono) {
  /**
   * @openapi getSignedUrl
   * @tags files
   * @description Generate a signed URL for uploading files to cloud storage. Creates a file record and returns a time-limited upload URL. Supports PDF, PNG, JPG, and DICOM file types.
   */
  router.post(
    '/signed-url',
    authenticate(),
    validate((payload) => ({
      name: {
        select: payload.body.name,
        against: z.string().min(1, { message: 'File name is required' }),
      },
      type: {
        select: payload.body.type,
        against: z.enum(
          [
            'application/pdf',
            'image/png',
            'image/jpeg',
            'image/jpg',
            'application/dicom',
          ],
          {
            errorMap: () => ({
              message: 'Only PDF, PNG, JPG, and DICOM files are allowed',
            }),
          },
        ),
      },
      size: {
        select: payload.body.size,
        against: z.number().optional(),
      },
    })),
    async (c) => {
      const { type, name, size } = c.var.input;
      const bucket = admin.storage().bucket();
      const fileId = randomUUID();
      const filePath = `uploads/${c.var.subject.id}/${fileId}`;
      const file = bucket.file(filePath);

      await prisma.media.create({
        data: {
          id: fileId,
          name,
          path: filePath,
          contentType: type,
          size,
          userId: c.var.subject.id,
        },
      });

      const extensionHeaders = {
        'x-goog-if-generation-match': '0', // create-only
        'x-goog-meta-file-id': fileId,
      };

      const [signedUrl] = await file.getSignedUrl({
        action: 'write',
        expires: Date.now() + 5 * 60 * 1000, // 5 minute from now
        contentType: type,
        extensionHeaders,
      });

      return c.json({
        signedUrl,
        fileId: fileId,
        requiredHeaders: {
          ...extensionHeaders,
          'Content-Type': type,
        },
      });
    },
  );

  /**
   * @openapi getFiles
   * @tags files
   * @description Get a list of files uploaded by a specific user, ordered by creation date. Returns file metadata including name, path, content type, and size.
   */
  router.get(
    '/files',
    authenticate(),
    validate((payload) => ({
      userId: {
        select: payload.query.userId,
        against: z.string().optional(),
      },
    })),
    async (c) => {
      const files = await prisma.media.findMany({
        where: {
          userId: c.var.input.userId,
        },
      });

      return c.json({ records: files });
    },
  );

  /**
   * @openapi getFileById
   * @tags files
   * @description Get detailed information about a specific file by its ID. Returns complete file metadata and properties.
   */
  router.get(
    '/files/:id',
    authenticate(),
    validate((payload) => ({
      id: {
        select: payload.params.id,
        against: z.string().min(1),
      },
    })),
    async (c) => {
      const { id } = c.var.input;

      const file = await prisma.media.findUniqueOrThrow({
        where: {
          id,
        },
      });

      return c.json(file);
    },
  );

  /**
   * @openapi getSignedReadUrl
   * @tags files
   * @description Generate a short-lived signed URL for reading a file by its ID. Ensures the file belongs to the authenticated user.
   */
  router.get(
    '/files/:id/signed-url',
    authenticate(),
    validate((payload) => ({
      id: {
        select: payload.params.id,
        against: z.string().min(1, { message: 'File ID is required' }),
      },
    })),
    async (c) => {
      const { id } = c.var.input;

      const record = await prisma.media.findUniqueOrThrow({
        where: {
          id,
        },
      });

      const bucket = admin.storage().bucket();
      const file = bucket.file(record.path);

      const expiresAtMs = Date.now() + 5 * 60 * 1000; // 5 minutes
      const [signedUrl] = await file.getSignedUrl({
        action: 'read',
        expires: expiresAtMs,
      });

      return c.json({
        signedUrl,
        expiresAt: new Date(expiresAtMs).toISOString(),
      });
    },
  );
}
