import type { Task } from "@/lib/types";
import type { UpdateTaskInput } from "@/lib/validators";

import { TaskItem } from "./task-item";

/**
 * The list of tasks.
 *
 * A plain semantic list is used so the order and the number of tasks are
 * available to assistive technology.
 */
export function TaskList({
  tasks,
  onUpdate,
  onToggleComplete,
  onRequestDelete,
  pendingTaskIds,
}: {
  tasks: Task[];
  onUpdate: (id: string, input: UpdateTaskInput) => Promise<void>;
  onToggleComplete: (task: Task, completed: boolean) => void;
  onRequestDelete: (task: Task) => void;
  pendingTaskIds: ReadonlySet<string>;
}) {
  return (
    <ul className="space-y-3">
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          onUpdate={onUpdate}
          onToggleComplete={onToggleComplete}
          onRequestDelete={onRequestDelete}
          isToggling={pendingTaskIds.has(task.id)}
        />
      ))}
    </ul>
  );
}
