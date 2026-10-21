import { describe, expect, it } from "vitest";

import type { Task } from "./types";
import { sortTasks } from "./sort";

function task(overrides: Partial<Task> & Pick<Task, "id">): Task {
  return {
    title: overrides.id,
    description: null,
    completed: false,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("sortTasks", () => {
  it("puts open tasks before completed ones whatever the dates", () => {
    const oldOpen = task({ id: "open", createdAt: "2026-01-01T00:00:00.000Z" });
    const newDone = task({
      id: "done",
      completed: true,
      createdAt: "2026-12-31T00:00:00.000Z",
    });

    expect(sortTasks([newDone, oldOpen]).map((item) => item.id)).toEqual([
      "open",
      "done",
    ]);
  });

  it("orders each group newest first", () => {
    const older = task({ id: "older", createdAt: "2026-01-01T00:00:00.000Z" });
    const newer = task({ id: "newer", createdAt: "2026-06-01T00:00:00.000Z" });
    const doneOlder = task({
      id: "done-older",
      completed: true,
      createdAt: "2026-01-01T00:00:00.000Z",
    });
    const doneNewer = task({
      id: "done-newer",
      completed: true,
      createdAt: "2026-06-01T00:00:00.000Z",
    });

    expect(
      sortTasks([older, doneNewer, newer, doneOlder]).map((item) => item.id),
    ).toEqual(["newer", "older", "done-newer", "done-older"]);
  });

  it("does not mutate the input array", () => {
    const tasks = [
      task({ id: "a", createdAt: "2026-01-01T00:00:00.000Z" }),
      task({ id: "b", createdAt: "2026-02-01T00:00:00.000Z" }),
    ];
    const original = [...tasks];

    sortTasks(tasks);

    expect(tasks).toEqual(original);
  });

  it("returns an empty array unchanged", () => {
    expect(sortTasks([])).toEqual([]);
  });
});
