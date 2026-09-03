import { models } from "@b/db";
import { createError } from "@b/utils/error";

export const metadata: OperationObject = {
  summary: "Get transaction history",
  operationId: "getTransactionHistory",
  tags: ["Finance", "Transaction"],
  requiresAuth: true,
  responses: { 200: { description: "Transaction history" } },
};

export default async (data: Handler) => {
  const { user, query } = data;
  if (!user?.id) throw createError(401, "Unauthorized");

  const where: any = { userId: user.id };

  if (query?.type) where.type = query.type;
  if (query?.status) where.status = query.status;
  if (query?.currency) where.currency = query.currency;

  const limit = Math.min(parseInt(query?.limit) || 50, 100);
  const offset = parseInt(query?.offset) || 0;

  const { rows, count } = await models.transaction.findAndCountAll({
    where,
    order: [["createdAt", "DESC"]],
    limit,
    offset,
    raw: true,
  });

  return { data: rows, total: count, limit, offset };
};
