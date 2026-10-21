/**
 * Shown when the user has no tasks yet.
 */
export function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
      <div
        aria-hidden="true"
        className="bg-brand-50 mx-auto flex h-12 w-12 items-center justify-center rounded-full text-xl"
      >
        ✓
      </div>
      <h2 className="mt-4 text-base font-semibold text-slate-900">
        No tasks yet
      </h2>
      <p className="mx-auto mt-1 max-w-sm text-sm text-slate-600">
        Add your first task above to get started. Completed tasks stay in the
        list so you can keep track of everything you have worked on.
      </p>
    </div>
  );
}
