import { DatabaseError, query } from "./db";
import type { Task } from "./types";
import type { CreateTaskInput, UpdateTaskInput } from "./validators";

/**
 * Column list shared by every read of a task.
 *
 * The snake_case columns are aliased to the camelCase names used by the API.
 */
const TASK_COLUMNS = `id, title, description, completed,
  created_at AS "createdAt", updated_at AS "updatedAt"`;

/**
 * Lists every task, open tasks first and newest first within each group.
 */
export async function listTasks(): Promise<Task[]> {
  const rows = await query(
    (sql) => sql`
    SELECT ${sql.unsafe(TASK_COLUMNS)}
    FROM tasks
    ORDER BY completed ASC, created_at DESC
  `,
  );

  return rows as Task[];
}

/**
 * Returns a single task, or `null` when no task has that id.
 */
export async function getTask(id: string): Promise<Task | null> {
  const rows = await query(
    (sql) => sql`
    SELECT ${sql.unsafe(TASK_COLUMNS)}
    FROM tasks
    WHERE id = ${id}
  `,
  );

  return (rows[0] as Task | undefined) ?? null;
}

/**
 * Inserts a task and returns the stored row.
 */
export async function createTask(input: CreateTaskInput): Promise<Task> {
  const rows = await query(
    (sql) => sql`
    INSERT INTO tasks (title, description, completed)
    VALUES (${input.title}, ${input.description ?? null}, ${input.completed ?? false})
    RETURNING ${sql.unsafe(TASK_COLUMNS)}
  `,
  );

  const task = rows[0] as Task | undefined;
  if (!task) {
    throw new DatabaseError("The task was not created.");
  }

  return task;
}

/**
 * Applies a partial update to a task and returns the stored row, or `null`
 * when no task has that id.
 *
 * The SET clause is assembled from a fixed list of column names, and every
 * value is sent as a bind parameter. No user input ever reaches the SQL
 * string itself.
 */
export async function updateTask(
  id: string,
  input: UpdateTaskInput,
): Promise<Task | null> {
  const assignments: string[] = [];
  const params: unknown[] = [];

  if (input.title !== undefined) {
    params.push(input.title);
    assignments.push(`title = $${params.length}`);
  }

  if (input.description !== undefined) {
    params.push(input.description);
    assignments.push(`description = $${params.length}`);
  }

  if (input.completed !== undefined) {
    params.push(input.completed);
    assignments.push(`completed = $${params.length}`);
  }

  params.push(id);

  const rows = await query((sql) =>
    sql.query(
      `UPDATE tasks
       SET ${assignments.join(", ")}
       WHERE id = $${params.length}
       RETURNING ${TASK_COLUMNS}`,
      params,
    ),
  );

  return (rows[0] as Task | undefined) ?? null;
}

/**
 * Deletes a task and reports whether a row was actually removed.
 */
export async function deleteTask(id: string): Promise<boolean> {
  const rows = await query(
    (sql) => sql`
    DELETE FROM tasks
    WHERE id = ${id}
    RETURNING id
  `,
  );

  return rows.length > 0;
}
