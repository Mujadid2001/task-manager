/**
 * Shown when the task list could not be loaded.
 *
 * The error is announced to assistive technology with `role="alert"` so the
 * failure is not silent for a screen reader user.
 */
export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div
      role="alert"
      className="border-danger-100 bg-danger-50 rounded-xl border px-6 py-8 text-center"
    >
      <h2 className="text-danger-700 text-base font-semibold">
        We could not load your tasks
      </h2>
      <p className="text-danger-700/90 mx-auto mt-1 max-w-sm text-sm">
        {message}
      </p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="bg-danger-600 hover:bg-danger-700 mt-4 inline-flex h-9 cursor-pointer items-center justify-center rounded-lg px-4 text-sm font-medium text-white transition-colors"
        >
          Try again
        </button>
      ) : null}
    </div>
  );
}
