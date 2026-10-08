import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import { toApiError } from '../api/errors';

export function setServerErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  formFields: readonly Path<T>[],
) {
  const { fields, message } = toApiError(error);
  const entries = Object.entries(fields);

  if (!entries.length) {
    setError('root.server', { message });
    return;
  }
  for (const [name, messages] of entries) {
    const field = formFields.find((f) => f === name);
    setError(field ?? 'root.server', { message: messages[0] });
  }
}
