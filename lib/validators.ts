import { z } from "zod";

/** Maximum length of a task title, matching the VARCHAR(255) column. */
export const TITLE_MAX_LENGTH = 255;

/** Upper bound for the free-form description, to keep payloads sane. */
export const DESCRIPTION_MAX_LENGTH = 5000;

const title = z
  .string({ error: "Title is required" })
  .trim()
  .min(1, "Title is required")
  .max(
    TITLE_MAX_LENGTH,
    `Title must be ${TITLE_MAX_LENGTH} characters or fewer`,
  );

const description = z
  .string()
  .trim()
  .max(
    DESCRIPTION_MAX_LENGTH,
    `Description must be ${DESCRIPTION_MAX_LENGTH} characters or fewer`,
  )
  .transform((value) => (value.length === 0 ? null : value))
  .nullable()
  .optional();

/** Payload accepted by `POST /api/tasks`. */
export const createTaskSchema = z.object({
  title,
  description,
  completed: z.boolean().optional().default(false),
});

/**
 * Payload accepted by `PUT /api/tasks/:id`.
 *
 * Every field is optional so a caller can send a partial update, but at
 * least one field has to be present — otherwise the request is meaningless.
 */
export const updateTaskSchema = z
  .object({
    title: title.optional(),
    description,
    completed: z.boolean().optional(),
  })
  .refine(
    (payload) => Object.keys(payload).length > 0,
    "At least one of title, description or completed must be provided",
  );

/** Path parameter for a single task. */
export const taskIdSchema = z.string().uuid("Task id must be a valid UUID");

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

/**
 * Flattens a Zod error into a list of field-level messages that the client
 * can render next to the offending input.
 */
export function formatValidationIssues(
  error: z.ZodError,
): { path: string; message: string }[] {
  return error.issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message,
  }));
}
