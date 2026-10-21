"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import type { Task } from "@/lib/types";

/**
 * Confirmation dialog for deleting a task.
 *
 * Built on the native <dialog> element so the browser provides the modal
 * semantics for free: the rest of the page is inert, focus is trapped, and
 * Escape cancels.
 *
 * Focus starts on Cancel rather than Delete, so pressing Enter by reflex does
 * not destroy anything.
 */
export function DeleteTaskDialog({
  task,
  onCancel,
  onConfirm,
}: {
  task: Task;
  onCancel: () => void;
  onConfirm: (task: Task) => Promise<void>;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (dialog && !dialog.open) {
      dialog.showModal();
    }
  }, []);

  async function handleConfirm() {
    setIsDeleting(true);
    setErrorMessage(null);

    try {
      await onConfirm(task);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "The task could not be deleted. Please try again.",
      );
      setIsDeleting(false);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="delete-task-title"
      aria-describedby="delete-task-description"
      onCancel={(event) => {
        // Let React own the open state instead of the browser closing it.
        event.preventDefault();
        if (!isDeleting) onCancel();
      }}
      onClick={(event) => {
        if (event.target === dialogRef.current && !isDeleting) onCancel();
      }}
      className="border-border-subtle m-auto w-[calc(100%-2rem)] max-w-md rounded-xl border bg-white p-0 text-slate-900 shadow-xl backdrop:bg-slate-900/50"
    >
      <div className="p-5">
        <h2
          id="delete-task-title"
          className="text-base font-semibold text-slate-900"
        >
          Delete this task?
        </h2>
        <p
          id="delete-task-description"
          className="mt-2 text-sm break-words text-slate-600"
        >
          <span className="font-medium text-slate-900">{task.title}</span> will
          be permanently removed. This cannot be undone.
        </p>

        {errorMessage ? (
          <p role="alert" className="text-danger-700 mt-3 text-sm">
            {errorMessage}
          </p>
        ) : null}

        <div className="mt-5 flex justify-end gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={onCancel}
            disabled={isDeleting}
            autoFocus
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={handleConfirm}
            isLoading={isDeleting}
          >
            {isDeleting ? "Deleting…" : "Delete"}
          </Button>
        </div>
      </div>
    </dialog>
  );
}
