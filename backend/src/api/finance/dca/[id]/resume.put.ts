import { models } from "@b/db";
import { createError } from "@b/utils/error";

export const metadata: OperationObject = {
  summary: "Resume a DCA plan",
  operationId: "resumeDcaPlan",
  tags: ["Finance", "DCA"],
  requiresAuth: true,
  responses: { 200: { description: "Plan resumed" } },
};

export default async (data: Handler) => {
  const { user, params } = data;
  if (!user?.id) throw createError(401, "Unauthorized");

  const plan = await models.dcaPlan.findOne({
    where: { id: params.id, userId: user.id, status: "PAUSED" },
  });
  if (!plan) throw createError(404, "Paused DCA plan not found");

  const now = new Date();
  let nextExecution: Date;
  switch (plan.frequency) {
    case "DAILY": nextExecution = new Date(now.getTime() + 86400000); break;
    case "WEEKLY": nextExecution = new Date(now.getTime() + 7 * 86400000); break;
    case "BIWEEKLY": nextExecution = new Date(now.getTime() + 14 * 86400000); break;
    case "MONTHLY": nextExecution = new Date(now.setMonth(now.getMonth() + 1)); break;
    default: nextExecution = new Date(now.getTime() + 86400000);
  }

  await plan.update({ status: "ACTIVE", nextExecution });
  return { message: "DCA plan resumed" };
};
