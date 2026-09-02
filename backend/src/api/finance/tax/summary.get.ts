import { models } from "@b/db";
import { createError } from "@b/utils/error";
import { Op } from "sequelize";

export const metadata: OperationObject = {
  summary: "Get tax summary",
  operationId: "getTaxSummary",
  tags: ["Finance", "Tax"],
  requiresAuth: true,
  parameters: [{ name: "year", in: "query", schema: { type: "integer" } }],
  responses: { 200: { description: "Summary retrieved" } },
};

export default async (data: Handler) => {
  const { user, query } = data;
  if (!user?.id) throw createError(401, "Unauthorized");

  const year = parseInt(query?.year) || new Date().getFullYear();
  const startDate = new Date(`${year}-01-01`);
  const endDate = new Date(`${year + 1}-01-01`);

  const transactions = await models.transaction.findAll({
    where: {
      userId: user.id,
      createdAt: { [Op.gte]: startDate, [Op.lt]: endDate },
      status: "COMPLETED",
    },
  });

  let totalGains = 0;
  let totalLosses = 0;
  const taxableEvents: any[] = [];

  for (const tx of transactions) {
    const amount = parseFloat(tx.amount) || 0;
    const fee = parseFloat(tx.fee) || 0;

    if (["TRADE", "EXCHANGE", "CONVERT"].includes(tx.type)) {
      const gain = amount - fee;
      if (gain > 0) { totalGains += gain; }
      else { totalLosses += Math.abs(gain); }
      taxableEvents.push({
        date: tx.createdAt, type: tx.type, amount, fee, netGain: gain,
      });
    }
  }

  return {
    data: {
      year, totalGains: Math.round(totalGains * 100) / 100,
      totalLosses: Math.round(totalLosses * 100) / 100,
      netGain: Math.round((totalGains - totalLosses) * 100) / 100,
      totalTransactions: transactions.length,
      taxableEvents: taxableEvents.slice(0, 50),
    },
  };
};
