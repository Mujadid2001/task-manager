import { describe, expect, it, vi } from "vitest";

import { DatabaseError } from "./db";
import { createTaskSchema } from "./validators";
import {
  API_ERROR_CODES,
  apiError,
  apiSuccess,
  invalidJsonError,
  notFoundError,
  readJsonBody,
  toErrorResponse,
  validationError,
} from "./api";

async function body(response: Response): Promise<unknown> {
  return response.json();
}

describe("apiSuccess", () => {
  it("wraps the payload in a data envelope", async () => {
    const response = apiSuccess({ id: "1" });

    expect(response.status).toBe(200);
    await expect(body(response)).resolves.toEqual({ data: { id: "1" } });
  });

  it("uses the provided status", async () => {
    expect(apiSuccess({ id: "1" }, 201).status).toBe(201);
  });
});

describe("apiError", () => {
  it("builds the error envelope", async () => {
    const response = apiError(API_ERROR_CODES.NOT_FOUND, "missing", 404);

    expect(response.status).toBe(404);
    await expect(body(response)).resolves.toEqual({
      error: { code: "NOT_FOUND", message: "missing" },
    });
  });

  it("includes details only when provided", async () => {
    const withDetails = await body(
      apiError(API_ERROR_CODES.VALIDATION_ERROR, "bad", 400, [
        { path: "title", message: "Title is required" },
      ]),
    );
    const withoutDetails = await body(
      apiError(API_ERROR_CODES.VALIDATION_ERROR, "bad", 400),
    );

    expect(withDetails).toHaveProperty("error.details");
    expect(withoutDetails).not.toHaveProperty("error.details");
  });
});

describe("validationError", () => {
  it("turns a Zod error into field-level details", async () => {
    const result = createTaskSchema.safeParse({});
    const response = validationError(result.error!);

    expect(response.status).toBe(400);
    await expect(body(response)).resolves.toEqual({
      error: {
        code: "VALIDATION_ERROR",
        message: "The submitted task is not valid.",
        details: [{ path: "title", message: "Title is required" }],
      },
    });
  });
});

describe("invalidJsonError", () => {
  it("answers 400 with the INVALID_JSON code", async () => {
    const response = invalidJsonError();

    expect(response.status).toBe(400);
    await expect(body(response)).resolves.toMatchObject({
      error: { code: "INVALID_JSON" },
    });
  });
});

describe("notFoundError", () => {
  it("answers 404 with the NOT_FOUND code", async () => {
    const response = notFoundError();

    expect(response.status).toBe(404);
    await expect(body(response)).resolves.toMatchObject({
      error: { code: "NOT_FOUND" },
    });
  });
});

describe("toErrorResponse", () => {
  it("maps a database failure to a generic 500 without leaking the cause", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const response = toErrorResponse(
      new DatabaseError("connection string postgres://secret"),
      "GET /api/tasks",
    );

    expect(response.status).toBe(500);
    const payload = (await body(response)) as {
      error: { code: string; message: string };
    };

    expect(payload.error.code).toBe("DATABASE_ERROR");
    expect(payload.error.message).not.toContain("postgres://secret");
  });

  it("maps an unknown failure to INTERNAL_ERROR", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const response = toErrorResponse(new Error("kaboom"), "GET /api/tasks");

    expect(response.status).toBe(500);
    await expect(body(response)).resolves.toMatchObject({
      error: { code: "INTERNAL_ERROR" },
    });
  });

  it("logs the original error for debugging", () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const original = new Error("kaboom");

    toErrorResponse(original, "GET /api/tasks");

    expect(log).toHaveBeenCalledWith("GET /api/tasks failed:", original);
  });
});

describe("readJsonBody", () => {
  it("parses a valid JSON body", async () => {
    const request = new Request("http://localhost/api/tasks", {
      method: "POST",
      body: JSON.stringify({ title: "Ship it" }),
    });

    await expect(readJsonBody(request)).resolves.toEqual({
      ok: true,
      value: { title: "Ship it" },
    });
  });

  it("returns a 400 response instead of throwing on malformed JSON", async () => {
    const request = new Request("http://localhost/api/tasks", {
      method: "POST",
      body: "{not json",
    });
    const result = await readJsonBody(request);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(400);
      await expect(body(result.response)).resolves.toMatchObject({
        error: { code: "INVALID_JSON" },
      });
    }
  });
});
