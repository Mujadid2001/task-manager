import { NextResponse } from "next/server";
import type { ZodError } from "zod";

import { DatabaseError } from "./db";
import { formatValidationIssues } from "./validators";

/**
 * The error codes the API can return.
 *
 * Clients switch on these, so they are part of the public contract and
 * should only ever be extended, never renamed.
 */
export const API_ERROR_CODES = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  INVALID_JSON: "INVALID_JSON",
  NOT_FOUND: "NOT_FOUND",
  DATABASE_ERROR: "DATABASE_ERROR",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

export type ApiErrorCode =
  (typeof API_ERROR_CODES)[keyof typeof API_ERROR_CODES];

export interface ApiErrorDetail {
  path: string;
  message: string;
}

export interface ApiErrorBody {
  code: ApiErrorCode;
  message: string;
  details?: ApiErrorDetail[];
}

/**
 * Wraps a payload in the standard success envelope.
 */
export function apiSuccess<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ data }, { status });
}

/**
 * Builds the standard error envelope.
 */
export function apiError(
  code: ApiErrorCode,
  message: string,
  status: number,
  details?: ApiErrorDetail[],
): NextResponse {
  return NextResponse.json(
    { error: { code, message, ...(details ? { details } : {}) } },
    { status },
  );
}

/**
 * Answers a request whose payload failed schema validation.
 */
export function validationError(
  error: ZodError,
  message = "The submitted task is not valid.",
): NextResponse {
  return apiError(
    API_ERROR_CODES.VALIDATION_ERROR,
    message,
    400,
    formatValidationIssues(error),
  );
}

/**
 * Answers a request whose body could not be parsed as JSON.
 */
export function invalidJsonError(
  message = "Request body must be valid JSON.",
): NextResponse {
  return apiError(API_ERROR_CODES.INVALID_JSON, message, 400);
}

/**
 * Answers a request for a resource that does not exist.
 */
export function notFoundError(
  message = "The task does not exist.",
): NextResponse {
  return apiError(API_ERROR_CODES.NOT_FOUND, message, 404);
}

/**
 * Turns an unexpected error into a response.
 *
 * The underlying error is logged server-side but never sent to the client,
 * so internal details such as connection strings cannot leak to a browser.
 */
export function toErrorResponse(error: unknown, context: string): NextResponse {
  console.error(`${context} failed:`, error);

  if (error instanceof DatabaseError) {
    return apiError(
      API_ERROR_CODES.DATABASE_ERROR,
      "The database is not available right now. Please try again shortly.",
      500,
    );
  }

  return apiError(
    API_ERROR_CODES.INTERNAL_ERROR,
    "Something went wrong. Please try again.",
    500,
  );
}

/**
 * Reads and parses a JSON request body.
 *
 * Returns a discriminated union instead of throwing, so the caller can
 * return the error response without a try/catch around the whole handler.
 */
export async function readJsonBody(
  request: Request,
): Promise<
  { ok: true; value: unknown } | { ok: false; response: NextResponse }
> {
  try {
    return { ok: true, value: await request.json() };
  } catch {
    return { ok: false, response: invalidJsonError() };
  }
}
