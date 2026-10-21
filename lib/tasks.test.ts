import type { NeonQueryFunction } from "@neondatabase/serverless";
import { describe, expect, it } from "vitest";

import { DatabaseError, setSql } from "./db";
import {
  createTask,
  deleteTask,
  getTask,
  listTasks,
  updateTask,
} from "./tasks";

type Row = Record<string, unknown>;
type Handler = (sqlText: string, values: unknown[]) => Row[];

interface Call {
  sql: string;
  values: unknown[];
}

/**
 * Installs a fake Neon client that records every query and answers with the
 * rows the handler returns. Allowing the tests to assert on the generated SQL
 * and its bind parameters without a live database.
 */
function installFakeClient(handler: Handler): Call[] {
  const calls: Call[] = [];

  function run(sqlText: string, values: unknown[]): Promise<Row[]> {
    calls.push({ sql: sqlText, values });
    return Promise.resolve(handler(sqlText, values));
  }

  const client = ((strings: TemplateStringsArray, ...values: unknown[]) =>
    run(strings.join("?"), values)) as unknown as {
    (strings: TemplateStringsArray, ...values: unknown[]): Promise<Row[]>;
    unsafe: (value: string) => string;
    query: (text: string, params: unknown[]) => Promise<Row[]>;
  };

  client.unsafe = (value) => value;
  client.query = (text, params) => run(text, params);
  setSql(client as unknown as NeonQueryFunction<false, false>);

  return calls;
}

describe("listTasks", () => {
  it("orders open tasks first and newest first", async () => {
    const rows = [{ id: "1" }, { id: "2" }];
    const calls = installFakeClient(() => rows);

    await expect(listTasks()).resolves.toEqual(rows);
    expect(calls[0]?.sql).toContain("FROM tasks");
    expect(calls[0]?.sql).toContain("ORDER BY completed ASC, created_at DESC");
  });
});

describe("getTask", () => {
  it("returns the matching row", async () => {
    const calls = installFakeClient(() => [{ id: "task-1" }]);

    await expect(getTask("task-1")).resolves.toEqual({ id: "task-1" });
    expect(calls[0]?.sql).toContain("WHERE id = ?");
    expect(calls[0]?.values).toContain("task-1");
  });

  it("returns null when nothing matches", async () => {
    installFakeClient(() => []);

    await expect(getTask("missing")).resolves.toBeNull();
  });
});

describe("createTask", () => {
  it("returns the inserted row", async () => {
    const calls = installFakeClient(() => [{ id: "new" }]);

    await expect(
      createTask({ title: "Ship it", completed: false }),
    ).resolves.toEqual({
      id: "new",
    });
    expect(calls[0]?.sql).toContain("INSERT INTO tasks");
    expect(calls[0]?.values.slice(0, 3)).toEqual(["Ship it", null, false]);
  });

  it("defaults a missing description to null and completed to false", async () => {
    const calls = installFakeClient(() => [{ id: "new" }]);

    await createTask({ title: "Ship it" } as never);

    expect(calls[0]?.values.slice(0, 3)).toEqual(["Ship it", null, false]);
  });

  it("throws when the insert returns no row", async () => {
    installFakeClient(() => []);

    await expect(
      createTask({ title: "Ship it", completed: false }),
    ).rejects.toBeInstanceOf(DatabaseError);
  });
});

describe("updateTask", () => {
  it("only sets the fields that were provided", async () => {
    const calls = installFakeClient(() => [{ id: "task-1", title: "Renamed" }]);

    await expect(updateTask("task-1", { title: "Renamed" })).resolves.toEqual({
      id: "task-1",
      title: "Renamed",
    });
    expect(calls[0]?.sql).toContain("SET title = $1");
    expect(calls[0]?.sql).not.toContain("description =");
    expect(calls[0]?.sql).not.toContain("completed =");
    expect(calls[0]?.values).toEqual(["Renamed", "task-1"]);
  });

  it("binds every provided field in order with the id last", async () => {
    const calls = installFakeClient(() => [{ id: "task-1" }]);

    await updateTask("task-1", {
      title: "Renamed",
      description: "Notes",
      completed: true,
    });

    expect(calls[0]?.sql).toContain("title = $1");
    expect(calls[0]?.sql).toContain("description = $2");
    expect(calls[0]?.sql).toContain("completed = $3");
    expect(calls[0]?.sql).toContain("WHERE id = $4");
    expect(calls[0]?.values).toEqual(["Renamed", "Notes", true, "task-1"]);
  });

  it("clears the description when null is provided", async () => {
    const calls = installFakeClient(() => [{ id: "task-1" }]);

    await updateTask("task-1", { description: null });

    expect(calls[0]?.sql).toContain("description = $1");
    expect(calls[0]?.values).toEqual([null, "task-1"]);
  });

  it("returns null when no row was updated", async () => {
    installFakeClient(() => []);

    await expect(
      updateTask("missing", { completed: true }),
    ).resolves.toBeNull();
  });
});

describe("deleteTask", () => {
  it("reports true when a row was removed", async () => {
    const calls = installFakeClient(() => [{ id: "task-1" }]);

    await expect(deleteTask("task-1")).resolves.toBe(true);
    expect(calls[0]?.sql).toContain("DELETE FROM tasks");
    expect(calls[0]?.values).toEqual(["task-1"]);
  });

  it("reports false when nothing was removed", async () => {
    installFakeClient(() => []);

    await expect(deleteTask("missing")).resolves.toBe(false);
  });
});
