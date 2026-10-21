import { describe, expect, it } from "vitest";

import {
  DESCRIPTION_MAX_LENGTH,
  TITLE_MAX_LENGTH,
  createTaskSchema,
  formatValidationIssues,
  taskIdSchema,
  updateTaskSchema,
} from "./validators";

describe("createTaskSchema", () => {
  it("trims the title and defaults completed to false", () => {
    const result = createTaskSchema.parse({ title: "  Buy milk  " });

    expect(result.title).toBe("Buy milk");
    expect(result.completed).toBe(false);
  });

  it("keeps an explicit completed value", () => {
    expect(
      createTaskSchema.parse({ title: "Ship it", completed: true }),
    ).toEqual({ title: "Ship it", completed: true });
  });

  it("turns an empty description into null", () => {
    const result = createTaskSchema.parse({
      title: "Ship it",
      description: "  ",
    });

    expect(result.description).toBeNull();
  });

  it("keeps a non-empty description, trimmed", () => {
    const result = createTaskSchema.parse({
      title: "Ship it",
      description: "  with notes  ",
    });

    expect(result.description).toBe("with notes");
  });

  it("rejects a missing title", () => {
    const result = createTaskSchema.safeParse({});

    expect(result.success).toBe(false);
    expect(formatValidationIssues(result.error!)).toEqual([
      { path: "title", message: "Title is required" },
    ]);
  });

  it("rejects a whitespace-only title", () => {
    const result = createTaskSchema.safeParse({ title: "   " });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("Title is required");
  });

  it("accepts a title of exactly the maximum length", () => {
    const result = createTaskSchema.safeParse({
      title: "a".repeat(TITLE_MAX_LENGTH),
    });

    expect(result.success).toBe(true);
  });

  it("rejects a title one character over the maximum length", () => {
    const result = createTaskSchema.safeParse({
      title: "a".repeat(TITLE_MAX_LENGTH + 1),
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toContain(
      String(TITLE_MAX_LENGTH),
    );
  });

  it("rejects a description over the maximum length", () => {
    const result = createTaskSchema.safeParse({
      title: "Ship it",
      description: "a".repeat(DESCRIPTION_MAX_LENGTH + 1),
    });

    expect(result.success).toBe(false);
  });

  it("rejects a non-string title", () => {
    const result = createTaskSchema.safeParse({ title: 42 });

    expect(result.success).toBe(false);
  });

  it("rejects a non-boolean completed flag", () => {
    const result = createTaskSchema.safeParse({
      title: "Ship it",
      completed: "yes",
    });

    expect(result.success).toBe(false);
  });
});

describe("updateTaskSchema", () => {
  it("accepts a single completed field", () => {
    expect(updateTaskSchema.parse({ completed: true })).toEqual({
      completed: true,
    });
  });

  it("accepts a single title field", () => {
    expect(updateTaskSchema.parse({ title: "Renamed" })).toEqual({
      title: "Renamed",
    });
  });

  it("accepts a description of null to clear it", () => {
    expect(updateTaskSchema.parse({ description: null })).toEqual({
      description: null,
    });
  });

  it("rejects an empty payload", () => {
    const result = updateTaskSchema.safeParse({});

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe(
      "At least one of title, description or completed must be provided",
    );
  });

  it("rejects a title that would become empty after trimming", () => {
    const result = updateTaskSchema.safeParse({ title: "   " });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("Title is required");
  });
});

describe("taskIdSchema", () => {
  it("accepts a UUID", () => {
    expect(
      taskIdSchema.safeParse("3b36ba11-d9e8-4056-a7d7-7a36344865f1").success,
    ).toBe(true);
  });

  it("rejects a non-UUID path parameter", () => {
    const result = taskIdSchema.safeParse("not-a-uuid");

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe(
      "Task id must be a valid UUID",
    );
  });
});
