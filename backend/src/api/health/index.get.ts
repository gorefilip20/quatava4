import { Client } from "pg";
import { createError } from "@b/utils/error";

function sslEnabled(): boolean {
  const explicit = process.env.DB_SSL?.trim().toLowerCase();
  if (explicit === "false" || explicit === "0" || explicit === "disable") return false;
  if (explicit === "true" || explicit === "1") return true;
  if (process.env.PGSSLMODE?.trim().toLowerCase() === "require") return true;
  return process.env.DATABASE_URL?.toLowerCase().includes("supabase") === true;
}

function positiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export const metadata = {
  summary: "Checks application and database health",
  description: "Returns a safe health status without exposing connection details.",
  operationId: "healthCheck",
  tags: ["System"],
  requiresAuth: false,
  responses: {
    200: { description: "Application and database are healthy" },
    503: { description: "Application or database is unavailable" },
  },
};

export default async () => {
  const startedAt = Date.now();
  const databaseUrl = process.env.DATABASE_URL?.trim();
  let client: Client | undefined;

  try {
    if (!databaseUrl && (!process.env.DB_HOST || !process.env.DB_NAME || !process.env.DB_USER)) {
      throw new Error("Missing DATABASE_URL or DB_HOST, DB_NAME, and DB_USER");
    }

    client = new Client({
      ...(databaseUrl
        ? { connectionString: databaseUrl }
        : {
            host: process.env.DB_HOST,
            port: positiveInteger(process.env.DB_PORT, 5432),
            database: process.env.DB_NAME,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD || "",
          }),
      connectionTimeoutMillis: positiveInteger(process.env.DB_CONNECT_TIMEOUT_MS, 10000),
      keepAlive: true,
      ...(sslEnabled() ? { ssl: { rejectUnauthorized: false } } : {}),
      application_name: process.env.PG_APPLICATION_NAME || "quatava-health",
    });

    await client.connect();
    await client.query("SELECT 1");

    return {
      status: "ok",
      database: "ok",
      dialect: "postgres",
      checkedAt: new Date().toISOString(),
      latencyMs: Date.now() - startedAt,
    };
  } catch (error) {
    console.error("Health check failed:", error);
    throw createError({
      statusCode: 503,
      message: "Service unavailable",
      details: {
        status: "degraded",
        database: "unavailable",
        checkedAt: new Date().toISOString(),
        latencyMs: Date.now() - startedAt,
      },
    });
  } finally {
    if (client) await client.end().catch(() => undefined);
  }
};
