import { models, sequelize } from "@b/db";
import { createError } from "@b/utils/error";

export const metadata: OperationObject = {
  summary: "Deposit into a savings vault",
  operationId: "createSavingsDeposit",
  tags: ["Finance", "Savings"],
  requiresAuth: true,
  requestBody: {
    required: true,
    content: {
      "application/json": {
        schema: {
          type: "object",
          properties: {
            vaultId: { type: "string" },
            amount: { type: "number" },
          },
          required: ["vaultId", "amount"],
        },
      },
    },
  },
  responses: { 200: { description: "Deposit created" } },
};

export default async (data: Handler) => {
  const { user, body } = data;
  if (!user?.id) throw createError(401, "Unauthorized");

  const { vaultId, amount } = body;
  if (!vaultId || !amount || amount <= 0) throw createError(400, "Invalid input");

  const vault = await models.savingsVault.findByPk(vaultId);
  if (!vault || !vault.status) throw createError(404, "Vault not found");
  if (amount < vault.minDeposit) throw createError(400, `Minimum deposit is ${vault.minDeposit}`);
  if (amount > vault.maxDeposit) throw createError(400, `Maximum deposit is ${vault.maxDeposit}`);

  const wallet = await models.wallet.findOne({
    where: { userId: user.id, currency: vault.currency, type: "SPOT" },
  });
  if (!wallet) throw createError(404, "Wallet not found");
  if (wallet.balance < amount) throw createError(400, "Insufficient balance");

  const maturesAt = vault.lockDays > 0
    ? new Date(Date.now() + vault.lockDays * 86400000)
    : null;

  const result = await sequelize.transaction(async (t) => {
    await wallet.update({ balance: wallet.balance - amount }, { transaction: t });

    const deposit = await models.savingsDeposit.create({
      userId: user.id,
      vaultId: vault.id,
      amount,
      status: "ACTIVE",
      depositedAt: new Date(),
      maturesAt,
    }, { transaction: t });

    await vault.update({ totalDeposited: (vault.totalDeposited || 0) + amount }, { transaction: t });

    return deposit;
  });

  return { message: "Deposit successful", data: result };
};
