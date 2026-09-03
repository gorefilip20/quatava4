import { models } from "@b/db";
import { createError } from "@b/utils/error";

export const metadata: OperationObject = {
  summary: "List withdrawals",
  operationId: "listWithdrawals",
  tags: ["Finance", "Withdraw"],
  requiresAuth: true,
  responses: { 200: { description: "Withdrawal list" } },
};

export default async (data: Handler) => {
  const { user } = data;
  if (!user?.id) throw createError(401, "Unauthorized");

  const withdrawals = await models.transaction.findAll({
    where: { userId: user.id, type: "WITHDRAW" },
    order: [["createdAt", "DESC"]],
    limit: 50,
    raw: true,
  });

  return { data: withdrawals };
};
