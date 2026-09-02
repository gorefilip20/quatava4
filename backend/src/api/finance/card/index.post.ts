import { models } from "@b/db";
import { createError } from "@b/utils/error";
import crypto from "crypto";

export const metadata: OperationObject = {
  summary: "Request a new card",
  operationId: "createCard",
  tags: ["Finance", "Card"],
  requiresAuth: true,
  requestBody: {
    required: true,
    content: {
      "application/json": {
        schema: {
          type: "object",
          properties: {
            cardType: { type: "string", enum: ["VIRTUAL", "PHYSICAL"] },
            tier: { type: "string", enum: ["STANDARD", "PREMIUM", "ELITE"] },
          },
          required: ["cardType"],
        },
      },
    },
  },
  responses: { 200: { description: "Card created" } },
};

const TIER_CONFIG = {
  STANDARD: { cashbackRate: 1, spendingLimit: 1000 },
  PREMIUM: { cashbackRate: 2, spendingLimit: 5000 },
  ELITE: { cashbackRate: 3, spendingLimit: 25000 },
};

export default async (data: Handler) => {
  const { user, body } = data;
  if (!user?.id) throw createError(401, "Unauthorized");

  const { cardType = "VIRTUAL", tier = "STANDARD" } = body;
  const config = TIER_CONFIG[tier as keyof typeof TIER_CONFIG] || TIER_CONFIG.STANDARD;
  const cardNumber = crypto.randomInt(1000, 9999).toString();

  const card = await models.card.create({
    userId: user.id,
    cardNumber,
    cardType,
    tier,
    currency: "USDT",
    status: "ACTIVE",
    cashbackRate: config.cashbackRate,
    spendingLimit: config.spendingLimit,
  });

  return { message: "Card created successfully", data: card };
};
