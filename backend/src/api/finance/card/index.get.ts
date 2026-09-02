import { models } from "@b/db";
import { createError } from "@b/utils/error";

export const metadata: OperationObject = {
  summary: "Get user's cards",
  operationId: "listCards",
  tags: ["Finance", "Card"],
  requiresAuth: true,
  responses: { 200: { description: "Cards retrieved" } },
};

export default async (data: Handler) => {
  const { user } = data;
  if (!user?.id) throw createError(401, "Unauthorized");

  const cards = await models.card.findAll({
    where: { userId: user.id },
    order: [["createdAt", "DESC"]],
  });

  return { data: cards };
};
