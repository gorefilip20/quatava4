import { models } from "@b/db";
import { createError } from "@b/utils/error";

export const metadata: OperationObject = {
  summary: "Freeze a card",
  operationId: "freezeCard",
  tags: ["Finance", "Card"],
  requiresAuth: true,
  responses: { 200: { description: "Card frozen" } },
};

export default async (data: Handler) => {
  const { user, params } = data;
  if (!user?.id) throw createError(401, "Unauthorized");

  const card = await models.card.findOne({
    where: { id: params.cardId, userId: user.id, status: "ACTIVE" },
  });
  if (!card) throw createError(404, "Active card not found");

  await card.update({ status: "FROZEN" });
  return { message: "Card frozen" };
};
