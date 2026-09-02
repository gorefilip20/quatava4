import { models } from "@b/db";
import { createError } from "@b/utils/error";

export const metadata: OperationObject = {
  summary: "Get DCA plan execution history",
  operationId: "getDcaExecutions",
  tags: ["Finance", "DCA"],
  requiresAuth: true,
  responses: { 200: { description: "Executions retrieved" } },
};

export default async (data: Handler) => {
  const { user, params } = data;
  if (!user?.id) throw createError(401, "Unauthorized");

  const plan = await models.dcaPlan.findOne({
    where: { id: params.id, userId: user.id },
  });
  if (!plan) throw createError(404, "DCA plan not found");

  const executions = await models.dcaExecution.findAll({
    where: { planId: params.id },
    order: [["executedAt", "DESC"]],
  });

  return { data: executions };
};
