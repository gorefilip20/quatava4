import { models } from "@b/db";
import { createError } from "@b/utils/error";

export const metadata: OperationObject = {
  summary: "Create a DCA plan",
  operationId: "createDcaPlan",
  tags: ["Finance", "DCA"],
  requiresAuth: true,
  requestBody: {
    required: true,
    content: {
      "application/json": {
        schema: {
          type: "object",
          properties: {
            fromCurrency: { type: "string" },
            toCurrency: { type: "string" },
            amount: { type: "number" },
            frequency: { type: "string", enum: ["DAILY", "WEEKLY", "BIWEEKLY", "MONTHLY"] },
          },
          required: ["fromCurrency", "toCurrency", "amount", "frequency"],
        },
      },
    },
  },
  responses: { 200: { description: "DCA plan created" } },
};

function calculateNextExecution(frequency: string): Date {
  const now = new Date();
  switch (frequency) {
    case "DAILY": return new Date(now.getTime() + 86400000);
    case "WEEKLY": return new Date(now.getTime() + 7 * 86400000);
    case "BIWEEKLY": return new Date(now.getTime() + 14 * 86400000);
    case "MONTHLY": return new Date(now.setMonth(now.getMonth() + 1));
    default: return new Date(now.getTime() + 86400000);
  }
}

export default async (data: Handler) => {
  const { user, body } = data;
  if (!user?.id) throw createError(401, "Unauthorized");

  const { fromCurrency, toCurrency, amount, frequency } = body;
  if (!fromCurrency || !toCurrency || !amount || !frequency)
    throw createError(400, "Missing required fields");
  if (amount <= 0) throw createError(400, "Amount must be positive");

  const wallet = await models.wallet.findOne({
    where: { userId: user.id, currency: fromCurrency, type: "SPOT" },
  });
  if (!wallet) throw createError(404, "Source wallet not found");

  const plan = await models.dcaPlan.create({
    userId: user.id,
    fromCurrency,
    toCurrency,
    amount,
    frequency,
    nextExecution: calculateNextExecution(frequency),
    status: "ACTIVE",
  });

  return { message: "DCA plan created successfully", data: plan };
};
