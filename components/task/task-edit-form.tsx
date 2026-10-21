"use client";

import { useId, useState } from "react";

import { ApiClientError } from "@/lib/api-client";
import type { Task } from "@/lib/types";
import {
  DESCRIPTION_MAX_LENGTH,
  TITLE_MAX_LENGTH,
  updateTaskSchema,
} from "@/lib/validators";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface FieldErrors {
  title?: string;
  description?: string;
}

/**
 * Inline editor for an existing task.
 *
 * Escape cancels, which is the behaviour a keyboard user expects from an
 * inline edit, and the submitted payload is validated with the same schema
 * the API uses.
 */
export function TaskEditForm({
  task,
  onSave,
  onCancel,
}: {
  task: Task;
  onSave: (input: {
    title: string;
    description: string | null;
  }) => Promise<void>;
  onCancel: () => void;
}) {
  const formId = useId().replace(/[^a-zA-Z0-9-]/g, "");
  const titleId = `${formId}-title`;
  const descriptionId = `${formId}-description`;

  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const parsed = updateTaskSchema.safeParse({ title, description });

    if (!parsed.success) {
      const errors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (field === "title" || field === "description") {
          errors[field] ??= issue.message;
        }
      }
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setIsSaving(true);

    try {
      await onSave({
        title: parsed.data.title ?? task.title,
        description: parsed.data.description ?? null,
      });
    } catch (error) {
      if (error instanceof ApiClientError) {
        setFieldErrors({
          title: error.messageForField("title"),
          description: error.messageForField("description"),
        });
        if (error.details.length === 0) {
          setFormError(error.message);
        }
      } else {
        setFormError(
          "The changes could not be saved. Please check your connection and try again.",
        );
      }
      setIsSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          onCancel();
        }
      }}
      noValidate
      className="space-y-3"
      aria-label={`Edit task: ${task.title}`}
    >
      <Input
        id={titleId}
        label="Title"
        name="edit-title"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        maxLength={TITLE_MAX_LENGTH}
        autoComplete="off"
        disabled={isSaving}
        error={fieldErrors.title}
        autoFocus
        required
      />

      <Textarea
        id={descriptionId}
        label="Description (optional)"
        name="edit-description"
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        maxLength={DESCRIPTION_MAX_LENGTH}
        disabled={isSaving}
        error={fieldErrors.description}
        rows={2}
      />

      {formError ? (
        <p role="alert" className="text-danger-700 text-sm">
          {formError}
        </p>
      ) : null}

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={onCancel}
          disabled={isSaving}
        >
          Cancel
        </Button>
        <Button type="submit" size="sm" isLoading={isSaving}>
          {isSaving ? "Saving…" : "Save"}
        </Button>
      </div>
    </form>
  );
}
