"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/format";
import type { Task } from "@/lib/types";
import type { UpdateTaskInput } from "@/lib/validators";

import { TaskEditForm } from "./task-edit-form";

/**
 * A single row in the task list.
 *
 * Completed tasks are visually distinct: the title is struck through and the
 * status badge changes, so the state is readable at a glance without relying
 * on colour alone.
 *
 * Edit state is local to the row, so opening the editor for one task never
 * touches another row or the parent's data.
 */
export function TaskItem({
  task,
  onUpdate,
  onToggleComplete,
  onRequestDelete,
  isToggling,
}: {
  task: Task;
  onUpdate: (id: string, input: UpdateTaskInput) => Promise<void>;
  onToggleComplete: (task: Task, completed: boolean) => void;
  onRequestDelete: (task: Task) => void;
  isToggling: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);

  async function handleSave(input: {
    title: string;
    description: string | null;
  }) {
    await onUpdate(task.id, input);
    setIsEditing(false);
  }

  return (
    <li className="border-border-subtle rounded-xl border bg-white p-4 transition-shadow hover:shadow-sm">
      {isEditing ? (
        <TaskEditForm
          task={task}
          onSave={handleSave}
          onCancel={() => setIsEditing(false)}
        />
      ) : (
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={task.completed}
            onChange={(event) => onToggleComplete(task, event.target.checked)}
            disabled={isToggling}
            aria-label={
              task.completed
                ? `Mark "${task.title}" as not completed`
                : `Mark "${task.title}" as completed`
            }
            className="accent-brand-600 mt-0.5 h-5 w-5 shrink-0 cursor-pointer disabled:cursor-wait"
          />

          <div className="min-w-0 flex-1">
            <h3
              className={
                task.completed
                  ? "text-sm font-semibold break-words text-slate-500 line-through"
                  : "text-sm font-semibold break-words text-slate-900"
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

          <div className="flex shrink-0 items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(true)}
              aria-label={`Edit ${task.title}`}
            >
              Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRequestDelete(task)}
              aria-label={`Delete ${task.title}`}
              className="text-danger-700 hover:bg-danger-50 hover:text-danger-700"
            >
              Delete
            </Button>
          </div>
        </div>
      )}
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
