"use client";

import { useId, useState } from "react";

import { ApiClientError } from "@/lib/api-client";
import {
  createTaskSchema,
  DESCRIPTION_MAX_LENGTH,
  TITLE_MAX_LENGTH,
  type CreateTaskInput,
} from "@/lib/validators";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface FieldErrors {
  title?: string;
  description?: string;
}

/**
 * Form for adding a new task.
 *
 * The same Zod schema the API uses validates the input first, so most
 * mistakes are caught without a round trip. If the server still rejects the
 * payload, its field-level details are mapped back onto the inputs.
 */
export function TaskForm({
  onCreate,
}: {
  onCreate: (input: CreateTaskInput) => Promise<void>;
}) {
  // useId keeps these ids unique if the form is ever rendered twice, while the
  // sanitised prefix keeps them free of characters that need escaping.
  const formId = useId().replace(/[^a-zA-Z0-9-]/g, "");
  const titleId = `${formId}-title`;
  const descriptionId = `${formId}-description`;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const parsed = createTaskSchema.safeParse({ title, description });

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
    setIsSubmitting(true);

    try {
      await onCreate(parsed.data);
      setTitle("");
      setDescription("");
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
          "The task could not be added. Please check your connection and try again.",
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="border-border-subtle rounded-xl border bg-white p-4 shadow-sm sm:p-5"
    >
      <h2 className="text-sm font-semibold text-slate-900">Add a task</h2>

      <div className="mt-3 space-y-3">
        <Input
          id={titleId}
          label="Title"
          name="title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="What needs to be done?"
          maxLength={TITLE_MAX_LENGTH}
          autoComplete="off"
          disabled={isSubmitting}
          error={fieldErrors.title}
          hint={`${title.length}/${TITLE_MAX_LENGTH}`}
          required
        />

        <Textarea
          id={descriptionId}
          label="Description (optional)"
          name="description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Add any details that will help later."
          maxLength={DESCRIPTION_MAX_LENGTH}
          disabled={isSubmitting}
          error={fieldErrors.description}
          rows={2}
        />
      </div>

      {formError ? (
        <p role="alert" className="text-danger-700 mt-3 text-sm">
          {formError}
        </p>
      ) : null}

      <div className="mt-4 flex justify-end">
        <Button type="submit" isLoading={isSubmitting}>
          {isSubmitting ? "Adding…" : "Add task"}
        </Button>
      </div>
    </form>
  );
}
