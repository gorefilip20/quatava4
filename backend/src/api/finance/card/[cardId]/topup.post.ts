import { models, sequelize } from "@b/db";
import { createError } from "@b/utils/error";

export const metadata: OperationObject = {
  summary: "Top up card balance",
  operationId: "topupCard",
  tags: ["Finance", "Card"],
  requiresAuth: true,
  requestBody: {
    required: true,
    content: {
      "application/json": {
        schema: {
          type: "object",
          properties: {
            amount: { type: "number" },
            fromCurrency: { type: "string" },
          },
          required: ["amount"],
        },
      },
    },
  },
  responses: { 200: { description: "Card topped up" } },
};

export default async (data: Handler) => {
  const { user, params, body } = data;
  if (!user?.id) throw createError(401, "Unauthorized");

  const { amount, fromCurrency = "USDT" } = body;
  if (!amount || amount <= 0) throw createError(400, "Invalid amount");

  const card = await models.card.findOne({
    where: { id: params.cardId, userId: user.id },
  });
  if (!card) throw createError(404, "Card not found");
  if (card.status !== "ACTIVE") throw createError(400, "Card is not active");

  const wallet = await models.wallet.findOne({
    where: { userId: user.id, currency: fromCurrency, type: "SPOT" },
  });
  if (!wallet) throw createError(404, "Wallet not found");
  if (wallet.balance < amount) throw createError(400, "Insufficient balance");

  await sequelize.transaction(async (t) => {
    await wallet.update({ balance: wallet.balance - amount }, { transaction: t });
    await card.update({ balance: card.balance + amount }, { transaction: t });
    await models.cardTransaction.create({
      cardId: card.id, userId: user.id, type: "TOPUP", amount, currency: fromCurrency, status: "COMPLETED",
    }, { transaction: t });
  });

  return { message: "Card topped up", data: { newBalance: card.balance + amount } };
};
