import { formatDateTime } from "@/lib/format";
import type { Task } from "@/lib/types";

/**
 * A single row in the task list.
 *
 * Completed tasks are visually distinct: the title is struck through and the
 * status badge changes, so the state is readable at a glance without relying
 * on colour alone.
 */
export function TaskItem({ task }: { task: Task }) {
  return (
    <li className="border-border-subtle rounded-xl border bg-white p-4 transition-shadow hover:shadow-sm">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <h3
            className={
              task.completed
                ? "text-sm font-semibold text-slate-500 line-through"
                : "text-sm font-semibold text-slate-900"
            }
          >
            {task.title}
          </h3>

          {task.description ? (
            <p className="mt-1 text-sm break-words text-slate-600">
              {task.description}
            </p>
          ) : null}

          <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
            <StatusBadge completed={task.completed} />
            <span aria-hidden="true">·</span>
            <time dateTime={task.createdAt}>
              Created {formatDateTime(task.createdAt)}
            </time>
          </div>
        </div>
      </div>
    </li>
  );
}

function StatusBadge({ completed }: { completed: boolean }) {
  if (completed) {
    return (
      <span className="bg-success-100 text-success-700 inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium">
        <span aria-hidden="true">✓</span>
        Completed
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-600">
      Open
    </span>
  );
}
