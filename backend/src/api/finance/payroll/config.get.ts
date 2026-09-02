import { models } from "@b/db";
import { createError } from "@b/utils/error";

export const metadata: OperationObject = {
  summary: "Get payroll config",
  operationId: "getPayrollConfig",
  tags: ["Finance", "Payroll"],
  requiresAuth: true,
  responses: { 200: { description: "Config retrieved" } },
};

export default async (data: Handler) => {
  const { user } = data;
  if (!user?.id) throw createError(401, "Unauthorized");

  const config = await models.payrollConfig.findOne({ where: { userId: user.id } });
  return { data: config };
};
