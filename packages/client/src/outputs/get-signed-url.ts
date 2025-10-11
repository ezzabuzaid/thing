import type * as models from '../index.ts';

export type GetSignedUrl = {
  signedUrl: string;
  fileId: string;
  requiredHeaders: {
    'Content-Type':
      | 'application/pdf'
      | 'image/png'
      | 'image/jpeg'
      | 'image/jpg'
      | 'application/dicom';
    'x-goog-if-generation-match': '0';
    'x-goog-meta-file-id': string;
  };
};

export type GetSignedUrl400 = models.ValidationError;
