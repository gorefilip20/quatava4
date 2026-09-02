import { models } from "@b/db";
import { createError } from "@b/utils/error";

export const metadata: OperationObject = {
  summary: "Get card transactions",
  operationId: "listCardTransactions",
  tags: ["Finance", "Card"],
  requiresAuth: true,
  responses: { 200: { description: "Transactions retrieved" } },
};

export default async (data: Handler) => {
  const { user, params, query } = data;
  if (!user?.id) throw createError(401, "Unauthorized");

  const card = await models.card.findOne({
    where: { id: params.cardId, userId: user.id },
  });
  if (!card) throw createError(404, "Card not found");

  const page = parseInt(query?.page) || 1;
  const perPage = parseInt(query?.perPage) || 20;

  const { count, rows } = await models.cardTransaction.findAndCountAll({
    where: { cardId: params.cardId },
    order: [["createdAt", "DESC"]],
    limit: perPage,
    offset: (page - 1) * perPage,
  });

  return { data: rows, pagination: { total: count, page, perPage, totalPages: Math.ceil(count / perPage) } };
};
