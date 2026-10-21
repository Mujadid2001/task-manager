/**
 * Applies `db/schema.sql` to the database configured by DATABASE_URL.
 *
 * The Neon HTTP driver only accepts a single statement per request, so the
 * schema file is split on its `-- statement-breakpoint` markers and each
 * statement is executed on its own.
 *
 * Usage: npm run db:setup
 */
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { getSql } from "../lib/db";

const STATEMENT_SEPARATOR = /^\s*--\s*statement-breakpoint\s*$/gm;

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const schemaPath = resolve(scriptDirectory, "..", "db", "schema.sql");

/**
 * Splits the schema file into individual statements.
 *
 * The separator is matched on its own line so that the marker can be
 * mentioned in prose inside a comment without breaking the split. Chunks that
 * contain nothing but comments are dropped, because Postgres rejects them.
 */
function splitStatements(schema: string): string[] {
  return schema
    .split(STATEMENT_SEPARATOR)
    .map((statement) => {
      const withoutComments = statement
        .split("\n")
        .filter((line) => !line.trim().startsWith("--"))
        .join("\n");
      return withoutComments.trim();
    })
    .filter((statement) => statement.length > 0);
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Retries a query a few times with exponential backoff.
 *
 * The connection to the database occasionally drops mid-request, which would
 * otherwise abort the whole setup halfway through and leave the schema half
 * applied. Every statement in the schema file is idempotent, so re-running a
 * failed statement is safe.
 */
async function withRetry<T>(
  operation: () => Promise<T>,
  attempts = 3,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt === attempts) break;
      const delay = 500 * 2 ** (attempt - 1);
      console.warn(
        `  ! attempt ${attempt} failed (${error instanceof Error ? error.message : "unknown error"}), retrying in ${delay}ms`,
      );
      await sleep(delay);
    }
  }

  throw lastError;
}

async function main(): Promise<void> {
  const sql = getSql();
  const schema = await readFile(schemaPath, "utf8");
  const statements = splitStatements(schema);

  console.log(`Applying ${statements.length} statements from db/schema.sql`);

  for (const [index, statement] of statements.entries()) {
    const label = statement.split("\n")[0]?.slice(0, 60) ?? "statement";
    await withRetry(() => sql.query(statement));
    console.log(`  [${index + 1}/${statements.length}] ${label}`);
  }

  const result = await withRetry(() =>
    sql.query(
      "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'tasks' ORDER BY ordinal_position",
    ),
  );
  const columns = result.map((row) => row.column_name);

  console.log(`\nSchema applied. tasks columns: ${columns.join(", ")}`);
  console.log("Database setup complete.");
}

main().catch((error: unknown) => {
  console.error("\nDatabase setup failed.");
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
