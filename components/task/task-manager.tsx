"use client";

import { useCallback, useEffect, useState } from "react";

import { tasksApi } from "@/lib/api-client";
import { sortTasks } from "@/lib/sort";
import type { Task } from "@/lib/types";
import type { CreateTaskInput, UpdateTaskInput } from "@/lib/validators";

import { DeleteTaskDialog } from "./delete-task-dialog";
import { EmptyState } from "./empty-state";
import { ErrorState } from "./error-state";
import { TaskForm } from "./task-form";
import { TaskList } from "./task-list";
import { TaskListSkeleton } from "./task-list-skeleton";

type LoadStatus = "loading" | "ready" | "error";

function describeError(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "The tasks could not be loaded. Please try again.";
}

/**
 * Root of the task manager.
 *
 * It owns the task list and the load state, and renders one of three views:
 * the skeleton while loading, the list once the data is in, or an error with
 * a retry action when the request failed.
 */
export function TaskManager() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [reloadToken, setReloadToken] = useState(0);
  const [taskPendingDeletion, setTaskPendingDeletion] = useState<Task | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const loadedTasks = await tasksApi.list();
        if (cancelled) return;
        setTasks(loadedTasks);
        setStatus("ready");
      } catch (error) {
        if (cancelled) return;
        setErrorMessage(describeError(error));
        setStatus("error");
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  const retry = useCallback(() => {
    setStatus("loading");
    setErrorMessage("");
    setReloadToken((token) => token + 1);
  }, []);

  const createTask = useCallback(async (input: CreateTaskInput) => {
    const task = await tasksApi.create(input);

    // A new task is always open and the newest, so it belongs at the top of
    // the open group. The server-side ordering is reproduced here instead of
    // refetching the whole list.
    setTasks((current) => [task, ...current]);
    setStatus("ready");
    setErrorMessage("");
  }, []);

  const updateTask = useCallback(async (id: string, input: UpdateTaskInput) => {
    const updated = await tasksApi.update(id, input);

    // Replace the row with the authoritative record from the server and
    // re-apply the server's ordering, in case the update changed it.
    setTasks((current) =>
      sortTasks(current.map((task) => (task.id === id ? updated : task))),
    );
  }, []);

  const requestDelete = useCallback((task: Task) => {
    setTaskPendingDeletion(task);
  }, []);

  const cancelDelete = useCallback(() => {
    setTaskPendingDeletion(null);
  }, []);

  const confirmDelete = useCallback(async (task: Task) => {
    await tasksApi.remove(task.id);
    setTasks((current) => current.filter((item) => item.id !== task.id));
    setTaskPendingDeletion(null);
  }, []);

  const openTaskCount = tasks.filter((task) => !task.completed).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Your tasks
        </h1>
        {status === "ready" ? (
          <p className="text-sm text-slate-500" aria-live="polite">
            {openTaskCount} open
            {tasks.length !== openTaskCount ? ` · ${tasks.length} total` : ""}
          </p>
        ) : null}
      </div>

      <TaskForm onCreate={createTask} />

      {status === "loading" ? <TaskListSkeleton /> : null}

      {status === "error" ? (
        <ErrorState message={errorMessage} onRetry={retry} />
      ) : null}

      {status === "ready" ? (
        tasks.length === 0 ? (
          <EmptyState />
        ) : (
          <TaskList
            tasks={tasks}
            onUpdate={updateTask}
            onRequestDelete={requestDelete}
          />
        )
      ) : null}

      {taskPendingDeletion ? (
        <DeleteTaskDialog
          task={taskPendingDeletion}
          onCancel={cancelDelete}
          onConfirm={confirmDelete}
        />
      ) : null}
    </div>
  );
}
