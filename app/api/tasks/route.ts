import { NextResponse } from "next/server";

import {
  apiSuccess,
  readJsonBody,
  toErrorResponse,
  validationError,
} from "@/lib/api";
import { createTask, listTasks } from "@/lib/tasks";
import { createTaskSchema } from "@/lib/validators";

// Tasks are live data, so this route must never be served from a cache.
export const dynamic = "force-dynamic";

/**
 * GET /api/tasks — list every task.
 */
export async function GET(): Promise<NextResponse> {
  try {
    const tasks = await listTasks();

    return apiSuccess(tasks);
  } catch (error) {
    return toErrorResponse(error, "GET /api/tasks");
  }
}

/**
 * POST /api/tasks — create a task.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const body = await readJsonBody(request);

  if (!body.ok) {
    return body.response;
  }

  const parsed = createTaskSchema.safeParse(body.value);

  if (!parsed.success) {
    return validationError(parsed.error);
  }

  try {
    const task = await createTask(parsed.data);

    return apiSuccess(task, 201);
  } catch (error) {
    return toErrorResponse(error, "POST /api/tasks");
  }
}
