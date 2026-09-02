import { models } from "@b/db";
import { createError } from "@b/utils/error";

export const metadata: OperationObject = {
  summary: "List user's savings deposits",
  operationId: "listSavingsDeposits",
  tags: ["Finance", "Savings"],
  requiresAuth: true,
  responses: { 200: { description: "Deposits retrieved" } },
};

export default async (data: Handler) => {
  const { user } = data;
  if (!user?.id) throw createError(401, "Unauthorized");

  const deposits = await models.savingsDeposit.findAll({
    where: { userId: user.id },
    include: [{ model: models.savingsVault, as: "vault" }],
    order: [["createdAt", "DESC"]],
  });

  return { data: deposits };
};
