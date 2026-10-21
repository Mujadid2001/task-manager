import {
  neon,
  type NeonQueryFunction,
  type QueryResultRow,
} from "@neondatabase/serverless";

import { withRetry } from "./retry";

/**
 * Raised when the database is not reachable or the connection string is
 * missing or invalid. Kept separate from driver errors so route handlers can
 * turn it into an actionable response instead of leaking driver internals.
 */
export class DatabaseError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "DatabaseError";
  }
}

let client: NeonQueryFunction<false, false> | undefined;

/**
 * Returns the shared Neon query client.
 *
 * The client is created lazily so that importing this module never throws:
 * the application can boot and render an explanatory error page when the
 * DATABASE_URL environment variable is missing.
 */
export function getSql(): NeonQueryFunction<false, false> {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new DatabaseError(
      "DATABASE_URL is not set. Copy .env.example to .env.local and provide a Neon connection string.",
    );
  }

  client ??= neon(connectionString);
  return client;
}

/**
 * Runs a query against the database.
 *
 * The query is expressed as a callback so that the tagged template is rebuilt
 * on every attempt, which lets transient connection failures be retried with
 * backoff. Values interpolated into the template are always sent as
 * bind parameters, never concatenated into the SQL string.
 */
export async function query<T extends QueryResultRow = QueryResultRow>(
  build: (sql: NeonQueryFunction<false, false>) => Promise<T[]>,
): Promise<T[]> {
  try {
    return await withRetry(() => build(getSql()));
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }

    throw new DatabaseError("Failed to execute the database query.", {
      cause: error,
    });
  }
}

/** Test seam: allows the client to be replaced or reset between runs. */
export function setSql(nextClient: NeonQueryFunction<false, false>): void {
  client = nextClient;
}
