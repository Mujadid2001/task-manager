import { NextResponse } from "next/server";

import {
  apiSuccess,
  notFoundError,
  readJsonBody,
  toErrorResponse,
  validationError,
} from "@/lib/api";
import { deleteTask, updateTask } from "@/lib/tasks";
import { taskIdSchema, updateTaskSchema } from "@/lib/validators";

// A task is live data, so this route must never be served from a cache.
export const dynamic = "force-dynamic";

type TaskRouteContext = { params: Promise<{ id: string }> };

/**
 * Validates the task id from the route.
 *
 * Returns the parsed id, or a 400 response when the id is not a UUID.
 */
async function parseTaskId(
  context: TaskRouteContext,
): Promise<{ ok: true; id: string } | { ok: false; response: NextResponse }> {
  const { id } = await context.params;
  const parsed = taskIdSchema.safeParse(id);

  if (!parsed.success) {
    return {
      ok: false,
      response: validationError(parsed.error, "The task id is not valid."),
    };
  }

  return { ok: true, id: parsed.data };
}

/**
 * PUT /api/tasks/:id — update a task.
 */
export async function PUT(
  request: Request,
  context: TaskRouteContext,
): Promise<NextResponse> {
  const taskId = await parseTaskId(context);

  if (!taskId.ok) {
    return taskId.response;
  }

  const body = await readJsonBody(request);

  if (!body.ok) {
    return body.response;
  }

  const parsed = updateTaskSchema.safeParse(body.value);

  if (!parsed.success) {
    return validationError(parsed.error);
  }

  try {
    const task = await updateTask(taskId.id, parsed.data);

    if (!task) {
      return notFoundError();
    }

    return apiSuccess(task);
  } catch (error) {
    return toErrorResponse(error, `PUT /api/tasks/${taskId.id}`);
  }
}

/**
 * DELETE /api/tasks/:id — delete a task.
 */
export async function DELETE(
  _request: Request,
  context: TaskRouteContext,
): Promise<NextResponse> {
  const taskId = await parseTaskId(context);

  if (!taskId.ok) {
    return taskId.response;
  }

  try {
    const deleted = await deleteTask(taskId.id);

    if (!deleted) {
      return notFoundError();
    }

    return apiSuccess({ id: taskId.id, deleted: true });
  } catch (error) {
    return toErrorResponse(error, `DELETE /api/tasks/${taskId.id}`);
  }
}
