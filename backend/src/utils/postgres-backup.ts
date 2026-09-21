import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

function getDatabaseUrl(): string {
  const configuredUrl = process.env.DATABASE_URL?.trim();
  if (configuredUrl) return configuredUrl;

  const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT } = process.env;
  if (!DB_HOST || !DB_USER || !DB_NAME) {
    throw new Error(
      "Missing PostgreSQL configuration. Set DATABASE_URL or DB_HOST, DB_USER, DB_NAME, and DB_PORT."
    );
  }

  const url = new URL("postgresql://localhost");
  url.hostname = DB_HOST;
  url.port = DB_PORT || "5432";
  url.username = DB_USER;
  url.password = DB_PASSWORD || "";
  url.pathname = `/${DB_NAME}`;
  if (process.env.PGSSLMODE === "require" || process.env.DB_SSL === "true") {
    url.searchParams.set("sslmode", "require");
  }
  return url.toString();
}

async function runTool(
  binary: string,
  args: string[],
  operation: string
): Promise<void> {
  try {
    await execFileAsync(binary, args, {
      env: process.env,
      maxBuffer: 10 * 1024 * 1024,
    });
  } catch (error: any) {
    const detail = [error?.stderr, error?.stdout, error?.message]
      .filter(Boolean)
      .join("\n")
      .trim();
    throw new Error(
      `${operation} failed. Ensure ${binary} is installed and the Supabase connection is reachable.${detail ? ` ${detail}` : ""}`
    );
  }
}

export async function createPostgresBackup(backupPath: string): Promise<void> {
  const databaseUrl = getDatabaseUrl();
  await runTool(
    process.env.PG_DUMP_BIN || "pg_dump",
    [
      "--dbname",
      databaseUrl,
      "--format=plain",
      "--no-owner",
      "--no-privileges",
      "--clean",
      "--if-exists",
      "--file",
      backupPath,
    ],
    "PostgreSQL backup"
  );
}

export async function restorePostgresBackup(backupPath: string): Promise<void> {
  const databaseUrl = getDatabaseUrl();
  await runTool(
    process.env.PSQL_BIN || "psql",
    [
      "--dbname",
      databaseUrl,
      "--set",
      "ON_ERROR_STOP=1",
      "--single-transaction",
      "--file",
      backupPath,
    ],
    "PostgreSQL restore"
  );
}
