// file: backend/api/admin/system/database/restore/index.post.ts
import { createError } from "@b/utils/error";
import { promises as fs } from "fs";
import path from "path";
import { sanitizePath } from "@b/utils/validation";
import { restorePostgresBackup } from "@b/utils/postgres-backup";

export const metadata = {
  summary: "Restores the PostgreSQL database from a backup file",
  description: "Restores the PostgreSQL database from a specified backup file",
  operationId: "restoreDatabase",
  tags: ["Admin", "Database"],
  requiresAuth: true,
  requestBody: {
    required: true,
    content: {
      "application/json": {
        schema: {
          type: "object",
          properties: {
            backupFile: {
              type: "string",
              description: "Path to the PostgreSQL backup file",
            },
          },
          required: ["backupFile"],
        },
      },
    },
  },
  responses: {
    200: {
      description: "Database restored successfully",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              message: { type: "string", description: "Success message" },
            },
          },
        },
      },
    },
    500: { description: "Internal server error" },
  },
  permission: "access.database",
};

export default async (data: Handler) => {
  try {
    const backupFile = data.body?.backupFile;
    if (!backupFile) {
      throw new Error("Backup file path is required");
    }

    // Sanitize the user-provided filename to prevent local file inclusion.
    const sanitizedBackupFile = sanitizePath(backupFile);
    const backupPath = path.resolve(
      process.cwd(),
      "backup",
      sanitizedBackupFile
    );

    await fs.access(backupPath);
    await restorePostgresBackup(backupPath);

    return { message: "PostgreSQL database restored successfully" };
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      message: `Error restoring PostgreSQL database: ${error.message}`,
    });
  }
};
