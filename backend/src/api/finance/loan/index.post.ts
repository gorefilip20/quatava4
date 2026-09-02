import { models, sequelize } from "@b/db";
import { createError } from "@b/utils/error";

export const metadata: OperationObject = {
  summary: "Create a new loan",
  operationId: "createLoan",
  tags: ["Finance", "Loan"],
  requiresAuth: true,
  requestBody: {
    required: true,
    content: {
      "application/json": {
        schema: {
          type: "object",
          properties: {
            termId: { type: "string" },
            collateralCurrency: { type: "string" },
            collateralAmount: { type: "number" },
            borrowCurrency: { type: "string" },
            durationDays: { type: "number" },
          },
          required: ["collateralCurrency", "collateralAmount"],
        },
      },
    },
  },
  responses: { 200: { description: "Loan created" } },
};

export default async (data: Handler) => {
  const { user, body } = data;
  if (!user?.id) throw createError(401, "Unauthorized");

  const { termId, collateralCurrency, collateralAmount, borrowCurrency, durationDays } = body;
  if (!collateralCurrency || !collateralAmount)
    throw createError(400, "Missing required fields");

  let term: any;
  if (termId) {
    term = await models.loanTerm.findByPk(termId);
  } else if (durationDays) {
    term = await models.loanTerm.findOne({ where: { termDays: durationDays, status: true } });
  } else {
    term = await models.loanTerm.findOne({ where: { status: true }, order: [["termDays", "ASC"]] });
  }
  if (!term || !term.status) throw createError(404, "Loan term not found");
  if (collateralAmount < term.minCollateral)
    throw createError(400, `Minimum collateral is ${term.minCollateral}`);

  const wallet = await models.wallet.findOne({
    where: { userId: user.id, currency: collateralCurrency, type: "SPOT" },
  });
  if (!wallet) throw createError(404, "Collateral wallet not found");
  if (wallet.balance < collateralAmount)
    throw createError(400, "Insufficient collateral balance");

  const loanCurrency = borrowCurrency || "USDT";
  const loanAmount = collateralAmount * (term.maxLtv / 100);
  const dueDate = new Date(Date.now() + term.termDays * 86400000);

  const loan = await sequelize.transaction(async (t) => {
    await wallet.update({ balance: wallet.balance - collateralAmount }, { transaction: t });

    let targetWallet = await models.wallet.findOne({
      where: { userId: user.id, currency: loanCurrency, type: "SPOT" },
    });
    if (!targetWallet) {
      targetWallet = await models.wallet.create({
        userId: user.id, currency: loanCurrency, type: "SPOT", balance: 0, status: true,
      }, { transaction: t });
    }
    await targetWallet.update({ balance: targetWallet.balance + loanAmount }, { transaction: t });

    return await models.loan.create({
      userId: user.id,
      collateralCurrency,
      collateralAmount,
      loanCurrency,
      loanAmount,
      interestRate: term.interestRate,
      termDays: term.termDays,
      status: "ACTIVE",
      ltv: term.maxLtv,
      dueDate,
    }, { transaction: t });
  });

  return { message: "Loan created successfully", data: loan };
};
