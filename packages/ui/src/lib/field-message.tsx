import type { StandardSchemaV1Issue } from '@tanstack/react-form';
import { useId } from 'react';

import { APIError, ParseError } from '@agent/client';
import { cn } from '@agent/shadcn';

export function FieldMessage(props: {
  errors: (StandardSchemaV1Issue | undefined)[];
}) {
  const id = useId();
  return props.errors.length ? (
    <p
      data-slot="form-message"
      id={id}
      className={cn('text-destructive text-sm')}
      {...props}
    >
      {props.errors
        .filter((it) => !!it)
        .map((it) => it.message)
        .join(',')}
    </p>
  ) : null;
}
export function FormMessage(props: {
  errors: (Record<string, StandardSchemaV1Issue[]> | undefined)[];
}) {
  const id = useId();
  return props.errors.length ? (
    <p
      data-slot="form-message"
      id={id}
      className={cn('text-destructive text-sm')}
      {...props}
    >
      {props.errors
        .filter((it) => !!it)
        .map((it) =>
          Object.entries(it)
            .filter(([key]) => key === 'form')
            .map((it) => {
              return it[1].map((issue) => issue.message);
            }),
        )
        .join(',')}
    </p>
  ) : null;
}

export function errorToFormIssue(error: unknown) {
  if (error instanceof Error) {
    return { form: [{ message: error.message }] } satisfies Record<
      string,
      StandardSchemaV1Issue[]
    >;
  }

  if (error instanceof APIError) {
    const data = error.data as {
      error: string;
      cause: {
        code: string;
        detail: string;
        errors: Record<
          string,
          { code: string; message: string; path: string }[]
        >;
      };
    };
    if (data.cause.code === 'api/validation-failed') {
      return {
        form: Object.entries(data.cause.errors).map(([key, value]) => {
          return {
            message: value.map((it) => it.message).join(','),
          };
        }) satisfies StandardSchemaV1Issue[],
      };
    } else {
      return {
        form: [{ message: data.cause.detail }],
      } satisfies Record<string, StandardSchemaV1Issue[]>;
    }
  }
  if (error instanceof ParseError) {
    const formErrors: Record<string, StandardSchemaV1Issue[]> = {};

    // Handle field errors
    if (error.data.fieldErrors) {
      Object.entries(error.data.fieldErrors).forEach(([field, issues]) => {
        if (issues && issues.length > 0) {
          formErrors[field] = issues.map((issue) => ({
            message: issue.message || 'خطأ في التحقق من صحة البيانات',
          }));
        }
      });
    }

    // Handle form errors
    if (error.data.formErrors && error.data.formErrors.length > 0) {
      formErrors.form = error.data.formErrors.map((issue) => ({
        message: issue.message || 'خطأ في التحقق من صحة النموذج',
      }));
    }

    // If no specific errors, return a general validation error
    if (Object.keys(formErrors).length === 0) {
      formErrors.form = [{ message: 'خطأ في التحقق من صحة البيانات' }];
    }

    return formErrors;
  }

  return { form: [{ message: 'حدث خطأ غير متوقع' }] } satisfies Record<
    string,
    StandardSchemaV1Issue[]
  >;
}
