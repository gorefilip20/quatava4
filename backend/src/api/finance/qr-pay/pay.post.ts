import { models, sequelize } from "@b/db";
import { createError } from "@b/utils/error";

export const metadata: OperationObject = {
  summary: "Pay via QR code",
  operationId: "payViaQr",
  tags: ["Finance", "QRPay"],
  requiresAuth: true,
  requestBody: {
    required: true,
    content: {
      "application/json": {
        schema: {
          type: "object",
          properties: {
            qrData: { type: "string" },
          },
          required: ["qrData"],
        },
      },
    },
  },
  responses: { 200: { description: "Payment processed" } },
};

export default async (data: Handler) => {
  const { user, body } = data;
  if (!user?.id) throw createError(401, "Unauthorized");

  const { qrData } = body;
  if (!qrData) throw createError(400, "QR data required");

  let parsed: any;
  try { parsed = JSON.parse(qrData); }
  catch { throw createError(400, "Invalid QR data"); }

  const { amount, currency, userId: recipientId, expiresAt } = parsed;
  if (!amount || !currency || !recipientId) throw createError(400, "Invalid QR data");

  if (new Date(expiresAt) < new Date()) throw createError(400, "QR code expired");
  if (recipientId === user.id) throw createError(400, "Cannot pay yourself");

  const senderWallet = await models.wallet.findOne({
    where: { userId: user.id, currency, type: "SPOT" },
  });
  if (!senderWallet) throw createError(404, "Wallet not found");
  if (senderWallet.balance < amount) throw createError(400, "Insufficient balance");

  await sequelize.transaction(async (t) => {
    await senderWallet.update({ balance: senderWallet.balance - amount }, { transaction: t });

    let recipientWallet = await models.wallet.findOne({
      where: { userId: recipientId, currency, type: "SPOT" },
    });
    if (!recipientWallet) {
      recipientWallet = await models.wallet.create({
        userId: recipientId, currency, type: "SPOT", balance: 0, status: true,
      }, { transaction: t });
    }
    await recipientWallet.update({ balance: recipientWallet.balance + amount }, { transaction: t });
  });

  return { message: "Payment successful", data: { amount, currency } };
};
