import { createError } from "@b/utils/error";

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

  try {
    const { sequelize } = await import("@b/db");
    await sequelize.authenticate();

    return {
      status: "ok",
      database: "ok",
      dialect: sequelize.getDialect(),
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
  }
};
