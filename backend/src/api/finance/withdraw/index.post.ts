import { models, sequelize } from "@b/db";
import { createError } from "@b/utils/error";

export const metadata: OperationObject = {
  summary: "Cash out crypto to fiat",
  operationId: "cashOutWithdraw",
  tags: ["Finance", "Withdraw"],
  requiresAuth: true,
  requestBody: {
    required: true,
    content: {
      "application/json": {
        schema: {
          type: "object",
          properties: {
            crypto: { type: "string" },
            amount: { type: "number" },
            fiatCurrency: { type: "string" },
            bankName: { type: "string" },
            accountNumber: { type: "string" },
            accountType: { type: "string" },
          },
          required: ["crypto", "amount", "bankName", "accountNumber"],
        },
      },
    },
  },
  responses: { 200: { description: "Cash out initiated" } },
};

export default async (data: Handler) => {
  const { user, body } = data;
  if (!user?.id) throw createError(401, "Unauthorized");

  const { crypto, amount, fiatCurrency, bankName, accountNumber, accountType } = body;
  if (!crypto || !amount || amount <= 0) throw createError(400, "Invalid parameters");
  if (!bankName || !accountNumber) throw createError(400, "Bank details required");

  const wallet = await models.wallet.findOne({
    where: { userId: user.id, currency: crypto, type: "SPOT" },
  });
  if (!wallet) throw createError(404, "Wallet not found");
  if (wallet.balance < amount) throw createError(400, "Insufficient balance");

  const tx = await sequelize.transaction(async (t) => {
    await wallet.update({ balance: wallet.balance - amount }, { transaction: t });

    return await models.transaction.create({
      userId: user.id,
      walletId: wallet.id,
      type: "WITHDRAW",
      amount,
      currency: crypto,
      status: "PENDING",
      metadata: { fiatCurrency, bankName, accountNumber, accountType },
    }, { transaction: t });
  });

  return { message: "Cash out initiated", data: tx };
};
