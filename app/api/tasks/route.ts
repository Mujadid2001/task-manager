import { NextResponse } from "next/server";

import { createTask, listTasks } from "@/lib/tasks";
import { createTaskSchema, formatValidationIssues } from "@/lib/validators";

// Tasks are live data, so this route must never be served from a cache.
export const dynamic = "force-dynamic";

/**
 * GET /api/tasks — list every task.
 */
export async function GET() {
  try {
    const tasks = await listTasks();

    return NextResponse.json({ data: tasks }, { status: 200 });
  } catch (error) {
    console.error("GET /api/tasks failed:", error);

    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to load tasks. Please try again.",
        },
      },
      { status: 500 },
    );
  }
}

/**
 * POST /api/tasks — create a task.
 */
export async function POST(request: Request) {
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

  const parsed = createTaskSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "The submitted task is not valid.",
          details: formatValidationIssues(parsed.error),
        },
      },
      { status: 400 },
    );
  }

  try {
    const task = await createTask(parsed.data);

    return NextResponse.json({ data: task }, { status: 201 });
  } catch (error) {
    console.error("POST /api/tasks failed:", error);

    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to create the task. Please try again.",
        },
      },
      { status: 500 },
    );
  }
}
