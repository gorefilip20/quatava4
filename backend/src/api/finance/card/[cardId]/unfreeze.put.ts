import { models } from "@b/db";
import { createError } from "@b/utils/error";

export const metadata: OperationObject = {
  summary: "Unfreeze a card",
  operationId: "unfreezeCard",
  tags: ["Finance", "Card"],
  requiresAuth: true,
  responses: { 200: { description: "Card unfrozen" } },
};

export default async (data: Handler) => {
  const { user, params } = data;
  if (!user?.id) throw createError(401, "Unauthorized");

  const card = await models.card.findOne({
    where: { id: params.cardId, userId: user.id, status: "FROZEN" },
  });
  if (!card) throw createError(404, "Frozen card not found");

  await card.update({ status: "ACTIVE" });
  return { message: "Card unfrozen" };
};
