import { models } from "@b/db";
import { createError } from "@b/utils/error";

export const metadata: OperationObject = {
  summary: "Sync offline transaction",
  operationId: "syncTransaction",
  tags: ["Finance", "Sync"],
  requiresAuth: true,
  requestBody: {
    required: true,
    content: {
      "application/json": {
        schema: {
          type: "object",
          properties: {
            id: { type: "string" },
            type: { type: "string" },
            amount: { type: "number" },
            currency: { type: "string" },
          },
          required: ["id", "type"],
        },
      },
    },
  },
  responses: { 200: { description: "Transaction synced" } },
};

export default async (data: Handler) => {
  const { user, body } = data;
  if (!user?.id) throw createError(401, "Unauthorized");

  const { id, type, amount, currency } = body;
  if (!id || !type) throw createError(400, "Missing transaction data");

  const existing = await models.transaction.findOne({
    where: { referenceId: id, userId: user.id },
  });

  if (existing) {
    return { message: "Transaction already synced", data: { id, status: "EXISTING" } };
  }

  return { message: "Transaction synced", data: { id, status: "SYNCED" } };
};
