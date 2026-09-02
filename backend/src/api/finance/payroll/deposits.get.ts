import { models } from "@b/db";
import { createError } from "@b/utils/error";

export const metadata: OperationObject = {
  summary: "List payroll deposits",
  operationId: "listPayrollDeposits",
  tags: ["Finance", "Payroll"],
  requiresAuth: true,
  responses: { 200: { description: "Deposits retrieved" } },
};

export default async (data: Handler) => {
  const { user } = data;
  if (!user?.id) throw createError(401, "Unauthorized");

  const deposits = await models.payrollDeposit.findAll({
    where: { userId: user.id },
    include: [{ model: models.payrollConfig, as: "config" }],
    order: [["depositedAt", "DESC"]],
  });

  return { data: deposits };
};
