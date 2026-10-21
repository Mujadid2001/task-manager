import type { Task } from "@/lib/types";

import { TaskItem } from "./task-item";

/**
 * The list of tasks.
 *
 * A plain semantic list is used so the order and the number of tasks are
 * available to assistive technology.
 */
export function TaskList({ tasks }: { tasks: Task[] }) {
  return (
    <ul className="space-y-3">
      {tasks.map((task) => (
        <TaskItem key={task.id} task={task} />
      ))}
    </ul>
  );
}
