import type { Task } from "./types";

/**
 * Sorts tasks the same way the database does: open tasks first, newest first
 * within each group.
 *
 * Client-side mutations apply this after updating a row, so the visible order
 * stays consistent with what a refetch would return.
 */
export function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }

    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}
