import { isAxiosError, isCancel } from 'axios';
import type { ErrorBody, ErrorType, FieldErrors } from './types';

export class ApiError extends Error {
  readonly status: number;
  readonly type: ErrorType | 'NetworkError' | 'Aborted';
  readonly fields: FieldErrors;

  constructor(status: number, type: ApiError['type'], message: string, fields: FieldErrors = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.type = type;
    this.fields = fields;
  }
}

function isErrorBody(data: unknown): data is ErrorBody {
  return (
    typeof data === 'object' &&
    data !== null &&
    'error' in data &&
    typeof data.error === 'object' &&
    data.error !== null &&
    'type' in data.error
  );
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (isCancel(error)) return new ApiError(0, 'Aborted', 'Request was cancelled');

  if (isAxiosError(error) && error.response) {
    const { status, data } = error.response;
    if (isErrorBody(data)) {
      return new ApiError(status, data.error.type, data.error.message, data.error.payload);
    }
    return new ApiError(status, 'BadRequestException', error.message);
  }

  const message = error instanceof Error ? error.message : 'Network error';
  return new ApiError(0, 'NetworkError', message);
}

export const isApiError = (error: unknown, status?: number): error is ApiError =>
  error instanceof ApiError && (status === undefined || error.status === status);
