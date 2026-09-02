import { models, sequelize } from "@b/db";
import { createError } from "@b/utils/error";

export const metadata: OperationObject = {
  summary: "Withdraw from savings deposit",
  operationId: "withdrawSavingsDeposit",
  tags: ["Finance", "Savings"],
  requiresAuth: true,
  responses: { 200: { description: "Withdrawal successful" } },
};

export default async (data: Handler) => {
  const { user, params } = data;
  if (!user?.id) throw createError(401, "Unauthorized");

  const deposit = await models.savingsDeposit.findOne({
    where: { id: params.depositId, userId: user.id, status: "ACTIVE" },
    include: [{ model: models.savingsVault, as: "vault" }],
  });
  if (!deposit) throw createError(404, "Active deposit not found");

  const vault = deposit.vault || await models.savingsVault.findByPk(deposit.vaultId);
  if (vault && vault.lockDays > 0 && deposit.maturesAt && new Date() < new Date(deposit.maturesAt)) {
    throw createError(400, "Deposit has not matured yet");
  }

  const daysHeld = Math.max(1, Math.floor((Date.now() - new Date(deposit.depositedAt).getTime()) / 86400000));
  const apy = vault ? vault.apy : 0;
  const earnedInterest = deposit.amount * (apy / 100) * (daysHeld / 365);
  const totalReturn = deposit.amount + earnedInterest;

  await sequelize.transaction(async (t) => {
    const wallet = await models.wallet.findOne({
      where: { userId: user.id, currency: vault ? vault.currency : "USDT", type: "SPOT" },
    });

    if (wallet) {
      await wallet.update({ balance: wallet.balance + totalReturn }, { transaction: t });
    }

    await deposit.update({
      status: "WITHDRAWN",
      earnedInterest,
      withdrawnAt: new Date(),
    }, { transaction: t });

    if (vault) {
      await vault.update({ totalDeposited: Math.max(0, (vault.totalDeposited || 0) - deposit.amount) }, { transaction: t });
    }
  });

  return { message: "Withdrawal successful", data: { amount: deposit.amount, earnedInterest, total: totalReturn } };
};
