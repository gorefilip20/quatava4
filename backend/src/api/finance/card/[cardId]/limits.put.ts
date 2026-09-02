import { models } from "@b/db";
import { createError } from "@b/utils/error";

export const metadata: OperationObject = {
  summary: "Update card spending limit",
  operationId: "updateCardLimits",
  tags: ["Finance", "Card"],
  requiresAuth: true,
  requestBody: {
    required: true,
    content: {
      "application/json": {
        schema: {
          type: "object",
          properties: {
            dailyLimit: { type: "number" },
            monthlyLimit: { type: "number" },
          },
        },
      },
    },
  },
  responses: { 200: { description: "Limits updated" } },
};

const TIER_MAX = { STANDARD: 5000, PREMIUM: 25000, ELITE: 100000 };

export default async (data: Handler) => {
  const { user, params, body } = data;
  if (!user?.id) throw createError(401, "Unauthorized");

  const { dailyLimit, monthlyLimit } = body;
  const spendingLimit = monthlyLimit || dailyLimit;
  if (!spendingLimit || spendingLimit <= 0) throw createError(400, "Invalid limit");

  const card = await models.card.findOne({
    where: { id: params.cardId, userId: user.id },
  });
  if (!card) throw createError(404, "Card not found");

  const max = TIER_MAX[card.tier as keyof typeof TIER_MAX] || 5000;
  if (spendingLimit > max) throw createError(400, `Maximum limit for ${card.tier} tier is ${max}`);

  await card.update({ spendingLimit });
  return { message: "Spending limit updated" };
};
