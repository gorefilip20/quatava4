import { models } from "@b/db";
import { createError } from "@b/utils/error";
import { Op } from "sequelize";

export const metadata: OperationObject = {
  summary: "Generate tax report",
  operationId: "generateTaxReport",
  tags: ["Finance", "Tax"],
  requiresAuth: true,
  requestBody: {
    required: true,
    content: {
      "application/json": {
        schema: {
          type: "object",
          properties: {
            year: { type: "integer" },
            type: { type: "string", enum: ["ANNUAL", "QUARTERLY"] },
          },
          required: ["year"],
        },
      },
    },
  },
  responses: { 200: { description: "Report generated" } },
};

export default async (data: Handler) => {
  const { user, body } = data;
  if (!user?.id) throw createError(401, "Unauthorized");

  const { year, type = "ANNUAL" } = body;
  if (!year) throw createError(400, "Year is required");

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
  for (const tx of transactions) {
    const amount = parseFloat(tx.amount) || 0;
    const fee = parseFloat(tx.fee) || 0;
    if (["TRADE", "EXCHANGE", "CONVERT"].includes(tx.type)) {
      const gain = amount - fee;
      if (gain > 0) totalGains += gain;
      else totalLosses += Math.abs(gain);
    }
  }

  const report = await models.taxReport.create({
    userId: user.id, year, type,
    totalGains: Math.round(totalGains * 100) / 100,
    totalLosses: Math.round(totalLosses * 100) / 100,
    netGain: Math.round((totalGains - totalLosses) * 100) / 100,
    totalTransactions: transactions.length,
    generatedAt: new Date(), status: "GENERATED",
  });

  return { message: "Tax report generated", data: report };
};
