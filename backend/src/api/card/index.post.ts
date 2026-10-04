import crypto from "crypto";
import { models } from "@b/db";
import { createError } from "@b/utils/error";
import { recordActivity } from "@b/api/finance/phase2-utils";
export const metadata: OperationObject = { summary: "Create virtual USD card", operationId: "createVirtualCard", tags: ["Card"], requiresAuth: true, responses: { 200: { description: "Success" } } };
export default async (data: Handler) => {
  if (!data.user?.id) throw createError({ statusCode: 401, message: "Unauthorized" });
  const existing = await models.virtualCard.findOne({ where: { userId: data.user.id } });
  if (existing) return { card: existing.get({ plain: true }), created: false };
  const now = new Date();
  const card = await models.virtualCard.create({ userId: data.user.id, cardholderName: `${data.user.firstName || "Quatava"} ${data.user.lastName || "User"}`.trim().toUpperCase(), last4: crypto.createHash("sha256").update(`${data.user.id}:card`).digest("hex").slice(-4), expiryMonth: now.getMonth() + 1, expiryYear: now.getFullYear() + 4, providerReference: `mock_${crypto.randomUUID()}`, balance: 0, status: "ACTIVE" });
  await recordActivity(data.user.id, "CARD_CREATED", "CARD", { cardId: card.id }, data);
  return { message: "Virtual USD card created", card: card.get({ plain: true }), created: true };
};
