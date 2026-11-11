/**
 * Safely extracts a user-facing message from an unknown thrown value.
 */
export function getErrorMessage(
  error: unknown,
  fallback = 'An unexpected error occurred.'
): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }
  if (typeof error === 'string' && error.trim().length > 0) {
    return error;
  }
  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as { message: unknown }).message === 'string' &&
    (error as { message: string }).message.trim().length > 0
  ) {
    return (error as { message: string }).message;
  }
  return fallback;
}
