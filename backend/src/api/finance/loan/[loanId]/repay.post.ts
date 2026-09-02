import { models, sequelize } from "@b/db";
import { createError } from "@b/utils/error";

export const metadata: OperationObject = {
  summary: "Repay a loan",
  operationId: "repayLoan",
  tags: ["Finance", "Loan"],
  requiresAuth: true,
  requestBody: {
    required: true,
    content: {
      "application/json": {
        schema: {
          type: "object",
          properties: { amount: { type: "number" } },
          required: ["amount"],
        },
      },
    },
  },
  responses: { 200: { description: "Loan repayment processed" } },
};

export default async (data: Handler) => {
  const { user, params, body } = data;
  if (!user?.id) throw createError(401, "Unauthorized");

  const { amount } = body;
  if (!amount || amount <= 0) throw createError(400, "Invalid amount");

  const loan = await models.loan.findOne({
    where: { id: params.loanId, userId: user.id, status: "ACTIVE" },
  });
  if (!loan) throw createError(404, "Active loan not found");

  const wallet = await models.wallet.findOne({
    where: { userId: user.id, currency: loan.loanCurrency, type: "SPOT" },
  });
  if (!wallet) throw createError(404, "Wallet not found");
  if (wallet.balance < amount) throw createError(400, "Insufficient balance");

  const totalOwed = loan.loanAmount * (1 + loan.interestRate / 100);
  const newRepaid = (loan.repaidAmount || 0) + amount;
  const fullyRepaid = newRepaid >= totalOwed;

  await sequelize.transaction(async (t) => {
    await wallet.update({ balance: wallet.balance - amount }, { transaction: t });
    await loan.update({
      repaidAmount: newRepaid,
      status: fullyRepaid ? "REPAID" : "ACTIVE",
    }, { transaction: t });

    if (fullyRepaid) {
      const collateralWallet = await models.wallet.findOne({
        where: { userId: user.id, currency: loan.collateralCurrency, type: "SPOT" },
      });
      if (collateralWallet) {
        await collateralWallet.update({
          balance: collateralWallet.balance + loan.collateralAmount,
        }, { transaction: t });
      }
    }
  });

  return {
    message: fullyRepaid ? "Loan fully repaid, collateral released" : "Repayment processed",
    data: { repaidAmount: newRepaid, remaining: Math.max(0, totalOwed - newRepaid), fullyRepaid },
  };
};
