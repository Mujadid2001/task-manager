/**
 * Placeholder rows shown while the task list is loading.
 *
 * The shape mirrors the real list so the layout does not jump when the data
 * arrives.
 */
export function TaskListSkeleton() {
  return (
    <div
      className="space-y-3"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span className="sr-only">Loading tasks…</span>
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          aria-hidden="true"
          className="border-border-subtle animate-pulse rounded-xl border bg-white p-4"
        >
          <div className="h-4 w-2/5 rounded bg-slate-200" />
          <div className="mt-3 h-3 w-3/5 rounded bg-slate-100" />
        </div>
      ))}
    </div>
  );
}
