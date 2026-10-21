const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Detects errors that are worth retrying.
 *
 * Postgres rejects invalid SQL with an error that carries a `code`, while a
 * dropped connection surfaces as a network error underneath the driver
 * wrapper. Only the latter is transient, so constraint violations are never
 * retried.
 */
export function isTransientError(error: unknown): boolean {
  if (error instanceof TypeError || error instanceof AggregateError) {
    return true;
  }

  if (!(error instanceof Error)) {
    return false;
  }

  const cause = error.cause;
  if (cause instanceof TypeError || cause instanceof AggregateError) {
    return true;
  }

  if ("code" in error && typeof error.code === "string") {
    return false;
  }

  return /connecting to database|fetch failed|ECONNRESET|ETIMEDOUT/i.test(
    error.message,
  );
}

export interface RetryOptions {
  /** Total number of attempts, including the first one. */
  attempts?: number;
  /** Delay before the second attempt, doubled on every subsequent attempt. */
  baseDelayMs?: number;
  /** Called before each retry so callers can surface the failure. */
  onRetry?: (error: unknown, attempt: number) => void;
}

/**
 * Runs an operation and retries it with exponential backoff while the failure
 * looks transient.
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  { attempts = 3, baseDelayMs = 250, onRetry }: RetryOptions = {},
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (attempt === attempts || !isTransientError(error)) {
        break;
      }

      onRetry?.(error, attempt);
      await sleep(baseDelayMs * 2 ** (attempt - 1));
    }
  }

  throw lastError;
}
