import type { Task } from "./types";
import type { CreateTaskInput, UpdateTaskInput } from "./validators";

export interface ApiErrorDetail {
  path: string;
  message: string;
}

/**
 * An error returned by the REST API.
 *
 * The status code and the per-field details are kept on the error so a form
 * can render a message next to the input that caused it.
 */
export class ApiClientError extends Error {
  readonly status: number;
  readonly details: ApiErrorDetail[];

  constructor(message: string, status: number, details: ApiErrorDetail[] = []) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.details = details;
  }

  /** Returns the message for a given field, if the API reported one. */
  messageForField(path: string): string | undefined {
    return this.details.find((detail) => detail.path === path)?.message;
  }
}

interface ApiEnvelope<T> {
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: ApiErrorDetail[];
  };
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  let payload: ApiEnvelope<T> | null = null;
  try {
    payload = (await response.json()) as ApiEnvelope<T>;
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const error = payload?.error;
    throw new ApiClientError(
      error?.message ?? "The request could not be completed.",
      response.status,
      error?.details ?? [],
    );
  }

  return payload?.data as T;
}

/**
 * Thin typed wrapper around the tasks REST API.
 *
 * Keeping the fetch calls in one place means the components never deal with
 * URLs, status codes or the response envelope.
 */
export const tasksApi = {
  list(): Promise<Task[]> {
    return request<Task[]>("/api/tasks");
  },

  create(input: CreateTaskInput): Promise<Task> {
    return request<Task>("/api/tasks", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  update(id: string, input: UpdateTaskInput): Promise<Task> {
    return request<Task>(`/api/tasks/${id}`, {
      method: "PUT",
      body: JSON.stringify(input),
    });
  },

  remove(id: string): Promise<{ id: string; deleted: boolean }> {
    return request<{ id: string; deleted: boolean }>(`/api/tasks/${id}`, {
      method: "DELETE",
    });
  },
};
