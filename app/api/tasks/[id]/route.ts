import { NextResponse } from "next/server";

import { deleteTask, updateTask } from "@/lib/tasks";
import {
  formatValidationIssues,
  taskIdSchema,
  updateTaskSchema,
} from "@/lib/validators";

// A task is live data, so this route must never be served from a cache.
export const dynamic = "force-dynamic";

type TaskRouteContext = { params: Promise<{ id: string }> };

/**
 * PUT /api/tasks/:id — update a task.
 */
export async function PUT(request: Request, { params }: TaskRouteContext) {
  const { id } = await params;

  const parsedId = taskIdSchema.safeParse(id);
  if (!parsedId.success) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "The task id is not valid.",
          details: formatValidationIssues(parsedId.error),
        },
      },
      { status: 400 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_JSON",
          message: "Request body must be valid JSON.",
        },
      },
      { status: 400 },
    );
  }

  const parsedBody = updateTaskSchema.safeParse(body);
  if (!parsedBody.success) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "The submitted task is not valid.",
          details: formatValidationIssues(parsedBody.error),
        },
      },
      { status: 400 },
    );
  }

  try {
    const task = await updateTask(parsedId.data, parsedBody.data);

    if (!task) {
      return NextResponse.json(
        {
          error: {
            code: "NOT_FOUND",
            message: "The task does not exist.",
          },
        },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: task }, { status: 200 });
  } catch (error) {
    console.error(`PUT /api/tasks/${id} failed:`, error);

    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to update the task. Please try again.",
        },
      },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/tasks/:id — delete a task.
 */
export async function DELETE(_request: Request, { params }: TaskRouteContext) {
  const { id } = await params;

  const parsedId = taskIdSchema.safeParse(id);
  if (!parsedId.success) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "The task id is not valid.",
          details: formatValidationIssues(parsedId.error),
        },
      },
      { status: 400 },
    );
  }

  try {
    const deleted = await deleteTask(parsedId.data);

    if (!deleted) {
      return NextResponse.json(
        {
          error: {
            code: "NOT_FOUND",
            message: "The task does not exist.",
          },
        },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { data: { id: parsedId.data, deleted: true } },
      { status: 200 },
    );
  } catch (error) {
    console.error(`DELETE /api/tasks/${id} failed:`, error);

    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to delete the task. Please try again.",
        },
      },
      { status: 500 },
    );
  }
}
