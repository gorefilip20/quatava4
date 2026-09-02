import { models } from "@b/db";
import { createError } from "@b/utils/error";

export const metadata: OperationObject = {
  summary: "List merchant transactions",
  operationId: "listMerchantTransactions",
  tags: ["Finance", "Merchant"],
  requiresAuth: true,
  responses: { 200: { description: "Transactions retrieved" } },
};

export default async (data: Handler) => {
  const { user, query } = data;
  if (!user?.id) throw createError(401, "Unauthorized");

  const profile = await models.merchantProfile.findOne({ where: { userId: user.id } });
  if (!profile) throw createError(404, "Merchant profile not found");

  const page = parseInt(query?.page) || 1;
  const perPage = parseInt(query?.perPage) || 20;

  const { count, rows } = await models.merchantTransaction.findAndCountAll({
    where: { merchantId: profile.id },
    order: [["createdAt", "DESC"]],
    limit: perPage,
    offset: (page - 1) * perPage,
  });

  return { data: rows, pagination: { total: count, page, perPage, totalPages: Math.ceil(count / perPage) } };
};
