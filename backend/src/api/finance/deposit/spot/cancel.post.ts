import { models } from "@b/db";
import { createError } from "@b/utils/error";

export const metadata: OperationObject = {
  summary: "Cancel a spot deposit",
  operationId: "cancelSpotDeposit",
  tags: ["Finance", "Deposit"],
  requiresAuth: true,
  requestBody: {
    required: true,
    content: {
      "application/json": {
        schema: {
          type: "object",
          properties: {
            trx: { type: "string" },
            reason: { type: "string" },
          },
          required: ["trx"],
        },
      },
    },
  },
  responses: { 200: { description: "Deposit cancelled" } },
};

export default async (data: Handler) => {
  const { user, body } = data;
  if (!user?.id) throw createError(401, "Unauthorized");

  const { trx, reason } = body;
  if (!trx) throw createError(400, "Transaction hash required");

  const tx = await models.transaction.findOne({
    where: { userId: user.id, referenceId: trx, type: "DEPOSIT", status: "PENDING" },
  });

  if (tx) {
    await tx.update({ status: "CANCELLED", metadata: { cancelReason: reason || "User cancelled" } });
  }

  return { message: "Deposit cancellation requested" };
};
