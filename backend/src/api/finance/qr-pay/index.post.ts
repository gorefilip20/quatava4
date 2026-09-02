import { models, sequelize } from "@b/db";
import { createError } from "@b/utils/error";

export const metadata: OperationObject = {
  summary: "Process QR payment",
  operationId: "processQrPayment",
  tags: ["Finance", "QRPay"],
  requiresAuth: true,
  requestBody: {
    required: true,
    content: {
      "application/json": {
        schema: {
          type: "object",
          properties: {
            type: { type: "string" },
            merchantId: { type: "string" },
            qrData: { type: "string" },
            amount: { type: "number" },
            currency: { type: "string" },
          },
        },
      },
    },
  },
  responses: { 200: { description: "Payment processed" } },
};

export default async (data: Handler) => {
  const { user, body } = data;
  if (!user?.id) throw createError(401, "Unauthorized");

  const { type, merchantId, qrData, amount, currency = "USDT" } = body;

  if (qrData) {
    let parsed: any;
    try { parsed = JSON.parse(qrData); }
    catch { throw createError(400, "Invalid QR data"); }

    const { amount: qrAmount, currency: qrCurrency, userId: recipientId, expiresAt } = parsed;
    if (!qrAmount || !qrCurrency || !recipientId) throw createError(400, "Invalid QR data");
    if (new Date(expiresAt) < new Date()) throw createError(400, "QR code expired");
    if (recipientId === user.id) throw createError(400, "Cannot pay yourself");

    const senderWallet = await models.wallet.findOne({
      where: { userId: user.id, currency: qrCurrency, type: "SPOT" },
    });
    if (!senderWallet) throw createError(404, "Wallet not found");
    if (senderWallet.balance < qrAmount) throw createError(400, "Insufficient balance");

    await sequelize.transaction(async (t) => {
      await senderWallet.update({ balance: senderWallet.balance - qrAmount }, { transaction: t });
      let recipientWallet = await models.wallet.findOne({
        where: { userId: recipientId, currency: qrCurrency, type: "SPOT" },
      });
      if (!recipientWallet) {
        recipientWallet = await models.wallet.create({
          userId: recipientId, currency: qrCurrency, type: "SPOT", balance: 0, status: true,
        }, { transaction: t });
      }
      await recipientWallet.update({ balance: recipientWallet.balance + qrAmount }, { transaction: t });
    });

    return { message: "Payment successful", data: { amount: qrAmount, currency: qrCurrency } };
  }

  if (type === "PAY" && merchantId) {
    if (!amount || amount <= 0) throw createError(400, "Invalid amount");

    const senderWallet = await models.wallet.findOne({
      where: { userId: user.id, currency, type: "SPOT" },
    });
    if (!senderWallet) throw createError(404, "Wallet not found");
    if (senderWallet.balance < amount) throw createError(400, "Insufficient balance");

    await senderWallet.update({ balance: senderWallet.balance - amount });

    return { message: "Payment successful", data: { amount, currency, merchantId } };
  }

  throw createError(400, "Provide either qrData or type/merchantId/amount");
};
