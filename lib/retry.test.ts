import { describe, expect, it, vi } from "vitest";

import { isTransientError, withRetry } from "./retry";

const noDelay = { baseDelayMs: 0 };

describe("isTransientError", () => {
  it("treats a fetch failure as transient", () => {
    expect(isTransientError(new TypeError("fetch failed"))).toBe(true);
  });

  it("treats an aggregate connection error as transient", () => {
    expect(
      isTransientError(new AggregateError([], "all connections failed")),
    ).toBe(true);
  });

  it("looks through the cause of a wrapped error", () => {
    const error = new Error("query failed", {
      cause: new TypeError("fetch failed"),
    });

    expect(isTransientError(error)).toBe(true);
  });

  it("recognises connection problems by message", () => {
    expect(
      isTransientError(new Error("ETIMEDOUT connecting to database")),
    ).toBe(true);
    expect(isTransientError(new Error("read ECONNRESET"))).toBe(true);
  });

  it("never retries a database error that carries an error code", () => {
    const violation = Object.assign(new Error("duplicate key"), {
      code: "23505",
    });

    expect(isTransientError(violation)).toBe(false);
  });

  it("ignores unrelated errors and non-errors", () => {
    expect(isTransientError(new Error("boom"))).toBe(false);
    expect(isTransientError("boom")).toBe(false);
    expect(isTransientError(undefined)).toBe(false);
  });
});

describe("withRetry", () => {
  it("returns the first successful result without retrying", async () => {
    const operation = vi.fn().mockResolvedValue("done");
    const onRetry = vi.fn();

    await expect(withRetry(operation, { ...noDelay, onRetry })).resolves.toBe(
      "done",
    );
    expect(operation).toHaveBeenCalledTimes(1);
    expect(onRetry).not.toHaveBeenCalled();
  });

  it("retries a transient failure and returns the eventual result", async () => {
    const operation = vi
      .fn()
      .mockRejectedValueOnce(new TypeError("fetch failed"))
      .mockResolvedValue("recovered");
    const onRetry = vi.fn();

    await expect(withRetry(operation, { ...noDelay, onRetry })).resolves.toBe(
      "recovered",
    );
    expect(operation).toHaveBeenCalledTimes(2);
    expect(onRetry).toHaveBeenCalledWith(expect.any(TypeError), 1);
  });

  it("does not retry a non-transient failure", async () => {
    const violation = Object.assign(new Error("duplicate key"), {
      code: "23505",
    });
    const operation = vi.fn().mockRejectedValue(violation);

    await expect(withRetry(operation, noDelay)).rejects.toBe(violation);
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it("gives up after the configured number of attempts", async () => {
    const operation = vi.fn().mockRejectedValue(new TypeError("fetch failed"));

    await expect(
      withRetry(operation, { ...noDelay, attempts: 3 }),
    ).rejects.toThrow("fetch failed");
    expect(operation).toHaveBeenCalledTimes(3);
  });

  it("reports each retry with its attempt number", async () => {
    const operation = vi
      .fn()
      .mockRejectedValueOnce(new TypeError("fetch failed"))
      .mockRejectedValueOnce(new TypeError("fetch failed"))
      .mockResolvedValue("eventually");
    const onRetry = vi.fn();

    await expect(
      withRetry(operation, { ...noDelay, attempts: 3, onRetry }),
    ).resolves.toBe("eventually");
    expect(onRetry.mock.calls.map(([, attempt]) => attempt)).toEqual([1, 2]);
  });
});
