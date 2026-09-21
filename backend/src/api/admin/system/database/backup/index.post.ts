// file: backend/api/admin/system/database/backup/index.post.ts
import { createError } from "@b/utils/error";
import { promises as fs } from "fs";
import path from "path";
import { format } from "date-fns";
import { createPostgresBackup } from "@b/utils/postgres-backup";

export const metadata = {
  summary: "Backs up the database",
  description: "Creates a backup of the entire database",
  operationId: "backupDatabase",
  tags: ["Admin", "Database"],
  requiresAuth: true,
  responses: {
    200: {
      description: "Database backup created successfully",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              message: {
                type: "string",
                description: "Success message",
              },
              backupFile: {
                type: "string",
                description: "Path to the backup file",
              },
            },
          },
        },
      },
    },
    500: {
      description: "Internal server error",
    },
  },
  permission: "access.database",
};

export default async (data: Handler) => {
  try {
    const backupDir = path.resolve(process.cwd(), "backup");
    const backupFileName = `${format(new Date(), "yyyy_MM_dd_HH_mm_ss")}.sql`;
    const backupPath = path.resolve(backupDir, backupFileName);

    // Ensure the backup directory exists
    await fs.mkdir(backupDir, { recursive: true });

    await createPostgresBackup(backupPath);

    return {
      message: "Database backup created successfully",
    };
  } catch (error) {
    throw createError({
      statusCode: 500,
      message: error.message,
    });
  }
};
