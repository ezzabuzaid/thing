import {
  type PropsWithChildren,
  useCallback,
  useEffect,
  useState,
} from 'react';
import { type FileRejection, useDropzone } from 'react-dropzone';

import { cn } from '@agent/shadcn';

export interface UploadFieldProps {
  name: string;
  value?: File | null;
  onChange?: (file: File | null) => void;
  accept?: Record<string, string[]>;
  maxSizeBytes?: number; // default 10MB
  className?: string;
}

export function UploadField({
  name,
  value,
  onChange,
  children,
  accept = {
    'application/pdf': ['.pdf'],
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/gif': ['.gif'],
    'application/svg+xml': ['.svg'],
    'text/plain': ['.txt'],

    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [
      '.docx',
    ],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [
      '.xlsx',
    ],
    'application/vnd.ms-excel': ['.xls'],
    'application/vnd.openxmlformats-officedocument.presentationml.presentation':
      ['.pptx'],
    'application/vnd.ms-powerpoint': ['.ppt'],
  },
  maxSizeBytes = 10 * 1024 * 1024,
  className,
}: PropsWithChildren<UploadFieldProps>) {
  const [rejections, setRejections] = useState<FileRejection[]>([]);
  const file = value ?? null;

  const onDrop = useCallback(
    (accepted: File[], rejected: FileRejection[]) => {
      setRejections(rejected);
      if (accepted && accepted.length > 0) {
        const newFile = accepted[0];
        onChange?.(newFile);
      }
    },
    [onChange],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    noClick: true,
    multiple: false,
    maxSize: maxSizeBytes,
  });

  return (
    <div className={cn('relative', className)}>
      <div
        {...getRootProps()}
        className={cn(
          'border',
          isDragActive ? 'rounded border-dashed' : 'border-transparent',
        )}
      >
        <input {...getInputProps()} name={name} />
        {children}
      </div>
    </div>
  );
}

export function Thumbnail({ file }: { file: File }) {
  return (
    <div className="border-border flex h-4 max-w-48 cursor-pointer items-center truncate rounded border px-1 text-[8px] hover:w-fit">
      <span>{file.name}</span>
    </div>
  );
}
