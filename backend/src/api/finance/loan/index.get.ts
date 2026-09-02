import { models } from "@b/db";
import { createError } from "@b/utils/error";

export const metadata: OperationObject = {
  summary: "List user's loans",
  operationId: "listLoans",
  tags: ["Finance", "Loan"],
  requiresAuth: true,
  responses: { 200: { description: "Loans retrieved" } },
};

export default async (data: Handler) => {
  const { user } = data;
  if (!user?.id) throw createError(401, "Unauthorized");

  const loans = await models.loan.findAll({
    where: { userId: user.id },
    order: [["createdAt", "DESC"]],
  });

  return { data: loans };
};
