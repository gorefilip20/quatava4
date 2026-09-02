import { models } from "@b/db";
import { createError } from "@b/utils/error";

export const metadata: OperationObject = {
  summary: "Cancel a DCA plan",
  operationId: "cancelDcaPlan",
  tags: ["Finance", "DCA"],
  requiresAuth: true,
  responses: { 200: { description: "Plan cancelled" } },
};

export default async (data: Handler) => {
  const { user, params } = data;
  if (!user?.id) throw createError(401, "Unauthorized");

  const plan = await models.dcaPlan.findOne({
    where: { id: params.id, userId: user.id },
  });
  if (!plan) throw createError(404, "DCA plan not found");
  if (plan.status === "CANCELLED") throw createError(400, "Plan already cancelled");

  await plan.update({ status: "CANCELLED" });
  return { message: "DCA plan cancelled" };
};
