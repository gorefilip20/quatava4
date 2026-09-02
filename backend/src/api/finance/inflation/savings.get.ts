import { models } from "@b/db";
import { createError } from "@b/utils/error";
import { fn, col } from "sequelize";

export const metadata: OperationObject = {
  summary: "Get inflation savings stats",
  operationId: "getInflationSavings",
  tags: ["Finance", "Inflation"],
  requiresAuth: true,
  responses: { 200: { description: "Savings stats" } },
};

export default async (data: Handler) => {
  const { user } = data;
  if (!user?.id) throw createError(401, "Unauthorized");

  const wallets = await models.wallet.findAll({
    attributes: ["currency", "balance"],
    where: { userId: user.id, type: "SPOT" },
    raw: true,
  });

  const totalHoldings = (wallets as any[]).reduce((sum, w) => sum + (parseFloat(w.balance) || 0), 0);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const deposits = await models.transaction.findAll({
    attributes: [[fn("SUM", col("amount")), "total"]],
    where: { userId: user.id, type: "DEPOSIT", createdAt: { $gte: monthStart } },
    raw: true,
  });

  const savedThisMonth = parseFloat((deposits as any[])[0]?.total) || 0;

  return { data: { savedThisMonth, totalHoldings } };
};
